import { CY } from "./layout";

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

export const FAULTS: Record<string, Fault[]> = {
  "dc-motor": [
    { label: "Escobillas o rodamientos desgastados", symptom: "Arranque irregular, ruido, chispas o pérdida de velocidad.", cues: { wave: true } },
  ],
  "active-buzzer": [{ label: "Oscilador o transductor dañado", symptom: "Sonido débil, distorsionado o ausente.", cues: { cracked: true } }],
  potentiometer: [{ label: "Sobrecalentamiento", symptom: "Deriva del valor, daño de la pista o circuito abierto.", cues: { burnt: true } }],
  resistor: [{ label: "Sobrecarga térmica", symptom: "Se calienta; el valor puede derivar y finalmente abrirse.", cues: { burnt: true } }],
  capacitor: [
    {
      label: "Fuga o corto",
      symptom: "Aumenta el consumo, calienta el capacitor o hace caer la tensión de la fuente.",
      cues: { bridge: [0, 1], burnt: true },
    },
    { label: "ESR elevada", symptom: "Aumenta el rizado y la temperatura.", cues: { wave: true } },
    { label: "Capacitor explotado", symptom: "Hinchamiento, venteo o ruptura del encapsulado.", cues: { cracked: true, burnt: true } },
  ],
  inductor: [{ label: "Saturación del núcleo", symptom: "Cae la inductancia efectiva y la corriente puede crecer con rapidez.", cues: { wave: true } }],
  diode: [
    {
      label: "Ruptura inversa",
      symptom: "Al exceder su tensión inversa máxima puede aumentar la fuga y quedar en corto o abierto.",
      cues: { cracked: true, burnt: true },
    },
  ],
  led: [{ label: "Exceso de corriente o temperatura", symptom: "Disminuye el brillo con el tiempo o se daña de forma permanente.", cues: { burnt: true } }],
  "transistor-bjt": [
    { label: "Ganancia degradada", symptom: "La carga requiere más corriente de base o deja de activarse.", cues: { wave: true } },
    { label: "Sobrecalentamiento o exceso de VCE/IC", symptom: "Puede causar fuga, cortocircuito o circuito abierto.", cues: { burnt: true } },
  ],
  ldr: [{ label: "Envejecimiento, suciedad o daño óptico", symptom: "Deriva de resistencia o sensibilidad reducida.", cues: { cracked: true } }],
  ultrasonic: [{ label: "Transductor dañado o montaje inadecuado", symptom: "Lecturas inestables o alcance reducido.", cues: { cracked: true } }],
};

// Where on the top face the crack and the waveform sit.
export const TOP: Record<string, Point> = {
  "dc-motor": [0, CY, 23],
  "active-buzzer": [0, CY, 10],
  potentiometer: [0, -15, 7.4],
  resistor: [0, CY, 8.2],
  capacitor: [0, CY, 16.4],
  inductor: [0, CY, 13.2],
  diode: [0, CY, 6.1],
  led: [0, CY, 12.75],
  "transistor-bjt": [0, -13.2, 14],
  ldr: [0, CY, 6],
  ultrasonic: [11, -19.5, 15.5],
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
