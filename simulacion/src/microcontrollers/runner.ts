import { DCVoltageSource } from "../components/sources/DCVoltageSource.ts";
import { TransientSolver } from "../simulation/TransientSolver.ts";
import { compileSketch, readCompiledArtifact } from "./compiler.ts";
import { runEsp32Firmware } from "./esp32.ts";
import { runUnoFirmware } from "./uno.ts";
import {
    BOARD_PROFILES,
    DEFAULT_SIMULATION_DURATION_SECONDS,
    MAX_SIMULATION_DURATION_SECONDS,
    type BoardId,
    type MicrocontrollerRunRequest,
    type MicrocontrollerRunResult,
    type PinEvent,
} from "./types.ts";

const MAX_ACTIVE_RUNS = 2;
let activeRuns = 0;

export async function runSketch(request: MicrocontrollerRunRequest): Promise<MicrocontrollerRunResult> {
    const empty: MicrocontrollerRunResult = {
        success: false, board: request.board, diagnostics: [], serial: [], pins: [], circuitSamples: [], errors: [],
    };
    if (activeRuns >= MAX_ACTIVE_RUNS) return { ...empty, errors: ["Simulation capacity is full; retry when another run finishes"] };
    const durationSeconds = request.durationSeconds ?? DEFAULT_SIMULATION_DURATION_SECONDS;
    const timeStepSeconds = request.timeStepSeconds ?? 0.001;
    if (!Object.hasOwn(BOARD_PROFILES, request.board)) return { ...empty, errors: [`Unsupported board: ${String(request.board)}`] };
    if (typeof request.sketch !== "string") return { ...empty, errors: ["Sketch source must be a string"] };
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > MAX_SIMULATION_DURATION_SECONDS) {
        return { ...empty, errors: [`Duration must be greater than 0 and no more than ${MAX_SIMULATION_DURATION_SECONDS} seconds`] };
    }
    if (!Number.isFinite(timeStepSeconds) || timeStepSeconds <= 0 || Math.ceil(durationSeconds / timeStepSeconds) > 100_000) {
        return { ...empty, errors: ["Time step must be positive and produce no more than 100000 circuit samples"] };
    }
    if (request.signal?.aborted) return { ...empty, errors: ["Simulation was cancelled"] };

    activeRuns += 1;
    let compiled: Awaited<ReturnType<typeof compileSketch>> | undefined;
    try {
        compiled = await compileSketch(request.board, request.sketch, request.signal);
        if (!compiled.artifactName) {
            const message = compiled.output || "Sketch compilation failed";
            return { ...empty, diagnostics: compiled.diagnostics.length ? compiled.diagnostics : [{ severity: "error", message }] };
        }
        const artifact = await readCompiledArtifact(compiled);
        const emulated = request.board === "arduino-uno-r3"
            ? await runUnoFirmware(new TextDecoder().decode(artifact), durationSeconds, request.inputs, request.signal)
            : await runEsp32Firmware(compiled, durationSeconds, request.inputs, request.signal);
        const circuitSamples = request.circuit && request.outputSources
            ? simulateCircuit(request.board, request.circuit, request.outputSources, emulated.pins, durationSeconds, timeStepSeconds)
            : [];
        return {
            success: true,
            board: request.board,
            diagnostics: compiled.diagnostics,
            serial: emulated.serial,
            pins: emulated.pins,
            circuitSamples,
            errors: [],
        };
    } catch (error) {
        return { ...empty, errors: [error instanceof Error ? error.message : String(error)] };
    } finally {
        try {
            if (compiled) await compiled.cleanup();
        } finally {
            activeRuns -= 1;
        }
    }
}

function simulateCircuit(
    board: BoardId,
    circuit: NonNullable<MicrocontrollerRunRequest["circuit"]>,
    outputSources: NonNullable<MicrocontrollerRunRequest["outputSources"]>,
    events: readonly PinEvent[],
    durationSeconds: number,
    timeStepSeconds: number,
) {
    const sources = new Map(circuit.getComponents().filter((part): part is DCVoltageSource => part instanceof DCVoltageSource).map(source => [source.id, source]));
    const waveforms: Record<string, (timeSeconds: number) => number> = {};
    const boundSources = new Set<string>();
    for (const [pinText, sourceId] of Object.entries(outputSources)) {
        const pin = Number(pinText);
        if (!Number.isInteger(pin) || pin < 0 || pin >= BOARD_PROFILES[board].pinCount) {
            throw new Error(`Invalid output pin ${pinText}`);
        }
        if (!sources.has(sourceId)) throw new Error(`Output source ${sourceId} is not a DC voltage source in the circuit`);
        if (boundSources.has(sourceId)) throw new Error(`Output source ${sourceId} is bound to more than one pin`);
        boundSources.add(sourceId);
        const pinEvents = events.filter(event => event.pin === pin && event.mode === "output").sort((a, b) => a.timeSeconds - b.timeSeconds);
        waveforms[sourceId] = timeSeconds => {
            let low = 0;
            let high = pinEvents.length;
            while (low < high) {
                const middle = (low + high) >>> 1;
                if (pinEvents[middle]!.timeSeconds <= timeSeconds) low = middle + 1;
                else high = middle;
            }
            return pinEvents[low - 1]?.voltage ?? 0;
        };
    }
    const result = new TransientSolver().simulate(circuit, {
        durationSeconds,
        timeStepSeconds,
        sourceWaveforms: waveforms,
    });
    if (!result.success) throw new Error(result.errors[0] ?? "Circuit simulation failed");
    return result.samples;
}

export type { BoardId, MicrocontrollerRunRequest, MicrocontrollerRunResult } from "./types.ts";
