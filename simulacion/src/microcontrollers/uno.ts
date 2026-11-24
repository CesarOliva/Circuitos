import {
    ADCReference,
    AVRADC,
    AVRClock,
    AVRUSART,
    AVRIOPort,
    AVRTimer,
    CPU,
    PinState,
    adcConfig,
    avrInstruction,
    portBConfig,
    portCConfig,
    portDConfig,
    timer0Config,
    timer1Config,
    timer2Config,
    usart0Config,
} from "avr8js";
import { BOARD_PROFILES, MAX_PIN_EVENTS, MAX_SERIAL_BYTES, type AnalogSignal, type DigitalSignal, type PinEvent, type PinInputs, type SerialEvent } from "./types.ts";

const FLASH_WORDS = 16 * 1024;
const CHUNK_CYCLES = 16_000;

export async function runUnoFirmware(
    hex: string,
    durationSeconds: number,
    inputs: PinInputs = {},
    signal?: AbortSignal,
): Promise<{ pins: PinEvent[]; serial: SerialEvent[] }> {
    const profile = BOARD_PROFILES["arduino-uno-r3"];
    const program = loadIntelHex(hex);
    const cpu = new CPU(program);
    const clock = new AVRClock(cpu, profile.clockHz);
    const portB = new AVRIOPort(cpu, portBConfig);
    const portC = new AVRIOPort(cpu, portCConfig);
    const portD = new AVRIOPort(cpu, portDConfig);
    new AVRTimer(cpu, timer0Config);
    new AVRTimer(cpu, timer1Config);
    new AVRTimer(cpu, timer2Config);
    const adc = new AVRADC(cpu, adcConfig);
    adc.avcc = profile.voltage;
    adc.channelValues.fill(0);
    const usart = new AVRUSART(cpu, usart0Config, profile.clockHz);
    const pins: PinEvent[] = [];
    const serial: SerialEvent[] = [];
    let serialBytes = 0;
    const decoder = new TextDecoder();

    const pinStates = new Map<number, { mode: string; voltage: number | null }>();
    const watchPort = (port: AVRIOPort, pinNumbers: readonly number[]) => port.addListener(() => {
        const timeSeconds = clock.timeNanos / 1e9;
        for (const pin of pinNumbers) {
            const bit = portBit(pin);
            const state = port.pinState(bit);
            const mode = state === PinState.InputPullUp ? "input-pullup" : state === PinState.Input ? "input" : "output";
            const voltage = state === PinState.High ? profile.voltage : state === PinState.Low ? 0 : null;
            const previous = pinStates.get(pin);
            if (previous?.mode === mode && previous.voltage === voltage) continue;
            pinStates.set(pin, { mode, voltage });
            pushPinEvent(pins, { timeSeconds, pin, mode, voltage });
        }
    });
    watchPort(portD, [0, 1, 2, 3, 4, 5, 6, 7]);
    watchPort(portB, [8, 9, 10, 11, 12, 13]);
    watchPort(portC, [14, 15, 16, 17, 18, 19]);
    usart.onByteTransmit = byte => {
        serialBytes += 1;
        if (serialBytes > MAX_SERIAL_BYTES) throw new Error("Serial output exceeded the configured limit");
        const text = decoder.decode(Uint8Array.of(byte), { stream: true });
        if (text) serial.push({ timeSeconds: clock.timeNanos / 1e9, text });
    };

    validateUnoInputs(inputs, durationSeconds);

    let nextSampleCycles = CHUNK_CYCLES;
    while (cpu.cycles < durationSeconds * profile.clockHz) {
        if (signal?.aborted) throw abortError();
        const sampleTime = cpu.cycles / profile.clockHz;
        updateInputs(inputs, sampleTime, portB, portC, portD, adc);
        const targetCycles = Math.min(durationSeconds * profile.clockHz, nextSampleCycles);
        while (cpu.cycles < targetCycles) {
            avrInstruction(cpu);
            cpu.tick();
        }
        nextSampleCycles += CHUNK_CYCLES;
        await new Promise<void>(resolve => setImmediate(resolve));
    }

    const finalText = decoder.decode();
    if (finalText) serial.push({ timeSeconds: clock.timeNanos / 1e9, text: finalText });

    return { pins, serial };
}

