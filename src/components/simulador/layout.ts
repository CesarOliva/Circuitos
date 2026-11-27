// Layout shared by the isometric cards and the 3D views: world units, x and y on the board, z up.

export type Plane = [number, number];

export interface Plan {
  x: number;
  y: number;
  w: number;
  d: number;
  r: number;
}

export const BOARD: Plan = { x: -46, y: -38, w: 92, d: 86, r: 4 };
export const BOARD_T = 2.4;
export const STANDOFF_H = 7;
export const TABLE_SCALE = 0.75;
export const BLOCK_Y = 28;
export const BLOCK_D = 15;
export const STEP_Z = 7;
export const TOWER_D = 9;
export const TOWER_Z = 11;
export const PITCH = 13;
export const CY = -14;
// The spacing of a terminal block's cells for the generic chip: four cells of 11 sit between the chip's two rows.
export const CHIP_PITCH = 11;
const LANES = [24, 21, 18, 15];

// A terminal block: the cells (terminal indices, left to right), where it sits along y, how deep it is,
// and the edge of it that faces the component, where the traces end.
export interface Block {
  cells: number[];
  y: number;
  depth: number;
  near: number;
}

export interface Footprint {
  footprint: Plan;
  // where each terminal meets the board, in the component's terminal order
  pads: Plane[];
  // the spacing of the terminal block's cells, when the default would not fit the board
  pitch?: number;
  // the terminal blocks, when the terminals don't share one row; by default every terminal is in the front block
  blocks?: Block[];
}

export interface FootprintLandmark {
  id: string;
  name: string;
  point: Plane;
}

const CHIP_BODY: Plan = { x: -42, y: -18, w: 84, d: 18, r: 2 };
const CHIP_BACK = -22;
const CHIP_FRONT = 6;
// Pins 1–8 along the back, pins 16–9 along the front, so pin 9 is the rightmost of the front row.
const CHIP_PADS: Plane[] = Array.from({ length: 16 }, (_, index): Plane =>
  index < 8 ? [(index - 3.5) * CHIP_PITCH, CHIP_BACK] : [(15 - index - 3.5) * CHIP_PITCH, CHIP_FRONT],
);
const CHIP_BLOCKS: Block[] = [
  { cells: [0, 1, 2, 3, 4, 5, 6, 7], y: -38, depth: 14, near: -24 },
  { cells: [15, 14, 13, 12, 11, 10, 9, 8], y: BLOCK_Y, depth: BLOCK_D, near: BLOCK_Y },
];

export const LAYOUT: Record<string, Footprint> = {
  "dc-voltage-source": { footprint: { x: -15, y: -29, w: 30, d: 26, r: 2 }, pads: [[-22, -2], [22, -2]] },
  "dc-motor": { footprint: { x: -16, y: -23, w: 48, d: 18, r: 1 }, pads: [[-34, -10], [-28, -18]] },
  "active-buzzer": { footprint: { x: -11, y: CY - 11, w: 22, d: 22, r: 11 }, pads: [[-3.8, CY], [3.8, CY]] },
  potentiometer: { footprint: { x: -11, y: -26, w: 22, d: 22, r: 1 }, pads: [[-6, -2.2], [0, -2.2], [6, -2.2]] },
  "push-button": { footprint: { x: -13, y: -24, w: 26, d: 20, r: 1 }, pads: [[-11, -10], [11, -10]] },
  switch: { footprint: { x: -9, y: -24, w: 18, d: 18, r: 1 }, pads: [[-4.5, -4.6], [4.5, -4.6]] },
  resistor: { footprint: { x: -12, y: -18.5, w: 24, d: 9, r: 1 }, pads: [[-17, CY], [17, CY]] },
  capacitor: { footprint: { x: -8, y: CY - 8, w: 16, d: 16, r: 8 }, pads: [[-3, CY], [3, CY]] },
  inductor: { footprint: { x: -13, y: -21, w: 26, d: 14, r: 1 }, pads: [[-17, CY], [17, CY]] },
  diode: { footprint: { x: -9, y: -18, w: 18, d: 8, r: 1 }, pads: [[-14, CY], [14, CY]] },
  led: { footprint: { x: -5, y: CY - 5, w: 10, d: 10, r: 5 }, pads: [[-2.6, CY], [2.6, CY]] },
  "transistor-bjt": { footprint: { x: -7, y: -19, w: 14, d: 15, r: 1 }, pads: [[-5, -6], [0, -6], [5, -6]] },
  ldr: { footprint: { x: -7, y: CY - 7, w: 14, d: 14, r: 7 }, pads: [[-2.6, -11], [2.6, -11]] },
  ultrasonic: { footprint: { x: -23, y: -32, w: 46, d: 23, r: 1 }, pads: [[-4.5, -6], [-1.5, -6], [1.5, -6], [4.5, -6]] },
  // A DIP-16: pins 1–8 along the back edge, 16–9 along the front. Each row has its own block, its cells left to right.
  microchip: { footprint: CHIP_BODY, pads: CHIP_PADS, pitch: CHIP_PITCH, blocks: CHIP_BLOCKS },
};

