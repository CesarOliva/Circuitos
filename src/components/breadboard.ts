import { BREADBOARD_GROUPS, BREADBOARD_RAILS, BREADBOARD_ROWS, Breadboard } from "@simulacion/index";

// The protoboard's face in playground canvas units, centred on its middle; the 2D card draws it as is
// and the 3D model scales it onto the table. Numbered columns run left to right, rows a–e and f–j sit
// either side of the centre channel, and a pair of power rails runs along the top and the bottom.
export const BB_PITCH = 12;
export const BB_W = 400;
export const BB_H = 230;
export const BB_COLUMNS = BREADBOARD_ROWS;

// Terminal centres relative to a component's origin, in canvas units. Shared with the 3D models.
export const PLAYGROUND_PIN_POSITIONS: Record<string, Array<[number, number]>> = {
  "dc-voltage-source": [[-18, 0], [18, 0]],
  resistor: [[-18, 0], [18, 0]],
  led: [[-6, 12], [6, 12]],
  diode: [[-18, 0], [18, 0]],
  capacitor: [[-6, 12], [6, 12]],
  inductor: [[-18, 0], [18, 0]],
  switch: [[-6, 12], [6, 12]],
  "push-button": [[-12, 12], [12, 12]],
  potentiometer: [[-12, 12], [0, 12], [12, 12]],
  ldr: [[-6, 12], [6, 12]],
  "dc-motor": [[-18, 0], [-6, 0]],
  "active-buzzer": [[-6, 12], [6, 12]],
  ultrasonic: [[-18, 12], [-6, 12], [6, 12], [18, 12]],
  "transistor-bjt": [[-12, 12], [0, 12], [12, 12]],
};

// Each row's height, in pitches from the channel.
const ROW_Y: Record<string, number> = {
  "top+": -8.6, "top-": -7.6,
  a: -5, b: -4, c: -3, d: -2, e: -1,
  f: 1, g: 2, h: 3, i: 4, j: 5,
  "bottom-": 7.6, "bottom+": 8.6,
};
export const BB_ROWS = Object.keys(ROW_Y);
export const BB_LETTERS: readonly string[] = BREADBOARD_GROUPS;

export const bbX = (column: number) => (column - (BB_COLUMNS + 1) / 2) * BB_PITCH;
export const bbY = (row: string) => ROW_Y[row] * BB_PITCH;
// Where the column numbers are printed, and the red and blue lines that mark each rail.
export const BB_NUMBER_Y = 6.3 * BB_PITCH;
export const BB_LABEL_X = (BB_COLUMNS / 2 + 1.15) * BB_PITCH;
export const BB_RAIL_LINES = [
  { y: -9.25 * BB_PITCH, sign: "+" },
  { y: -6.95 * BB_PITCH, sign: "-" },
  { y: 6.95 * BB_PITCH, sign: "-" },
  { y: 9.25 * BB_PITCH, sign: "+" },
] as const;

export interface Hole {
  id: string;
  x: number;
  y: number;
  // which group of holes it is joined to inside the board
  strip: number;
  index: number;
}

export const BB_STRIPS = new Breadboard("layout").getConnectedTerminalGroups();
const stripOf = new Map(BB_STRIPS.flatMap((strip, index) => strip.map(id => [id, index] as const)));

export const BB_HOLES: Hole[] = BB_ROWS.flatMap(row => Array.from({ length: BB_COLUMNS }, (_, column) => `${row}${column + 1}`)).map((id, index) => {
  const row = id.replace(/\d+$/, "");
  return { id, x: bbX(Number(id.slice(row.length))), y: bbY(row), strip: stripOf.get(id)!, index };
});
export const BB_HOLE = new Map(BB_HOLES.map(hole => [hole.id, hole]));

// The box round every hole of one strip, for marking what a hole is joined to.
export function stripBox(strip: number, pad = BB_PITCH * 0.42) {
  const holes = BB_STRIPS[strip].map(id => BB_HOLE.get(id)!);
  const xs = holes.map(hole => hole.x);
  const ys = holes.map(hole => hole.y);
  const [x, y] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
  return { x, y, width: Math.max(...xs) + pad - x, height: Math.max(...ys) + pad - y };
}

// A hole the way a person reads it: "c12", or "12 del riel + superior".
export function holeName(id: string) {
  const rail = BREADBOARD_RAILS.find(name => id.startsWith(name));
  if (!rail) return id;
  return `${id.slice(rail.length)} del riel ${rail.endsWith("+") ? "+" : "−"} ${rail.startsWith("top") ? "superior" : "inferior"}`;
}