export function loadIntelHex(hex: string): Uint16Array {
    const program = new Uint16Array(FLASH_WORDS);
    program.fill(0xffff);
    let upperAddress = 0;
    let ended = false;
    for (const [index, raw] of hex.split(/\r?\n/).entries()) {
        const line = raw.trim();
        if (!line) continue;
        if (ended || !line.startsWith(":")) throw new Error(`Invalid Intel HEX record at line ${index + 1}`);
        const bytes = line.slice(1).match(/.{2}/g)?.map(value => Number.parseInt(value, 16));
        if (!bytes || line.length % 2 !== 1 || bytes.some(value => !Number.isFinite(value))) throw new Error(`Invalid Intel HEX record at line ${index + 1}`);
        const [length, high, low, type] = bytes;
        if (bytes.length !== length! + 5 || bytes.reduce((sum, value) => sum + value, 0) % 256 !== 0) {
            throw new Error(`Invalid Intel HEX checksum at line ${index + 1}`);
        }
        const address = (upperAddress + (high! << 8) + low!) >>> 0;
        if (type === 0) {
            for (let offset = 0; offset < length!; offset += 1) {
                const byteAddress = address + offset;
                if (byteAddress >= FLASH_WORDS * 2) throw new Error("Intel HEX exceeds ATmega328P flash size");
                const word = byteAddress >>> 1;
                const value = bytes[4 + offset]!;
                program[word] = byteAddress & 1 ? (program[word]! & 0x00ff) | (value << 8) : (program[word]! & 0xff00) | value;
            }
        } else if (type === 1) {
            ended = true;
        } else if (type === 4) {
            if (length !== 2) throw new Error(`Invalid extended address record at line ${index + 1}`);
            upperAddress = ((bytes[4]! << 8) | bytes[5]!) << 16;
        } else if (type === 2) {
            if (length !== 2) throw new Error(`Invalid segment address record at line ${index + 1}`);
            upperAddress = ((bytes[4]! << 8) | bytes[5]!) << 4;
        } else if (type !== 3 && type !== 5) {
            throw new Error(`Unsupported Intel HEX record type ${type} at line ${index + 1}`);
        }
    }
    if (!ended) throw new Error("Intel HEX is missing its end-of-file record");
    return program;
}

function updateInputs(inputs: PinInputs, timeSeconds: number, portB: AVRIOPort, portC: AVRIOPort, portD: AVRIOPort, adc: AVRADC) {
    for (const [pinText, signal] of Object.entries(inputs.digital ?? {})) {
        const pin = Number(pinText);
        const port = pin < 8 ? portD : pin < 14 ? portB : portC;
        const value = valueAt(signal, timeSeconds);
        port.setPin(portBit(pin), value);
    }
    for (const [pinText, signal] of Object.entries(inputs.analog ?? {})) {
        const channel = Number(pinText);
        const voltage = valueAt(signal, timeSeconds);
        if (!Number.isFinite(voltage) || voltage < 0 || voltage > 5) throw new Error(`Uno analog input A${channel} must be between 0 and 5 V`);
        adc.channelValues[channel] = voltage;
    }
}

function valueAt<T extends number | boolean>(signal: T | readonly { timeSeconds: number; value: T }[], timeSeconds: number): T {
    if (!Array.isArray(signal)) return signal as T;
    let value = signal[0]?.value ?? (typeof (signal as readonly { value: T }[])[0]?.value === "boolean" ? false as T : 0 as T);
    for (const point of signal as readonly { timeSeconds: number; value: T }[]) {
        if (!Number.isFinite(point.timeSeconds) || point.timeSeconds < 0) throw new Error("Signal times must be finite and non-negative");
        if (point.timeSeconds > timeSeconds) break;
        value = point.value;
    }
    return value;
}

function portBit(pin: number) { return pin < 8 ? pin : pin < 14 ? pin - 8 : pin - 14; }

function pushPinEvent(events: PinEvent[], event: PinEvent) {
    const previous = events[events.length - 1];
    if (previous && previous.pin === event.pin && previous.mode === event.mode && previous.voltage === event.voltage) return;
    if (events.length >= MAX_PIN_EVENTS) throw new Error("GPIO activity exceeded the configured limit");
    events.push(event);
}

function assertPin(pin: number) {
    if (!Number.isInteger(pin) || pin < 0 || pin >= 20) throw new Error(`Invalid Uno pin ${pin}`);
}

function validateUnoInputs(inputs: PinInputs, durationSeconds: number) {
    for (const [pinText, signal] of Object.entries(inputs.digital ?? {})) {
        const pin = Number(pinText);
        assertPin(pin);
        for (const point of signalPoints(signal)) {
            if (typeof point.value !== "boolean") throw new Error(`Uno digital input pin ${pin} must be boolean`);
            validatePoint(point.timeSeconds, durationSeconds);
        }
    }
    for (const [channelText, signal] of Object.entries(inputs.analog ?? {})) {
        const channel = Number(channelText);
        if (!Number.isInteger(channel) || channel < 0 || channel > 5) throw new Error(`Invalid Uno analog channel ${channel}`);
        for (const point of signalPoints(signal)) {
            if (typeof point.value !== "number" || !Number.isFinite(point.value) || point.value < 0 || point.value > 5) {
                throw new Error(`Uno analog input A${channel} must be between 0 and 5 V`);
            }
            validatePoint(point.timeSeconds, durationSeconds);
        }
    }
}

function signalPoints<T extends number | boolean>(signal: T | readonly { timeSeconds: number; value: T }[]) {
    return Array.isArray(signal) ? signal as readonly { timeSeconds: number; value: T }[] : [{ timeSeconds: 0, value: signal as T }];
}

function validatePoint(timeSeconds: number, durationSeconds: number) {
    if (!Number.isFinite(timeSeconds) || timeSeconds < 0 || timeSeconds > durationSeconds) {
        throw new Error("Input signal times must be finite and within the simulation duration");
    }
}

function abortError() {
    const error = new Error("Simulation was cancelled");
    error.name = "AbortError";
    return error;
}
