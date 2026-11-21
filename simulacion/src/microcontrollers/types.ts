import type { Circuit } from "../core/Circuit.ts";

export type BoardId = "arduino-uno-r3" | "esp32-devkit-v1";
export type PinMode = "input" | "input-pullup" | "output";

export interface SignalPoint<T> {
    timeSeconds: number;
    value: T;
}

export type DigitalSignal = boolean | readonly SignalPoint<boolean>[];
export type AnalogSignal = number | readonly SignalPoint<number>[];

export interface PinInputs {
    digital?: Readonly<Record<number, DigitalSignal>>;
    analog?: Readonly<Record<number, AnalogSignal>>;
}

export interface PinEvent {
    timeSeconds: number;
    pin: number;
    mode: PinMode;
    voltage: number | null;
}

export interface SerialEvent {
    timeSeconds: number;
    text: string;
}

export interface MicrocontrollerRunRequest {
    board: BoardId;
    sketch: string;
    durationSeconds?: number;
    timeStepSeconds?: number;
    inputs?: PinInputs;
    circuit?: Circuit;
    /** Maps output pin numbers to DC source IDs in `circuit`. */
    outputSources?: Readonly<Record<number, string>>;
    signal?: AbortSignal;
}

export interface CompileDiagnostic {
    severity: "error" | "warning" | "info";
    message: string;
    file?: string;
    line?: number;
    column?: number;
}

export interface MicrocontrollerRunResult {
    success: boolean;
    board: BoardId;
    diagnostics: CompileDiagnostic[];
    serial: SerialEvent[];
    pins: PinEvent[];
    circuitSamples: Array<{ timeSeconds: number; nodes: Array<{ nodeId: string; voltage: number }>; components: Array<{ componentId: string; voltage: number; current: number; power: number }> }>;
    errors: string[];
}

export interface BoardProfile {
    id: BoardId;
    fqbn: string;
    voltage: number;
    clockHz: number;
    analogResolution: number;
    pinCount: number;
    analogPins: Readonly<Record<number, number>>;
}

export const BOARD_PROFILES: Readonly<Record<BoardId, BoardProfile>> = {
    "arduino-uno-r3": {
        id: "arduino-uno-r3",
        fqbn: "arduino:avr:uno",
        voltage: 5,
        clockHz: 16_000_000,
        analogResolution: 1024,
        pinCount: 20,
        analogPins: { 14: 0, 15: 1, 16: 2, 17: 3, 18: 4, 19: 5 },
    },
    "esp32-devkit-v1": {
        id: "esp32-devkit-v1",
        fqbn: "esp32:esp32:esp32",
        voltage: 3.3,
        clockHz: 240_000_000,
        analogResolution: 4096,
        pinCount: 40,
        analogPins: { 32: 4, 33: 5, 34: 6, 35: 7, 36: 0, 39: 3 },
    },
};

export const DEFAULT_SIMULATION_DURATION_SECONDS = 3;
export const MAX_SIMULATION_DURATION_SECONDS = 10;
export const MAX_SKETCH_BYTES = 128 * 1024;
export const MAX_PIN_EVENTS = 200_000;
export const MAX_SERIAL_BYTES = 256 * 1024;
