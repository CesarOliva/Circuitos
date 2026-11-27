import { CY } from "./layout";
import type { Ficha } from "./fichas/tipos";

// The failure modes of docs/fichas-tecnicas-y-fallos-componentes.md, one list per component type.
// Each one says what its drawings add to the healthy part, in model units (x and y on the board, z up).

export type Point = [number, number, number];

export interface Cues {
  // terminal indexes whose lead is broken: the drawings leave it out and mark the pad
  open?: number[];
  // two terminal indexes joined by a copper bridge over the part
  bridge?: [number, number];
  // the body goes black
  burnt?: boolean;
  // a crack across the top face
  cracked?: boolean;
  // an irregular waveform across the top face
  wave?: boolean;
}

export interface Fault {
  label: string;
  symptom: string;
  cues: Cues;
}

const CUES_BY_FAILURE: Record<string, Record<string, Cues>> = {
  "dc-voltage-source": { "Cortocircuito externo": { bridge: [0, 1] } },
  "dc-motor": { "Bobinado abierto o escobillas gastadas": { cracked: true }, "Eje bloqueado": { wave: true } },
  "active-buzzer": { "Oscilador dañado": { cracked: true } },
  potentiometer: { "Cursor sucio o desgastado": { wave: true }, "Pista abierta": { open: [1] }, "Corriente excesiva por el cursor": { burnt: true } },
  "push-button": { "Contacto que no cierra": { open: [0] }, "Contacto pegado": { bridge: [0, 1] }, "Contacto sucio o gastado": { wave: true } },
  switch: { "Contacto abierto": { open: [0] }, "Contacto soldado": { bridge: [0, 1] }, Oxidación: { wave: true } },
  resistor: { "Sobrecarga térmica": { burnt: true }, Abierta: { open: [0] } },
  capacitor: {
    "Capacitor seco o con capacitancia reducida": { wave: true },
    "Fuga o corto": { bridge: [0, 1], burnt: true },
    "ESR elevada": { wave: true },
    "Polaridad invertida o sobrevoltaje": { cracked: true, burnt: true },
  },
  inductor: { "Bobinado abierto": { open: [0] }, "Espiras en corto": { bridge: [0, 1], burnt: true }, "Saturación del núcleo": { wave: true } },
  diode: { Abierto: { open: [0] }, "En corto": { bridge: [0, 1] }, "Ruptura inversa": { cracked: true, burnt: true } },
  led: { "Quemado por exceso de corriente": { burnt: true }, "Degradación por calor": { wave: true } },
  "transistor-bjt": { "Unión abierta": { cracked: true }, "Colector-emisor en corto": { bridge: [1, 2] }, "Sin resistencia de base": { burnt: true } },
  ldr: { Abierta: { open: [0] } },
  ultrasonic: { "Sin alimentación o GND suelto": { open: [0, 3] }, "TRIG sin pulso": { open: [1] } },
  microchip: { "Pin doblado o sin contacto": { open: [0] }, "Pines en cortocircuito": { bridge: [0, 1] } },
};

export function faultsForFicha(ficha: Pick<Ficha, "slug" | "fallos">): Fault[] {
  return ficha.fallos.map(({ fallo, efecto }) => ({ label: fallo, symptom: efecto, cues: CUES_BY_FAILURE[ficha.slug]?.[fallo] ?? {} }));
}

// Where on the top face the crack and the waveform sit.
export const TOP: Record<string, Point> = {
  "dc-voltage-source": [0, CY, 38],
  "dc-motor": [0, CY, 23],
  "active-buzzer": [0, CY, 10],
  potentiometer: [0, -15, 7.4],
  "push-button": [0, CY, 10],
  resistor: [0, CY, 8.2],
  capacitor: [0, CY, 16.4],
  inductor: [0, CY, 13.2],
  switch: [0, CY, 8],
  diode: [0, CY, 6.1],
  led: [0, CY, 12.75],
  "transistor-bjt": [0, -13.2, 14],
  ldr: [0, CY, 6],
  ultrasonic: [11, -19.5, 15.5],
  microchip: [0, -13, 7.5],
};

// A jagged crack across the top face.
export function crackOn([x, y, z]: Point): Point[] {
  return Array.from({ length: 7 }, (_, index): Point => [x - 3 + index, y + (index % 2 ? 1.2 : -1.2), z + 0.05]);
}

// An irregular waveform across the top face: two periods of a sine.
export function waveOn([x, y, z]: Point): Point[] {
  return Array.from({ length: 25 }, (_, index): Point => [x - 4 + index / 3, y + 1.2 * Math.sin((index * Math.PI) / 3), z + 0.05]);
}

// What the drawings show, as a list for the caption.
export function cueNotes(cues: Cues, ids: string[]) {
  const notes: string[] = [];
  if (cues.open?.length) notes.push(`${cues.open.map((index) => ids[index]).join(", ")} sin conexión`);
  if (cues.bridge) notes.push(`puente de cobre entre ${ids[cues.bridge[0]]} y ${ids[cues.bridge[1]]}`);
  if (cues.burnt) notes.push("cuerpo quemado");
  if (cues.cracked) notes.push("grieta en la cara superior");
  if (cues.wave) notes.push("señal irregular en la cara superior");
  return notes;
}
