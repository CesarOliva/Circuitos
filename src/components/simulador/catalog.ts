import {
  ActiveBuzzer,
  Capacitor,
  DCMotor,
  DCVoltageSource,
  Diode,
  Inductor,
  LDR,
  LED,
  Microchip,
  Potentiometer,
  PushButton,
  Resistor,
  Switch,
  Transistor,
  UltrasonicSensor,
  type ElectronicComponent,
} from "@simulacion/index.ts";

export type Folder = "sources" | "actuators" | "controls" | "passive" | "semiconductors" | "sensors" | "boards";

export interface Entry {
  component: ElectronicComponent;
  className: string;
  title: string;
  folder: Folder;
}

// One instance of every class in simulacion/src/components, with the values the figure is drawn for.
export const CATALOG: Entry[] = [
  { component: new DCVoltageSource("V1", 9), className: "DCVoltageSource", title: "Fuente de voltaje DC", folder: "sources" },
  { component: new DCMotor("M1", 6, 0.07, 9000, 1.2), className: "DCMotor", title: "Motor DC", folder: "actuators" },
  { component: new ActiveBuzzer("BZ1", 5, 0.03), className: "ActiveBuzzer", title: "Zumbador activo", folder: "actuators" },
  { component: new Potentiometer("P1", 10_000, 0.5), className: "Potentiometer", title: "Potenciómetro", folder: "controls" },
  { component: new PushButton("SW1", "NO"), className: "PushButton", title: "Pulsador", folder: "controls" },
  { component: new Switch("S1", false), className: "Switch", title: "Interruptor", folder: "controls" },
  { component: new Resistor("R1", 1_000, 5, 0.25), className: "Resistor", title: "Resistor", folder: "passive" },
  { component: new Capacitor("C1", 100e-6, 25, true), className: "Capacitor", title: "Capacitor", folder: "passive" },
  { component: new Inductor("L1", 0.01, 2), className: "Inductor", title: "Inductor", folder: "passive" },
  { component: new Diode("D1"), className: "Diode", title: "Diodo", folder: "semiconductors" },
  { component: new LED("LED1", "red", 2, 0.02), className: "LED", title: "LED", folder: "semiconductors" },
  { component: new Transistor("Q1", "NPN", 100, 0.2, 40), className: "Transistor", title: "Transistor BJT", folder: "semiconductors" },
  { component: new Microchip("U1"), className: "Microchip", title: "Microchip genérico", folder: "semiconductors" },
  { component: new LDR("LDR1"), className: "LDR", title: "Fotorresistencia (LDR)", folder: "sensors" },
  { component: new UltrasonicSensor("US1", 2, 400, 50), className: "UltrasonicSensor", title: "Sensor ultrasónico", folder: "sensors" },
];

export const TERMINAL_TYPES: Record<string, string> = {
  positive: "positivo",
  negative: "negativo",
  anode: "ánodo",
  cathode: "cátodo",
  bidirectional: "bidireccional",
  base: "base",
  collector: "colector",
  emitter: "emisor",
  wiper: "cursor",
  input: "entrada",
  output: "salida",
};

// What a client view needs from an instance, as plain data.
export interface Spec {
  type: string;
  id: string;
  name: string;
  className: string;
  title: string;
  folder: Folder;
  terminals: Array<{ id: string; text: string }>;
  properties: Record<string, unknown>;
}

export function specOf({ component, className, title, folder }: Entry): Spec {
  return {
    type: component.type,
    id: component.id,
    name: component.name,
    className,
    title,
    folder,
    terminals: component.terminals.map((terminal) => ({
      id: terminal.id,
      text: `${terminal.id} · ${terminal.name} · ${TERMINAL_TYPES[terminal.type] ?? terminal.type}`,
    })),
    properties: component.getProperties(),
  };
}

const UNITS: Record<string, string> = {
  voltage: "V",
  maxCurrent: "A",
  resistance: "Ω",
  tolerance: "%",
  ratedPower: "W",
  totalResistanceOhms: "Ω",
  resistanceAW: "Ω",
  resistanceWB: "Ω",
  capacitanceFarads: "F",
  ratedVoltage: "V",
  equivalentSeriesResistanceOhms: "Ω",
  inductanceHenries: "H",
  seriesResistanceOhms: "Ω",
  maxCurrentAmps: "A",
  nominalVoltage: "V",
  noLoadCurrent: "A",
  stallCurrent: "A",
  nominalCurrent: "A",
  noLoadRPM: "rpm",
  distanceCm: "cm",
  minDistanceCm: "cm",
  maxDistanceCm: "cm",
  illuminanceLux: "lx",
  referenceLux: "lx",
  resistanceOhms: "Ω",
  referenceResistanceOhms: "Ω",
  nominalForwardVoltage: "V",
  maxForwardCurrent: "A",
  maxReverseVoltage: "V",
  forwardVoltage: "V",
  maxCollectorCurrent: "A",
  maxCollectorEmitterVoltage: "V",
  nominalBaseEmitterVoltage: "V",
  clockHz: "Hz",
};

const PREFIXES: Array<[number, string]> = [
  [1e6, "M"],
  [1e3, "k"],
  [1, ""],
  [1e-3, "m"],
  [1e-6, "µ"],
  [1e-9, "n"],
];

function engineering(value: number, unit: string) {
  if (!Number.isFinite(value)) return `∞ ${unit}`;
  if (value === 0 || unit === "%" || unit === "rpm") return `${value} ${unit}`;
  const [scale, prefix] = PREFIXES.find(([step]) => Math.abs(value) >= step) ?? PREFIXES[PREFIXES.length - 1];
  return `${Number((value / scale).toPrecision(3))} ${prefix}${unit}`;
}

// A property of getProperties() as text: value with SI prefix and unit.
export function formatProperty(key: string, value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "sí" : "no";
  if (typeof value !== "number") return String(value);
  const unit = UNITS[key];
  return unit ? engineering(value, unit) : `${value}`;
}
