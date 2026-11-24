import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { BOARD_PROFILES, MAX_PIN_EVENTS, MAX_SERIAL_BYTES, type PinEvent, type PinInputs, type SerialEvent } from "./types.ts";
import type { CompiledSketch } from "./compiler.ts";
import { runProcess } from "./process.ts";

export async function runEsp32Firmware(
    compiled: CompiledSketch,
    durationSeconds: number,
    inputs: PinInputs = {},
    signal?: AbortSignal,
): Promise<{ pins: PinEvent[]; serial: SerialEvent[] }> {
    const app = join(compiled.artifactDirectory, compiled.artifactName);
    const files = await filesBelow(compiled.directory);
    const bootloader = findArtifact(files, /(?:bootloader)(?:\.bin)?$/i);
    const partitions = findArtifact(files, /(?:partitions|partition-table)(?:\.bin)?$/i);
    const elf = findArtifact(files, /sketch\.ino\.elf$/i) ?? findArtifact(files, /\.elf$/i);
    if (!bootloader || !partitions) throw new Error("Arduino CLI did not produce ESP32 bootloader and partition-table artifacts");

    const scriptPath = join(compiled.directory, "inputs.txt");
    const vcdPath = join(compiled.directory, "gpio.vcd");
    const actions = inputActions(inputs, durationSeconds);
    await writeFile(scriptPath, actions.join("\n"), { encoding: "utf8", flag: "wx" });
    const args = [
        "--chip", "esp32", "--board", "esp32dev", "--boot", "rom",
        "--bootloader", bootloader, "--ptable", partitions, "--app", app,
        "--max-seconds", String(durationSeconds), "--console", "uart0", "--vcd", vcdPath, "--no-dump",
    ];
    if (elf) args.push("--elf", elf);
    if (actions.length) args.push("--script", scriptPath);
    let result;
    try {
        result = await runProcess(process.env.ESP32SIM_PATH || "esp32sim", args, {
            cwd: compiled.directory, signal, timeoutMs: Math.max(15_000, durationSeconds * 4_000), outputLimit: MAX_SERIAL_BYTES * 4,
        });
    } catch (error) {
        if (isMissingExecutable(error)) throw new Error("esp32sim is not installed. Install the local ESP32 emulator and set ESP32SIM_PATH.");
        throw error;
    }
    if (result.code !== 0) throw new Error(`ESP32 emulator failed: ${(result.stderr || result.stdout).trim() || `exit code ${result.code}`}`);

    const serialText = result.stdout.slice(-MAX_SERIAL_BYTES);
    return {
        pins: parseVcd(await readFile(vcdPath, "utf8")),
        serial: serialText ? [{ timeSeconds: 0, text: serialText }] : [],
    };
}

function isMissingExecutable(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error &&
        ((error as { code?: string }).code === "ENOENT" || (error as { code?: string }).code === "EACCES");
}

function inputActions(inputs: PinInputs, durationSeconds: number): string[] {
    const actions: Array<{ time: number; line: string }> = [];
    for (const [pinText, signal] of Object.entries(inputs.digital ?? {})) {
        const pin = Number(pinText);
        if (!Number.isInteger(pin) || pin < 0 || pin >= BOARD_PROFILES["esp32-devkit-v1"].pinCount) throw new Error(`Invalid ESP32 digital pin ${pinText}`);
        for (const point of points(signal)) {
            validateTime(point.timeSeconds, durationSeconds);
            if (typeof point.value !== "boolean") throw new Error(`ESP32 digital input GPIO${pin} must be boolean`);
            actions.push({ time: point.timeSeconds, line: `${point.timeSeconds} gpio ${pin} ${point.value ? 1 : 0}` });
        }
    }
    for (const [pinText, signal] of Object.entries(inputs.analog ?? {})) {
        const pin = Number(pinText);
        if (BOARD_PROFILES["esp32-devkit-v1"].analogPins[pin] === undefined) throw new Error(`ESP32 GPIO${pin} is not enabled for analog input`);
        for (const point of points(signal)) {
            validateTime(point.timeSeconds, durationSeconds);
            if (!Number.isFinite(point.value) || point.value < 0 || point.value > 3.3) throw new Error(`ESP32 analog input GPIO${pin} must be between 0 and 3.3 V`);
            actions.push({ time: point.timeSeconds, line: `${point.timeSeconds} adc ${pin} ${point.value}` });
        }
    }
    return actions.sort((a, b) => a.time - b.time).map(item => item.line);
}

