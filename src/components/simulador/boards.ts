import { BOARD_PROFILES, type BoardId } from "@simulacion/index.ts";
import type { Spec } from "./catalog";
import type { Plan } from "./layout";

// Boards are drawn on the same mounting board as the components, in millimetres, centred on the origin.
// Terminals are the header pins the simulator drives: the GPIO and analog pins of each board.

export const PCB_T = 1.6;
export const HEADER_H = 2.5;
export const PIN_TOP = 10;
const PITCH = 2.54;

export interface Pin {
  // the terminal id, when the simulator drives this pin; decorative pins have none
  id?: string;
  name: string;
  x: number;
  y: number;
  // where the name is printed, from the pin
  dx: number;
  dy: number;
}

export interface Part {
  kind: "block" | "round";
  plan: Plan;
  h: number;
  tone: "chip" | "shield" | "button";
}

export interface BoardDesign {
  id: BoardId;
  code: string;
  name: string;
  title: string;
  pcb: Plan;
  headers: Plan[];
  pins: Pin[];
  parts: Part[];
}

// A row of header pins on the 2.54 mm pitch, from (x, y) along the direction (sx, sy); each pin is [name, terminal id?].
function row(x: number, y: number, sx: number, sy: number, pins: Array<[string, string?]>, label: [number, number]): Pin[] {
  return pins.map(([name, id], index) => ({ id, name, x: x + sx * index * PITCH, y: y + sy * index * PITCH, dx: label[0], dy: label[1] }));
}

const D = (n: number) => [`${n}`, `D${n}`] as [string, string];
const A = (n: number) => [`A${n}`, `A${n}`] as [string, string];

const UNO = {
  id: "arduino-uno-r3",
  code: "U1",
  name: "Arduino UNO R3",
  title: "Arduino UNO R3",
  pcb: { x: 0, y: 0, w: 68.6, d: 53.4, r: 2 },
  headers: [
    { x: 12.7, y: 49.5, w: 26.7, d: 2.6, r: 0.3 },
    { x: 43.7, y: 49.5, w: 20.4, d: 2.6, r: 0.3 },
    { x: 13.9, y: 1.2, w: 20.4, d: 2.6, r: 0.3 },
    { x: 39.7, y: 1.2, w: 15.3, d: 2.6, r: 0.3 },
  ],
  pins: [
    ...row(13.97, 50.8, 1, 0, [["SCL"], ["SDA"], ["AREF"], ["GND"], D(13), D(12), D(11), D(10), D(9), D(8)], [0, -3.4]),
    ...row(45.0, 50.8, 1, 0, [D(7), D(6), D(5), D(4), D(3), D(2), D(1), D(0)], [0, -3.4]),
    ...row(41.0, 2.5, 1, 0, [A(0), A(1), A(2), A(3), A(4), A(5)], [0, 3.4]),
    ...row(15.2, 2.5, 1, 0, [["NC"], ["IOREF"], ["RESET"], ["3V3"], ["5V"], ["GND"], ["GND"], ["VIN"]], [0, 3.4]),
  ],
  parts: [
    { kind: "block", plan: { x: 0, y: 33, w: 11, d: 12, r: 0.6 }, h: 4.5, tone: "shield" },
    { kind: "block", plan: { x: 1, y: 2, w: 10, d: 11, r: 0.8 }, h: 5, tone: "chip" },
    { kind: "block", plan: { x: 24, y: 14, w: 9, d: 34, r: 0.6 }, h: 3.5, tone: "chip" },
    { kind: "block", plan: { x: 40, y: 20, w: 5, d: 2.4, r: 0.4 }, h: 2.4, tone: "shield" },
    { kind: "round", plan: { x: 3.4, y: 43.4, w: 5.2, d: 5.2, r: 2.6 }, h: 3, tone: "button" },
  ],
} satisfies Raw;

const ESP32 = {
  id: "esp32-devkit-v1",
  code: "U2",
  name: "ESP32 DevKit V1",
  title: "ESP32 DevKit V1",
  pcb: { x: 0, y: 0, w: 28, d: 54, r: 1.5 },
  headers: [
    { x: 0.6, y: 6.8, w: 2.8, d: 38, r: 0.3 },
    { x: 24.6, y: 6.8, w: 2.8, d: 38, r: 0.3 },
  ],
  pins: [
    ...row(2, 43.56, 0, -1, [["EN"], ["36", "GPIO36"], ["39", "GPIO39"], ["34", "GPIO34"], ["35", "GPIO35"], ["32", "GPIO32"], ["33", "GPIO33"], ["25", "GPIO25"], ["26", "GPIO26"], ["27", "GPIO27"], ["14", "GPIO14"], ["12", "GPIO12"], ["13", "GPIO13"], ["GND"], ["VIN"]], [3.4, 0]),
    ...row(26, 43.56, 0, -1, [["23", "GPIO23"], ["22", "GPIO22"], ["TX0", "GPIO1"], ["RX0", "GPIO3"], ["21", "GPIO21"], ["19", "GPIO19"], ["18", "GPIO18"], ["5", "GPIO5"], ["TX2", "GPIO17"], ["RX2", "GPIO16"], ["4", "GPIO4"], ["0", "GPIO0"], ["2", "GPIO2"], ["15", "GPIO15"], ["GND"]], [-3.4, 0]),
  ],
  parts: [
    { kind: "block", plan: { x: 8.2, y: 0, w: 11.6, d: 4.8, r: 0.8 }, h: 3, tone: "shield" },
    { kind: "block", plan: { x: 9.5, y: 10, w: 9, d: 9, r: 0.6 }, h: 1.4, tone: "chip" },
    { kind: "block", plan: { x: 3.8, y: 33, w: 20.4, d: 17.6, r: 0.6 }, h: 3, tone: "shield" },
  ],
} satisfies Raw;

// The same shape with its origin in the corner, as it is written above.
type Raw = Omit<BoardDesign, "pins" | "headers" | "parts" | "pcb"> & { pins: Pin[]; headers: Plan[]; parts: Part[]; pcb: Plan };

function centred({ pcb, headers, pins, parts, ...rest }: Raw): BoardDesign {
  const cx = pcb.w / 2;
  const cy = pcb.d / 2;
  const shift = (plan: Plan): Plan => ({ ...plan, x: plan.x - cx, y: plan.y - cy });
  return {
    ...rest,
    pcb: shift(pcb),
    headers: headers.map(shift),
    pins: pins.map((pin) => ({ ...pin, x: pin.x - cx, y: pin.y - cy })),
    parts: parts.map((part) => ({ ...part, plan: shift(part.plan) })),
  };
}

export const BOARD_LIST: BoardDesign[] = [centred(UNO), centred(ESP32)];

export const BOARDS: Record<string, BoardDesign> = Object.fromEntries(BOARD_LIST.map((design) => [design.id, design]));

// The pins the simulator drives, in the order the terminals are listed.
export const terminalPins = (design: BoardDesign) => design.pins.filter((pin): pin is Pin & { id: string } => pin.id !== undefined);

// What a view needs from a board: its terminals, and the profile the simulator knows it by.
export function specOfBoard(design: BoardDesign): Spec {
  const profile = BOARD_PROFILES[design.id];
  return {
    type: design.id,
    id: design.code,
    name: design.name,
    className: profile.fqbn,
    title: design.title,
    folder: "boards",
    terminals: terminalPins(design).map((pin) => ({ id: pin.id, text: `${pin.id} · ${pin.name}` })),
    properties: {
      voltage: profile.voltage,
      clockHz: profile.clockHz,
      analogResolution: profile.analogResolution,
      pinCount: profile.pinCount,
    },
  };
}
