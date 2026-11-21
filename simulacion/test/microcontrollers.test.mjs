import { describe, expect, it } from "vitest";
import { assemble } from "avr8js/dist/esm/utils/assembler.js";
import { loadIntelHex, runSketch } from "../src/server.ts";
import { runUnoFirmware } from "../src/microcontrollers/uno.ts";

function hexRecord(address, type, data) {
  const bytes = [data.length, address >> 8, address & 0xff, type, ...data];
  const checksum = (-bytes.reduce((sum, byte) => sum + byte, 0)) & 0xff;
  return `:${[...bytes, checksum].map(byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function intelHex(data) {
  const records = [];
  for (let offset = 0; offset < data.length; offset += 16) {
    records.push(hexRecord(offset, 0, [...data.slice(offset, offset + 16)]));
  }
  records.push(hexRecord(0, 1, []));
  return records.join("\n");
}

describe("Arduino Uno firmware runtime", () => {
  it("loads checked Intel HEX records into ATmega328P flash", () => {
    const program = loadIntelHex(`${hexRecord(0, 0, [0x00, 0xe2])}\n${hexRecord(0, 1, [])}`);
    expect(program[0]).toBe(0xe200);
    expect(program[1]).toBe(0xffff);
  });

  it("rejects corrupted firmware records", () => {
    expect(() => loadIntelHex(":0100000000FE\n:00000001FF")).toThrow(/checksum/i);
  });

  it("returns a clear error when the local Arduino CLI is unavailable", async () => {
    const previous = process.env.ARDUINO_CLI_PATH;
    process.env.ARDUINO_CLI_PATH = "missing-arduino-cli-for-test";
    try {
      const result = await runSketch({ board: "arduino-uno-r3", sketch: "void setup() {} void loop() {}" });
      expect(result.success).toBe(false);
      expect(result.errors[0]).toMatch(/Arduino CLI is not installed/);
    } finally {
      if (previous === undefined) delete process.env.ARDUINO_CLI_PATH;
      else process.env.ARDUINO_CLI_PATH = previous;
    }
  });

  it("executes AVR machine code and reports Uno pin voltage changes", async () => {
    const assembly = assemble([
      "ldi r16, 0x20",
      "out 0x04, r16",
      "out 0x05, r16",
      "loop: rjmp loop",
    ].join("\n"));
    expect(assembly.errors).toEqual([]);
    const { pins } = await runUnoFirmware(intelHex(assembly.bytes), 0.001);
    const pin13 = pins.filter(event => event.pin === 13 && event.mode === "output");
    expect(pin13.at(-1)?.voltage).toBe(5);
    expect(pin13.some(event => event.voltage === 0)).toBe(true);
  });

  it.skipIf(!process.env.ARDUINO_CLI_PATH || !process.env.ARDUINO_CLI_CONFIG_FILE)("compiles and runs an Arduino C++ Blink + Serial sketch end to end", async () => {
    const result = await runSketch({
      board: "arduino-uno-r3",
      sketch: [
        "void setup() { pinMode(13, OUTPUT); Serial.begin(9600); }",
        "void loop() { digitalWrite(13, HIGH); delay(100); digitalWrite(13, LOW); Serial.println(\"ready\"); delay(100); }",
      ].join("\n"),
      durationSeconds: 0.5,
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    expect(result.serial.map(event => event.text).join("")).toContain("ready");
    expect(result.pins.some(event => event.pin === 13 && event.voltage === 5)).toBe(true);
    expect(result.pins.some(event => event.pin === 13 && event.voltage === 0)).toBe(true);
  }, 30_000);
});