function points<T extends number | boolean>(signal: T | readonly { timeSeconds: number; value: T }[]) {
    if (!Array.isArray(signal)) return [{ timeSeconds: 0, value: signal as T }];
    const list = signal as readonly { timeSeconds: number; value: T }[];
    for (let index = 0; index < list.length; index += 1) {
        const point = list[index]!;
        if (!Number.isFinite(point.timeSeconds) || point.timeSeconds < 0 || (index > 0 && point.timeSeconds < list[index - 1]!.timeSeconds)) {
            throw new Error("Input signal times must be finite, non-negative and ordered");
        }
    }
    return list;
}

function validateTime(timeSeconds: number, durationSeconds: number) {
    if (!Number.isFinite(timeSeconds) || timeSeconds < 0 || timeSeconds > durationSeconds) {
        throw new Error("Input signal times must be finite and within the simulation duration");
    }
}

function parseVcd(vcd: string): PinEvent[] {
    const signalPins = new Map<string, number>();
    const values = new Map<string, string>();
    const events: PinEvent[] = [];
    let timeSeconds = 0;
    let timeScale = 1e-12;
    let inDefinitions = true;
    for (const line of vcd.split(/\r?\n/)) {
        if (line.startsWith("$timescale")) {
            const scale = line.match(/\$timescale\s+(\d+)\s*(s|ms|us|ns|ps|fs)/i);
            if (scale) timeScale = Number(scale[1]) * ({ s: 1, ms: 1e-3, us: 1e-6, ns: 1e-9, ps: 1e-12, fs: 1e-15 } as const)[scale[2]!.toLowerCase() as "s"]!;
            continue;
        }
        if (line.startsWith("$var")) {
            const match = line.match(/^\$var\s+\S+\s+\d+\s+(\S+)\s+(\S+)/);
            if (match) {
                const pin = match[2]!.match(/gpio(?:\[|_)?(\d+)\]?/i)?.[1];
                if (pin !== undefined) signalPins.set(match[1]!, Number(pin));
            }
            continue;
        }
        if (line.startsWith("$enddefinitions")) { inDefinitions = false; continue; }
        if (inDefinitions || !line || line.startsWith("$")) continue;
        if (line.startsWith("#")) { timeSeconds = Number(line.slice(1)) * timeScale; continue; }
        const match = line.match(/^([01xz])\s*(\S+)$/i);
        if (!match || !signalPins.has(match[2]!)) continue;
        const value = match[1]!.toLowerCase();
        if (values.get(match[2]!) === value || (value !== "0" && value !== "1")) continue;
        values.set(match[2]!, value);
        if (events.length >= MAX_PIN_EVENTS) throw new Error("GPIO activity exceeded the configured limit");
        events.push({ timeSeconds, pin: signalPins.get(match[2]!)!, mode: "output", voltage: value === "1" ? 3.3 : 0 });
    }
    return events;
}

function findArtifact(files: string[], pattern: RegExp) {
    return files.find(file => pattern.test(basename(file)));
}

async function filesBelow(root: string): Promise<string[]> {
    const entries = await readdir(root, { withFileTypes: true });
    const files = await Promise.all(entries.map(entry => {
        const path = join(root, entry.name);
        return entry.isDirectory() ? filesBelow(path) : Promise.resolve([path]);
    }));
    return files.flat();
}