export function footprintLandmarks(footprint: Plan): FootprintLandmark[] {
  const right = footprint.x + footprint.w;
  const bottom = footprint.y + footprint.d;
  return [
    { id: "P1", name: "Esquina superior izquierda", point: [footprint.x, footprint.y] },
    { id: "P2", name: "Esquina superior derecha", point: [right, footprint.y] },
    { id: "P3", name: "Esquina inferior derecha", point: [right, bottom] },
    { id: "P4", name: "Esquina inferior izquierda", point: [footprint.x, bottom] },
    { id: "Centro", name: "Centro del componente", point: [footprint.x + footprint.w / 2, footprint.y + footprint.d / 2] },
  ];
}

export const cellX = (index: number, count: number, pitch = PITCH) => (index - (count - 1) / 2) * pitch;

// Copper traces from each pad to its cell of the terminal block, routed so no two cross.
export function traces(pads: Plane[], count: number, pitch = PITCH, near = BLOCK_Y) {
  for (let index = 1; index < pads.length; index++) {
    if (pads[index][0] <= pads[index - 1][0]) throw new Error("pads must run left to right in terminal order");
  }
  const shifts = pads.map(([x], index) => cellX(index, count, pitch) - x);
  const right = shifts.map((shift, index) => (shift > 0.01 ? index : -1)).filter((index) => index >= 0);
  const left = shifts.map((shift, index) => (shift < -0.01 ? index : -1)).filter((index) => index >= 0);
  const lane = new Map<number, number>();
  right.forEach((index, order) => lane.set(index, LANES[order]));
  [...left].reverse().forEach((index, order) => lane.set(index, LANES[order]));
  return pads.map(([x, y], index) => {
    const cx = cellX(index, count, pitch);
    const turn = lane.get(index);
    const route: Plane[] = turn === undefined ? [[x, y], [x, near]] : [[x, y], [x, turn], [cx, turn], [cx, near]];
    return chamfer(route, 1.6);
  });
}

// The front block of a component with `count` terminals, one cell each.
export function blockOf(count: number): Block {
  return { cells: Array.from({ length: count }, (_, index) => index), y: BLOCK_Y, depth: BLOCK_D, near: BLOCK_Y };
}

// The blocks of a component: its one front block, unless its footprint says otherwise.
export function blocksOf(layout: Footprint, count: number): Block[] {
  return layout.blocks ?? [blockOf(count)];
}

// Every terminal's trace, with the terminal it belongs to. Each block's pads are routed among themselves.
export function routesOf(layout: Footprint, count: number): Array<{ index: number; route: Plane[] }> {
  return blocksOf(layout, count).flatMap((block) =>
    traces(block.cells.map((index) => layout.pads[index]), block.cells.length, layout.pitch, block.near).map((route, slot) => ({ index: block.cells[slot], route })),
  );
}

function chamfer(route: Plane[], cut: number): Plane[] {
  const out: Plane[] = [route[0]];
  for (let index = 1; index < route.length - 1; index++) {
    const [a, b, c] = [route[index - 1], route[index], route[index + 1]];
    const into = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const away = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const size = Math.min(cut, into / 2, away / 2);
    out.push([b[0] - ((b[0] - a[0]) / into) * size, b[1] - ((b[1] - a[1]) / into) * size]);
    out.push([b[0] + ((c[0] - b[0]) / away) * size, b[1] + ((c[1] - b[1]) / away) * size]);
  }
  out.push(route[route.length - 1]);
  return out;
}

const DIGITS = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "grey", "white"];
const TOLERANCE: Record<number, string> = { 1: "brown", 2: "red", 5: "gold", 10: "silver" };

// The colour code of a resistance: two digits, a multiplier, a tolerance.
export function colourCode(resistance: number, tolerance: number) {
  const power = Math.floor(Math.log10(resistance)) - 1;
  const digits = Math.round(resistance / 10 ** power);
  const multiplier = power === -1 ? "gold" : power === -2 ? "silver" : DIGITS[power];
  return [DIGITS[Math.floor(digits / 10)], DIGITS[digits % 10], multiplier, TOLERANCE[tolerance] ?? "none"];
}

export const BAND_COLOURS: Record<string, string> = {
  black: "#1d1d1f",
  brown: "#8b5a2b",
  red: "#d93f3f",
  orange: "#e8812e",
  yellow: "#e6c23a",
  green: "#3a9d5d",
  blue: "#3f6fd8",
  violet: "#8a55c9",
  grey: "#8d8d92",
  white: "#ececec",
  gold: "#c9a443",
  silver: "#b9bcc2",
};
