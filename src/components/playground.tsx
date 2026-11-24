"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ActiveBuzzer,
  Breadboard,
  Capacitor,
  Circuit,
  Connection,
  DCVoltageSource,
  DCMotor,
  DCSolver,
  Diode,
  Inductor,
  LED,
  LDR,
  Potentiometer,
  PushButton,
  Resistor,
  Switch,
  Transistor,
  UltrasonicSensor,
} from "@simulacion/index";
import type { Jumper, Locate, Placed } from "./simulador3d/circuit";
import type { Mount } from "./simulador3d/model";
import { BB_COLUMNS, BB_H, BB_HOLE, BB_HOLES, BB_LABEL_X, BB_LETTERS, BB_NUMBER_Y, BB_PITCH, BB_RAIL_LINES, BB_W, bbX, bbY, holeName, stripBox } from "./breadboard";
import { PartPicture } from "./part-picture";
import { BOARDS, specOfBoard, terminalPins, type BoardDesign } from "./simulador/boards";
import "./playground.css";

// three.js only loads once someone opens the 3D view.
const Circuit3D = dynamic(() => import("./simulador3d/circuit"), {
  ssr: false,
  loading: () => <div className="circuit-3d"><p className="circuit-3d-note">Cargando vista 3D…</p></div>,
});

type Kind =
  | "breadboard"
  | "battery" | "resistor" | "led" | "diode" | "capacitor" | "inductor"
  | "switch" | "push-button" | "potentiometer" | "ldr" | "ultrasonic"
  | "dc-motor" | "active-buzzer" | "transistor"
  | "arduino-uno-r3" | "esp32-devkit-v1";
type Part = {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  value: number;
  on?: boolean;
  position?: number;
  polarity?: "NPN" | "PNP";
};
type TerminalRef = { componentId: string; terminalId: string };
type CanvasPoint = { x: number; y: number };
type SelectionBox = CanvasPoint & { width: number; height: number };
type Wire = { id: string; from: TerminalRef; to: TerminalRef };
type TerminalSpec = { id: string; name?: string; x: number; y: number; ax: number; ay: number; labelX: number; labelY: number; anchor: "start" | "middle" | "end" };
type GroupName = "Montaje" | "Pasivos y controles" | "Sensores y actuadores" | "Semiconductores" | "Microcontroladores";
// `half` is how far the part reaches from its centre, which keeps it inside the canvas.
type ComponentSpec = { name: string; prefix: string; unit: string; value: number; group: GroupName; terminals: TerminalSpec[]; half?: [number, number] };
type Result = ReturnType<DCSolver["simulate"]>;

const terminal = (id: string, side: -1 | 1, anchor = 40): TerminalSpec => ({
  id, x: side * 58, y: 0, ax: side * anchor, ay: 0,
  labelX: side * 18, labelY: 4, anchor: side < 0 ? "end" : "start",
});
// Boards are schematic blocks, not to scale: their pins sit on rows along the long edges (UNO) or in columns down the sides (ESP32),
// spaced to fit each terminal's hit area.
const PIN_GAP = 26;
const isBoard = (kind: Kind) => kind === "arduino-uno-r3" || kind === "esp32-devkit-v1";
function boardSpec(design: BoardDesign): ComponentSpec {
  const pins = terminalPins(design);
  const at = (index: number, count: number) => (index - (count - 1) / 2) * PIN_GAP;
  const row = (list: typeof pins, y: number, labelY: number): TerminalSpec[] =>
    list.map((pin, index) => ({ id: pin.id, name: pin.name, x: at(index, list.length), y, ax: at(index, list.length), ay: y, labelX: at(index, list.length), labelY, anchor: "middle" }));
  const column = (list: typeof pins, x: number, labelX: number, anchor: TerminalSpec["anchor"]): TerminalSpec[] =>
    list.map((pin, index) => ({ id: pin.id, name: pin.name, x, y: at(index, list.length), ax: x, ay: at(index, list.length), labelX, labelY: at(index, list.length) + 4, anchor }));
  const common = { name: design.name, prefix: "U", unit: "", value: 0, group: "Microcontroladores" as const };
  if (design.id === "arduino-uno-r3") {
    return { ...common, half: [190, 100], terminals: [...row(pins.filter(pin => pin.y > 0), -80, -62), ...row(pins.filter(pin => pin.y <= 0), 80, 62)] };
  }
  return { ...common, half: [60, 190], terminals: [...column(pins.filter(pin => pin.x < 0), -46, -28, "start"), ...column(pins.filter(pin => pin.x > 0), 46, 28, "end")] };
}

const specs: Record<Kind, ComponentSpec> = {
  // Its terminals are the holes, laid out in ./breadboard.
  breadboard: { name: "Protoboard", prefix: "PB", unit: "", value: 0, group: "Montaje", terminals: [], half: [BB_W / 2, BB_H / 2] },
  battery: { name: "Batería DC", prefix: "V", unit: "V", value: 9, group: "Pasivos y controles", terminals: [terminal("+", -1), terminal("-", 1)] },
  resistor: { name: "Resistencia", prefix: "R", unit: "Ω", value: 470, group: "Pasivos y controles", terminals: [terminal("1", -1), terminal("2", 1)] },
  led: { name: "LED rojo", prefix: "D", unit: "V", value: 2.1, group: "Semiconductores", terminals: [terminal("A", -1, 29), terminal("K", 1, 29)] },
  diode: { name: "Diodo", prefix: "D", unit: "V", value: 0.7, group: "Semiconductores", terminals: [terminal("A", -1), terminal("K", 1)] },
  capacitor: { name: "Capacitor", prefix: "C", unit: "µF", value: 100, group: "Pasivos y controles", terminals: [terminal("1", -1), terminal("2", 1)] },
  inductor: { name: "Inductor", prefix: "L", unit: "mH", value: 100, group: "Pasivos y controles", terminals: [terminal("1", -1), terminal("2", 1)] },
  switch: { name: "Switch", prefix: "S", unit: "", value: 0, group: "Pasivos y controles", terminals: [terminal("1", -1), terminal("2", 1)] },
  "push-button": { name: "Pulsador", prefix: "P", unit: "", value: 0, group: "Pasivos y controles", terminals: [terminal("1", -1), terminal("2", 1)] },
  potentiometer: { name: "Potenciómetro", prefix: "POT", unit: "kΩ", value: 10, group: "Pasivos y controles", terminals: [terminal("A", -1), { id: "W", x: 0, y: -49, ax: 0, ay: -31, labelX: 0, labelY: -11, anchor: "middle" }, terminal("B", 1)] },
  ldr: { name: "Fotoresistencia", prefix: "LDR", unit: "lx", value: 10, group: "Sensores y actuadores", terminals: [terminal("1", -1, 29), terminal("2", 1, 29)] },
  ultrasonic: { name: "Ultrasónico", prefix: "US", unit: "cm", value: 100, group: "Sensores y actuadores", terminals: [
    { id: "VCC", x: -58, y: -16, ax: -40, ay: -16, labelX: -18, labelY: -12, anchor: "end" },
    { id: "TRIG", x: -58, y: 16, ax: -40, ay: 16, labelX: -18, labelY: 20, anchor: "end" },
    { id: "ECHO", x: 58, y: -16, ax: 40, ay: -16, labelX: 18, labelY: -12, anchor: "start" },
    { id: "GND", x: 58, y: 16, ax: 40, ay: 16, labelX: 18, labelY: 20, anchor: "start" },
  ] },
  "dc-motor": { name: "Motor DC", prefix: "M", unit: "V", value: 6, group: "Sensores y actuadores", terminals: [terminal("+", -1, 30), terminal("-", 1, 30)] },
  "active-buzzer": { name: "Buzzer activo", prefix: "BZ", unit: "V", value: 5, group: "Sensores y actuadores", terminals: [terminal("+", -1, 31), terminal("-", 1, 31)] },
  transistor: { name: "Transistor BJT", prefix: "Q", unit: "β", value: 100, group: "Semiconductores", terminals: [
    { id: "B", x: -58, y: 0, ax: -30, ay: 0, labelX: -15, labelY: 4, anchor: "end" },
    { id: "C", x: 38, y: -48, ax: 18, ay: -24, labelX: 8, labelY: -32, anchor: "middle" },
    { id: "E", x: 38, y: 48, ax: 18, ay: 24, labelX: 8, labelY: 42, anchor: "middle" },
  ] },
  "arduino-uno-r3": boardSpec(BOARDS["arduino-uno-r3"]),
  "esp32-devkit-v1": boardSpec(BOARDS["esp32-devkit-v1"]),
};

const groups: GroupName[] = ["Montaje", "Pasivos y controles", "Sensores y actuadores", "Semiconductores", "Microcontroladores"];
const kinds = Object.keys(specs) as Kind[];
const initialParts: Part[] = [];
const photoPartKinds = ["resistor", "led", "diode", "capacitor"] as const;

function makePart(parts: Part[], kind: Kind, x: number, y: number): Part {
  const spec = specs[kind];
  let count = 1;
  while (parts.some(part => part.id === `${spec.prefix}${count}`)) count++;
  return {
    id: `${spec.prefix}${count}`, kind,
    ...clampTo(kind, x, y),
    value: spec.value,
    ...(kind === "switch" || kind === "push-button" ? { on: false } : {}),
    ...(kind === "potentiometer" ? { position: 0.5 } : {}),
    ...(kind === "transistor" ? { polarity: "NPN" as const } : {}),
  };
}

function setValue(part: Part, value: number) {
  if (part.kind === "capacitor") return value * 1e-6;
  if (part.kind === "inductor") return value * 1e-3;
  if (part.kind === "potentiometer") return value * 1000;
  return value;
}

function terminalPoint(part: Part, id: string): [number, number] {
  const { x, y } = part.kind === "breadboard" ? BB_HOLE.get(id)! : specs[part.kind].terminals.find(item => item.id === id)!;
  return [part.x + x, part.y + y];
}

// Keeps a part's centre where the whole part stays on the 960 × 560 canvas.
function clampTo(kind: Kind, x: number, y: number) {
  const [w, h] = specs[kind].half ?? [80, 90];
  return { x: Math.max(w, Math.min(960 - w, x)), y: Math.max(h, Math.min(560 - h, y)) };
}

// The protoboard isn't simulated as a part: every terminal wired into the same strip, or straight to another, is one node,
// and the circuit gets the connections that join each node's terminals.
function netlist(parts: Part[], wires: Wire[]) {
  const boards = new Set(parts.filter(part => part.kind === "breadboard").map(part => part.id));
  const key = ({ componentId, terminalId }: TerminalRef) => JSON.stringify(boards.has(componentId) ? [componentId, "strip", BB_HOLE.get(terminalId)!.strip] : [componentId, terminalId]);
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    const up = parent.get(id) ?? id;
    if (up === id) return id;
    const root = find(up);
    parent.set(id, root);
    return root;
  };
  const terminals = new Map<string, TerminalRef>();
  // A microcontroller isn't solved here: wires to its pins are drawn, but they carry no current.
  const microcontrollers = new Set(parts.filter(part => isBoard(part.kind)).map(part => part.id));
  for (const wire of wires) {
    if (microcontrollers.has(wire.from.componentId) || microcontrollers.has(wire.to.componentId)) continue;
    for (const end of [wire.from, wire.to]) if (!boards.has(end.componentId)) terminals.set(key(end), end);
    parent.set(find(key(wire.from)), find(key(wire.to)));
  }
  const nets = new Map<string, TerminalRef[]>();
  for (const [id, ref] of terminals) nets.set(find(id), [...(nets.get(find(id)) ?? []), ref]);
  return [...nets.values()].flatMap(net => net.slice(1).map((to, index) => ({ from: net[index], to })));
}

function createComponent(part: Part) {
  const value = setValue(part, part.value);
  switch (part.kind) {
    case "breadboard": return new Breadboard(part.id);
    case "battery": return new DCVoltageSource(part.id, value);
    case "resistor": return new Resistor(part.id, value);
    case "led": return new LED(part.id, "red", value, 0.02);
    case "diode": return new Diode(part.id, value);
    case "capacitor": return new Capacitor(part.id, value, 25);
    case "inductor": return new Inductor(part.id, value, 0, 1);
    case "switch": return new Switch(part.id, part.on ?? false);
    case "push-button": {
      const button = new PushButton(part.id, "NO");
      if (part.on) button.press();
      return button;
    }
    case "potentiometer": return new Potentiometer(part.id, value, part.position ?? 0.5);
    case "ldr": return new LDR(part.id, 10_000, 10, 0.7, value);
    case "ultrasonic": return new UltrasonicSensor(part.id, 2, 400, value);
    case "dc-motor": return new DCMotor(part.id, value, 0.1, 3000, 1.2);
    case "active-buzzer": return new ActiveBuzzer(part.id, value, 0.03);
    case "transistor": return new Transistor(part.id, part.polarity ?? "NPN", value, 0.6, 40);
    case "arduino-uno-r3":
    case "esp32-devkit-v1": throw new Error("Las placas no son componentes eléctricos del circuito");
  }
}

function ComponentArt({ part, lit, active }: { part: Part; lit: boolean; active: boolean }) {
  const commonLabel = <>
    <text className="part-name" x="0" y="58">{specs[part.kind].name}</text>
    {specs[part.kind].unit && <text className="part-value" x="0" y="73">{part.value}{specs[part.kind].unit}</text>}
  </>;
  switch (part.kind) {
    case "battery": return <>
      <rect className="part-body battery-body" x="-38" y="-27" width="76" height="54" rx="8" />
      <path className="battery-mark" d="M-10 -8v16m-8-8h16M13 -4v8m-4-4h8" />{commonLabel}
    </>;
    case "resistor": return <>
      <rect className="part-body resistor-body" x="-40" y="-18" width="80" height="36" rx="5" />
      <path className="resistor-mark" d="M-24 0h10l8-8 12 16 10-16 8 8h10" />{commonLabel}
    </>;
    case "led": return <>
      <circle className={`part-body led-body${lit ? " led-on" : ""}`} r="29" />
      <path className="led-mark" d="M-11 -13v26l20-13zM12 -15v30M1 -23l7-8m2 16 9-8" />{commonLabel}
    </>;
    case "diode": return <>
      <rect className="part-body" x="-39" y="-25" width="78" height="50" rx="10" />
      <path className="diode-mark" d="M-13 -15v30l24-15zM15 -16v32" />{commonLabel}
    </>;
    case "capacitor": return <>
      <rect className="part-body capacitor-body" x="-36" y="-29" width="72" height="58" rx="11" />
      <path className="capacitor-mark" d="M-9 -16v32m18-32v32" />{commonLabel}
    </>;
    case "inductor": return <>
      <rect className="part-body" x="-40" y="-28" width="80" height="56" rx="10" />
      <path className="inductor-mark" d="M-24 0c0-19 12-19 12 0s12 19 12 0 12-19 12 0 12 19 12 0" />{commonLabel}
    </>;
    case "switch": return <>
      <rect className={`part-body control-body${part.on ? " control-on" : ""}`} x="-40" y="-26" width="80" height="52" rx="10" />
      <path className="control-mark" d={part.on ? "M-25 0h50" : "M-25 0h13l25-15"} /><circle className="contact-dot" cx="-25" r="3" /><circle className="contact-dot" cx="25" r="3" />
      <text className="part-name" x="0" y="47">Switch {part.on ? "cerrado" : "abierto"}</text>
    </>;
    case "push-button": return <>
      <rect className={`part-body control-body${part.on ? " control-on" : ""}`} x="-40" y="-26" width="80" height="52" rx="10" />
      <path className="control-mark" d="M-25 8h12m26 0h12M-13 8V-5h26V8M0-5v-13" /><circle className="contact-dot" cx="-25" cy="8" r="3" /><circle className="contact-dot" cx="25" cy="8" r="3" />
      <text className="part-name" x="0" y="47">Pulsador {part.on ? "presionado" : "libre"}</text>
    </>;
    case "potentiometer": {
      const marker = -24 + (part.position ?? 0.5) * 48;
      return <>
        <rect className="part-body potentiometer-body" x="-40" y="-26" width="80" height="52" rx="10" />
        <path className="resistor-mark" d="M-24 4h9l7-9 10 18 9-18 6 9h7M0-36v22m-5-4 5 4 5-4" />
        <circle className="pot-marker" cx={marker} cy="-16" r="3" />{commonLabel}
      </>;
    }
    case "ldr": return <>
      <circle className="part-body ldr-body" r="29" />
      <path className="ldr-mark" d="M-12-12v24l22-12zM14-14v28M-30-23l11 8m-7-20 12 10" />
      <path className="ldr-rays" d="m-30-23 7 4m-3-14 8 8" />{commonLabel}
    </>;
    case "ultrasonic": return <>
      <rect className="part-body ultrasonic-body" x="-40" y="-34" width="80" height="68" rx="7" />
      <circle className="sensor-eye" cx="-18" r="13" /><circle className="sensor-eye" cx="18" r="13" />
      <circle className="sensor-eye-inner" cx="-18" r="6" /><circle className="sensor-eye-inner" cx="18" r="6" />
      <text className="small-mark" x="0" y="31">HC-SR04</text>{commonLabel}
    </>;
    case "dc-motor": return <>
      <circle className={`part-body motor-body${active ? " motor-active" : ""}`} r="30" />
      <path className="motor-mark" d="M-15 0h30M0-15v30" /><text className="motor-letter" x="0" y="5">M</text>{commonLabel}
    </>;
    case "active-buzzer": return <>
      <rect className={`part-body buzzer-body${active ? " buzzer-active" : ""}`} x="-31" y="-27" width="62" height="54" rx="15" />
      <path className="buzzer-mark" d="M-15-8h8l11-9v34L-7 8h-8z" />
      {active && <path className="sound-wave" d="M11-10q11 10 0 20m5-25q16 15 0 30" />}{commonLabel}
    </>;
    case "transistor": return <>
      <circle className="part-body transistor-body" r="29" />
      <path className="transistor-mark" d="M-17 0h12m0-21v42m0-13 23-23m-23 31 23 23m-4-10 4 10-10-3" />
      <text className="part-name" x="0" y="59">BJT {part.polarity ?? "NPN"}</text>
      <text className="part-value" x="0" y="74">β {part.value}</text>
  </>;
    case "arduino-uno-r3":
    case "esp32-devkit-v1": {
      const [w, h] = specs[part.kind].half ?? [0, 0];
      return <>
        <rect className="part-body board-body" x={-w} y={-h} width={2 * w} height={2 * h} rx="8" />
        <text className="part-name" x="0" y="4">{specs[part.kind].name}</text>
      </>;
    }
  default: return null;
  }
}

// The protoboard's face: wired holes in the accent, the holes joined to them tinted, the pending hole's strip boxed.
function BreadboardArt({ wired, pending }: { wired: Set<string>; pending: string | null }) {
  const live = new Set([...wired].map(id => BB_HOLE.get(id)!.strip));
  const span = [bbX(1) - BB_PITCH * 0.6, bbX(BB_COLUMNS) + BB_PITCH * 0.6];
  const pendingHole = pending ? BB_HOLE.get(pending) : undefined;
  return <>
    <rect className="part-body breadboard-body" x={-BB_W / 2} y={-BB_H / 2} width={BB_W} height={BB_H} rx="8" />
    <rect className="bb-channel" x={span[0]} y="-3.5" width={span[1] - span[0]} height="7" rx="2" />
    {BB_RAIL_LINES.map(line => <g key={line.y} className={line.sign === "+" ? "bb-rail-plus" : "bb-rail-minus"}>
      <line x1={span[0]} x2={span[1]} y1={line.y} y2={line.y} />
      {[-1, 1].map(side => <text key={side} className="bb-sign" x={side * BB_LABEL_X} y={line.y}>{line.sign === "+" ? "+" : "−"}</text>)}
    </g>)}
    {Array.from({ length: BB_COLUMNS }, (_, index) => index + 1).filter(column => column === 1 || column % 5 === 0).map(column =>
      [-1, 1].map(side => <text key={`${column}${side}`} className="bb-print" x={bbX(column)} y={side * BB_NUMBER_Y}>{column}</text>))}
    {BB_LETTERS.map(letter => [-1, 1].map(side => <text key={`${letter}${side}`} className="bb-print" x={side * BB_LABEL_X} y={bbY(letter)}>{letter}</text>))}
    {pendingHole && <rect className="bb-strip bb-strip-pending" rx="3" {...stripBox(pendingHole.strip)} />}
    {BB_HOLES.map(hole => <rect key={hole.id} className={`bb-hole${hole.id === pending ? " bb-hole-pending" : wired.has(hole.id) ? " bb-hole-used" : live.has(hole.strip) ? " bb-hole-linked" : ""}`} x={hole.x - 3} y={hole.y - 3} width="6" height="6" rx="1.2" />)}
  </>;
}

// The holes as targets, above the wires so a wire never hides one; the strip under the pointer is boxed.
function BreadboardHoles({ onHole }: { onHole(id: string): void }) {
  const [hover, setHover] = useState<string | null>(null);
  const hole = hover ? BB_HOLE.get(hover) : undefined;
  return <g onPointerDown={event => event.stopPropagation()} onPointerMove={event => setHover((event.target as Element).getAttribute("data-hole"))} onPointerLeave={() => setHover(null)}>
    {hole && <rect className="bb-strip" rx="3" {...stripBox(hole.strip)} />}
    {BB_HOLES.map(item => <rect key={item.id} className="bb-target" data-hole={item.id} x={item.x - 4} y={item.y - 4} width="8" height="8" onClick={() => onHole(item.id)}><title>{holeName(item.id)}</title></rect>)}
  </g>;
}

export default function Playground() {
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [pendingTerminal, setPendingTerminal] = useState<TerminalRef | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("Arrastra componentes al área de trabajo y conecta sus terminales para empezar.");
  const [dragging, setDragging] = useState<string | null>(null);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [mount, setMount] = useState<Mount>("board");
  const [importing, setImporting] = useState(false);
  const [ghost, setGhost] = useState<{ kind: Kind; x: number; y: number; over: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectionDrag = useRef<{
    pointerId: number;
    start: CanvasPoint;
    clientX: number;
    clientY: number;
    extend: boolean;
    boardId: string | null;
  } | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const dragOffset = useRef<[number, number]>([0, 0]);
  const trayDrag = useRef<{ kind: Kind; x: number; y: number; moved: boolean } | null>(null);
  const skipClick = useRef(false);
  const locate3d = useRef<Locate | null>(null);
  const selected = selectedIds.length === 1 ? parts.find(part => part.id === selectedIds[0]) ?? null : null;
  const selectedResult = selected ? result?.components.find(component => component.componentId === selected.id) : undefined;
  const ledLit = Boolean(result?.success && result.components.some(component => component.type === "led" && component.current > 0.002));
  const placed = useMemo<Placed[]>(() => parts.flatMap(part => {
    if (isBoard(part.kind)) return [{ spec: { ...specOfBoard(BOARDS[part.kind]), id: part.id }, x: part.x, y: part.y, glow: false } as Placed];
    try {
      const component = createComponent(part);
      const current = result?.components.find(item => item.componentId === part.id)?.current ?? 0;
      return [{
        spec: { type: component.type, id: component.id, className: component.name, terminals: component.terminals.map(item => ({ id: item.id, text: item.name })), properties: component.getProperties() },
        x: part.x,
        y: part.y,
        glow: Boolean(result?.success) && part.kind === "led" && current > 0.002,
      }];
    } catch {
      return [];
    }
  }), [parts, result]);
  const jumpers = useMemo<Jumper[]>(() => wires.map(wire => ({ ...wire, live: ledLit })), [wires, ledLit]);

  function addPart(kind: Kind, at?: [number, number]) {
    const spec = specs[kind];
    const index = parts.length % 15;
    const [x, y] = at ?? (kind === "breadboard" ? [480, 280] : [125 + (index % 5) * 178, 115 + Math.floor(index / 5) * 170]);
    const part = makePart(parts, kind, x, y);
    setParts(current => [...current, part]);
    setSelectedIds([part.id]);
    setResult(null);
    setMessage(kind === "breadboard" ? "Protoboard añadida. Por dentro, cada columna une sus agujeros a–e y f–j, y cada riel va de punta a punta." : isBoard(kind) ? `${spec.name} añadida. Cablea sus pines; el circuito no la resuelve.` : `${spec.name} añadido. Conecta sus terminales.`);
  }

  async function importPhoto(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      setMessage("La foto debe pesar 8 MB o menos.");
      return;
    }
    setImporting(true);
    setMessage("Analizando la foto del protoboard…");
    try {
      const form = new FormData();
      form.set("photo", file);
      const response = await fetch("/api/protoboard", { method: "POST", body: form });
      const analysis: {
        breadboard: boolean;
        components: { x: number; y: number }[];
        error?: string;
      } = await response.json();
      if (!response.ok) throw new Error(analysis.error ?? "No se pudo analizar la foto.");
      if (!analysis.breadboard) {
        setMessage("No se detectó un protoboard. Prueba con una foto donde se vea completo.");
        return;
      }

      const detections = analysis.components.map(point => ({
        ...point,
        kind: photoPartKinds[Math.floor(Math.random() * photoPartKinds.length)],
      }));
      setParts(current => {
        const board = makePart(current, "breadboard", 480, 280);
        const next = [...current, board];
        for (const { x, y, kind } of detections) {
          next.push(makePart(next, kind, board.x + x * BB_W, board.y + y * BB_H));
        }
        return next;
      });
      setSelectedIds([]);
      setPendingTerminal(null);
      setResult(null);
      setView("2d");
      setMessage(`Protoboard importado. Componentes provisionales añadidos: ${detections.length}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo importar la foto.");
    } finally {
      setImporting(false);
    }
  }

  function connectTerminal(ref: TerminalRef) {
    setSelectedIds([ref.componentId]);
    setResult(null);
    if (!pendingTerminal) {
      setPendingTerminal(ref);
      const hole = parts.some(part => part.id === ref.componentId && part.kind === "breadboard");
      setMessage(`${hole ? `Agujero ${holeName(ref.terminalId)} seleccionado` : `Terminal ${ref.terminalId} seleccionada`}. Elige otra terminal para conectar.`);
      return;
    }
    if (pendingTerminal.componentId === ref.componentId && pendingTerminal.terminalId === ref.terminalId) {
      setPendingTerminal(null);
      setMessage("Conexión cancelada.");
      return;
    }
    const duplicate = wires.some(wire =>
      (wire.from.componentId === pendingTerminal.componentId && wire.from.terminalId === pendingTerminal.terminalId && wire.to.componentId === ref.componentId && wire.to.terminalId === ref.terminalId) ||
      (wire.to.componentId === pendingTerminal.componentId && wire.to.terminalId === pendingTerminal.terminalId && wire.from.componentId === ref.componentId && wire.from.terminalId === ref.terminalId),
    );
    setPendingTerminal(null);
    if (duplicate) {
      setMessage("Esas terminales ya están conectadas.");
      return;
    }
    let index = 1;
    while (wires.some(wire => wire.id === `W${index}`)) index++;
    setWires(current => [...current, { id: `W${index}`, from: pendingTerminal, to: ref }]);
    setMessage("Cable conectado. Sigue con el circuito o simúlalo.");
  }

  function simulate() {
    const circuit = new Circuit("playground", "Mi circuito");
    try {
      for (const part of parts) if (part.kind !== "breadboard" && !isBoard(part.kind)) circuit.addComponent(createComponent(part));
      netlist(parts, wires).forEach((link, index) => circuit.addConnection(new Connection(`N${index + 1}`, link.from, link.to)));
      const nextResult = new DCSolver().simulate(circuit);
      setResult(nextResult);
      if (!nextResult.success) {
        setMessage(nextResult.errors[0] ?? "No se pudo resolver el circuito.");
        return;
      }
      const led = nextResult.components.find(component => component.type === "led");
      const motor = nextResult.components.find(component => component.type === "dc-motor");
      const buzzer = nextResult.components.find(component => component.type === "active-buzzer");
      const sensor = nextResult.components.find(component => component.type === "ultrasonic");
      const transistor = nextResult.components.find(component => component.type === "transistor-bjt");
      if (led && led.current > 0.002) setMessage(`¡El LED está encendido! Corriente: ${(led.current * 1000).toFixed(1)} mA.`);
      else if (motor?.measurements?.rpm) setMessage(`El motor gira a ${Number(motor.measurements.rpm).toFixed(0)} RPM.`);
      else if (buzzer?.measurements?.active) setMessage("El buzzer está activo.");
      else if (sensor?.measurements?.triggered) setMessage(`Eco detectado. Pulso: ${Number(sensor.measurements.echoPulseWidthMicroseconds).toFixed(0)} µs.`);
      else if (transistor?.measurements?.conducting) setMessage("El transistor está conduciendo.");
      else setMessage("Simulación terminada. Revisa la lectura del componente seleccionado.");
    } catch (error) {
      setResult(null);
      setMessage(error instanceof Error ? error.message : "Revisa las conexiones del circuito.");
    }
  }

  function changePart(partId: string, update: Partial<Part>) {
    setParts(current => current.map(part => part.id === partId ? { ...part, ...update } : part));
    setResult(null);
    setMessage("Circuito modificado. Simula de nuevo para ver las lecturas.");
  }

  function movePart(partId: string, x: number, y: number) {
    setParts(current => current.map(part => part.id === partId ? { ...part, ...clampTo(part.kind, x, y) } : part));
  }

  // A screen point in canvas units, through whichever view is showing; null outside it.
  function canvasPoint(clientX: number, clientY: number): [number, number] | null {
    if (view === "3d") return locate3d.current?.(clientX, clientY) ?? null;
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    return [((clientX - rect.left) / rect.width) * 960, ((clientY - rect.top) / rect.height) * 560];
  }

  // Tray tiles: a press that travels becomes a drag onto the canvas; a press that doesn't is a plain click.
  function trayDown(event: PointerEvent<HTMLButtonElement>, kind: Kind) {
    if (event.button !== 0) return;
    skipClick.current = false;
    trayDrag.current = { kind, x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function trayMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = trayDrag.current;
    if (!drag || (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5)) return;
    drag.moved = true;
    setGhost({ kind: drag.kind, x: event.clientX, y: event.clientY, over: canvasPoint(event.clientX, event.clientY) !== null });
  }

  function trayUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = trayDrag.current;
    trayDrag.current = null;
    setGhost(null);
    if (!drag?.moved) return;
    skipClick.current = true;
    const at = canvasPoint(event.clientX, event.clientY);
    if (at) addPart(drag.kind, at);
    else setMessage("Suelta el componente dentro del área de trabajo.");
  }

  function trayCancel() {
    trayDrag.current = null;
    setGhost(null);
  }

  function selectPart(id: string, extend = false) {
    setSelectedIds(current => {
      if (!extend) return [id];
      return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
    });
  }

  function selectionPoint(event: PointerEvent<SVGSVGElement>): CanvasPoint | null {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: Math.max(0, Math.min(960, point.x)), y: Math.max(0, Math.min(560, point.y)) };
  }

  function getSelectionBox(event: PointerEvent<SVGSVGElement>, drag: NonNullable<typeof selectionDrag.current>): SelectionBox | null {
    if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) < 4) return null;
    const point = selectionPoint(event);
    if (!point) return null;
    const { x, y } = point;
    const { start } = drag;
    return { x: Math.min(start.x, x), y: Math.min(start.y, y), width: Math.abs(x - start.x), height: Math.abs(y - start.y) };
  }

  function startBoxSelection(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || !event.isPrimary || selectionDrag.current) return;
    const target = event.target as Element;
    const boardId = event.shiftKey ? target.closest("[data-selection-board]")?.getAttribute("data-selection-board") ?? null : null;
    if (!boardId && target !== event.currentTarget && !target.hasAttribute("data-selection-background")) return;
    const start = selectionPoint(event);
    if (!start) return;
    selectionDrag.current = { pointerId: event.pointerId, start, clientX: event.clientX, clientY: event.clientY, extend: event.shiftKey, boardId };
    event.currentTarget.setPointerCapture(event.pointerId);
    canvasRef.current?.focus({ preventScroll: true });
  }

  function moveBoxSelection(event: PointerEvent<SVGSVGElement>) {
    const drag = selectionDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setSelectionBox(getSelectionBox(event, drag));
  }

  function cancelBoxSelection() {
    selectionDrag.current = null;
    setSelectionBox(null);
  }

  function finishBoxSelection(event: PointerEvent<SVGSVGElement>) {
    const drag = selectionDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    cancelBoxSelection();
    const box = getSelectionBox(event, drag);
    if (!box) {
      if (drag.boardId) selectPart(drag.boardId, true);
      else if (!drag.extend) setSelectedIds([]);
      return;
    }
    const inside = parts.filter(part => {
      // Include the board only when the rectangle encloses it.
      const [halfWidth, halfHeight] = part.kind === "breadboard" ? [BB_W / 2, BB_H / 2] : [0, 0];
      return part.x - halfWidth >= box.x && part.x + halfWidth <= box.x + box.width
        && part.y - halfHeight >= box.y && part.y + halfHeight <= box.y + box.height;
    }).map(part => part.id);
    setSelectedIds(current => drag.extend ? [...new Set([...current, ...inside])] : inside);
  }

  function startDrag(event: PointerEvent<SVGGElement>, part: Part) {
    if (event.button !== 0 || (event.target as Element).closest(".terminal-button")) return;
    if (event.shiftKey && part.kind === "breadboard") return;
    event.currentTarget.focus();
    selectPart(part.id, event.shiftKey);
    if (event.shiftKey) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 960;
    const y = ((event.clientY - rect.top) / rect.height) * 560;
    dragOffset.current = [part.x - x, part.y - y];
    setDragging(part.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDrag(event: PointerEvent<SVGGElement>, partId: string) {
    if (dragging !== partId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    movePart(partId, ((event.clientX - rect.left) / rect.width) * 960 + dragOffset.current[0], ((event.clientY - rect.top) / rect.height) * 560 + dragOffset.current[1]);
  }

  function removeWire(wireId: string) {
    setWires(current => current.filter(item => item.id !== wireId));
    setResult(null);
    setMessage("Cable quitado.");
  }

  function removeSelected() {
    if (!selectedIds.length) return;
    const ids = new Set(selectedIds);
    setParts(current => current.filter(part => !ids.has(part.id)));
    setWires(current => current.filter(wire => !ids.has(wire.from.componentId) && !ids.has(wire.to.componentId)));
    setSelectedIds([]);
    setPendingTerminal(current => current && ids.has(current.componentId) ? null : current);
    setResult(null);
    setMessage(selectedIds.length === 1 ? "Objeto eliminado." : `${selectedIds.length} objetos eliminados.`);
  }

  function renderPart(part: Part) {
    const componentResult = result?.components.find(component => component.componentId === part.id);
    const active = part.kind === "dc-motor" ? Number(componentResult?.measurements?.rpm) > 0 : part.kind === "active-buzzer" ? Boolean(componentResult?.measurements?.active) : false;
    const isSelected = selectedIds.includes(part.id);
    return <g key={part.id} data-selection-board={part.kind === "breadboard" ? part.id : undefined} className={`placed-part${isSelected ? " part-selected" : ""}${dragging === part.id ? " part-dragging" : ""}`} transform={`translate(${part.x} ${part.y})`} onPointerDown={event => startDrag(event, part)} onPointerMove={event => onDrag(event, part.id)} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPart(part.id, event.shiftKey);
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const delta = event.shiftKey ? 20 : 8;
        movePart(part.id, part.x + (event.key === "ArrowRight" ? delta : event.key === "ArrowLeft" ? -delta : 0), part.y + (event.key === "ArrowDown" ? delta : event.key === "ArrowUp" ? -delta : 0));
      }
    }} tabIndex={0} role="group" aria-label={`${specs[part.kind].name} ${part.id}${isSelected ? ", seleccionado" : ""}. Pulsa Enter para seleccionar y usa flechas para mover`}>
      {part.kind === "breadboard"
        ? <BreadboardArt wired={new Set(wires.flatMap(wire => [wire.from, wire.to]).filter(end => end.componentId === part.id).map(end => end.terminalId))} pending={pendingTerminal?.componentId === part.id ? pendingTerminal.terminalId : null} />
        : <ComponentArt part={part} lit={part.kind === "led" && ledLit} active={active} />}
      {specs[part.kind].terminals.map(item => <line key={`lead-${item.id}`} className="component-lead" x1={item.ax} y1={item.ay} x2={item.x} y2={item.y} />)}
      {specs[part.kind].terminals.map(item => {
        const pending = pendingTerminal?.componentId === part.id && pendingTerminal.terminalId === item.id;
        return <g key={item.id} className={`terminal-button${pending ? " terminal-pending" : ""}`} transform={`translate(${item.x} ${item.y})`} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); connectTerminal({ componentId: part.id, terminalId: item.id }); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.stopPropagation(); connectTerminal({ componentId: part.id, terminalId: item.id }); } }} tabIndex={0} role="button" aria-label={`Conectar terminal ${item.id} de ${specs[part.kind].name} ${part.id}`}>
          <circle r="13" className="terminal-hit" /><circle r="5" className="terminal-dot" /><text className="terminal-label" x={item.labelX} y={item.labelY} textAnchor={item.anchor}>{item.name ?? item.id}</text>
        </g>;
      })}
      {componentResult && <text className="component-readout" x="0" y="90">{(componentResult.voltage).toFixed(2)} V · {(componentResult.current * 1000).toFixed(1)} mA</text>}
    </g>;
  }

  function controlLabel(part: Part) {
    switch (part.kind) {
      case "battery": return "Voltaje";
      case "resistor": return "Resistencia";
      case "led": case "diode": return "Caída directa";
      case "capacitor": return "Capacitancia";
      case "inductor": return "Inductancia";
      case "potentiometer": return "Resistencia total";
      case "ldr": return "Iluminación";
      case "ultrasonic": return "Distancia";
      case "dc-motor": case "active-buzzer": return "Voltaje nominal";
      case "transistor": return "Ganancia β";
      default: return "";
    }
  }

  return (
    <main className="playground">
      <header className="play-header">
        <Link className="brand" href="/" aria-label="Circuitos, inicio"><span className="brand-mark">C</span> Circuitos</Link>
        <div className="header-note"><span className="status-dot" /> Simulador básico</div>
      </header>

      <section className="intro">
        <div>
          <h1>Arma tu circuito.</h1>
          <p>Agrega componentes, conecta sus terminales y descubre qué pasa al cerrar el circuito.</p>
        </div>
        <div className="step-hint"><span>Playground</span> Componentes, controles y sensores en un mismo lugar.</div>
      </section>

      <section className="workspace" aria-label="Constructor de circuitos" onKeyDown={event => {
        if (event.defaultPrevented || event.repeat || (event.target as Element).closest("input, textarea, select, [contenteditable]")) return;
        if (event.key === "Escape") {
          cancelBoxSelection();
          setSelectedIds([]);
        }
        if (event.key === "Delete" && selectedIds.length) {
          event.preventDefault();
          removeSelected();
          canvasRef.current?.focus();
        }
      }}>
        <div className="work-topbar">
          <div className="work-title"><span className="live-dot" /> Área de trabajo <span className="part-count">{parts.length} {parts.length === 1 ? "componente" : "componentes"}</span></div>
          <div className="work-controls">
            <input ref={photoInput} type="file" accept=".jpg,.jpeg,.png,.bmp,.webp" hidden onChange={event => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) void importPhoto(file);
            }} />
            <button type="button" className="import-photo-button" disabled={importing} onClick={() => photoInput.current?.click()}>
              {importing ? "Analizando…" : "Importar foto"}
            </button>
            <button type="button" className="remove-button" disabled={!selectedIds.length} onClick={() => {
              removeSelected();
              canvasRef.current?.focus();
            }} title="Mayús + clic para seleccionar varios objetos. Supr para eliminar.">
              Eliminar{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
            </button>
            {view === "3d" && <div className="view-toggle" role="group" aria-label="Montaje de los componentes">
              {([["board", "En placa"], ["loose", "Sueltos"]] as const).map(([option, text]) => <button key={option} aria-pressed={mount === option} onClick={() => setMount(option)}>{text}</button>)}
            </div>}
            <div className="view-toggle" role="group" aria-label="Vista del área de trabajo">
              {(["2d", "3d"] as const).map(option => <button key={option} aria-pressed={view === option} onClick={() => setView(option)}>{option.toUpperCase()}</button>)}
            </div>
            <button className="run-button" onClick={simulate} disabled={!parts.length}><span aria-hidden="true">▶</span> Simular</button>
          </div>
        </div>

        <div ref={canvasRef} tabIndex={-1} className={`canvas-wrap${ghost?.over ? " drop-target" : ""}`}>
          {view === "3d" ? <Circuit3D parts={placed} wires={jumpers} mount={mount} selectedIds={selectedIds} pending={pendingTerminal} onSelect={(id, extend) => {
            selectPart(id, extend);
            canvasRef.current?.focus();
          }} onTerminal={connectTerminal} onRemoveWire={removeWire} onLocator={locate => { locate3d.current = locate; }} /> :
          <svg ref={svgRef} className="circuit-canvas" viewBox="0 0 960 560" role="group"
            aria-label="Área para colocar y conectar componentes. Arrastra desde un espacio vacío para seleccionar varios."
            onPointerDown={startBoxSelection} onPointerMove={moveBoxSelection} onPointerUp={finishBoxSelection}
            onPointerCancel={event => { if (selectionDrag.current?.pointerId === event.pointerId) cancelBoxSelection(); }}
            onLostPointerCapture={event => { if (event.target === event.currentTarget && selectionDrag.current?.pointerId === event.pointerId) cancelBoxSelection(); }}
          >
            <defs><pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle className="dot-grid-dot" cx="1.5" cy="1.5" r="1" /></pattern></defs>
            <rect width="960" height="560" fill="url(#dot-grid)" data-selection-background="" />
            {/* Protoboards lie under everything; their holes go above the wires, the parts above both. */}
            {parts.filter(part => part.kind === "breadboard").map(renderPart)}
            {wires.map(wire => {
              const from = parts.find(part => part.id === wire.from.componentId);
              const to = parts.find(part => part.id === wire.to.componentId);
              if (!from || !to) return null;
              const [x1, y1] = terminalPoint(from, wire.from.terminalId);
              const [x2, y2] = terminalPoint(to, wire.to.terminalId);
              const mid = (x1 + x2) / 2;
              return <g key={wire.id} className="wire-group" onClick={() => removeWire(wire.id)} role="button" tabIndex={0} aria-label={`Quitar cable ${wire.id}`} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") removeWire(wire.id); }}>
                <path className={`wire${ledLit ? " wire-live" : ""}`} d={`M${x1} ${y1} H${mid} V${y2} H${x2}`} /><path className="wire-hit" d={`M${x1} ${y1} H${mid} V${y2} H${x2}`} />
              </g>;
            })}
            {parts.filter(part => part.kind === "breadboard").map(part => <g key={`${part.id}-holes`} transform={`translate(${part.x} ${part.y})`}>
              <BreadboardHoles onHole={id => connectTerminal({ componentId: part.id, terminalId: id })} />
            </g>)}
            {parts.filter(part => part.kind !== "breadboard").map(renderPart)}
            {!parts.length && <g className="empty-canvas" transform="translate(480 270)"><circle r="27" /><path d="M-9 0h18m-9-9v18" /><text y="58">Arrastra un componente aquí para comenzar</text></g>}
            {selectionBox && <rect className="selection-box" {...selectionBox} aria-hidden="true" />}
          </svg>}
          <div className={`canvas-message${ledLit ? " message-success" : ""}`} role="status"><span className="message-indicator" />{message}</div>
        </div>

        <div className="work-bottom">
          <div className="component-tray" aria-label="Agregar componentes: arrastra uno al área de trabajo o haz clic para agregarlo">
            {groups.map(group => <div className="palette-group" key={group}>
              <span className="tray-label">{group}</span>
              {kinds.filter(kind => specs[kind].group === group).map(kind => <button key={kind} className="part-tile" aria-label={`Agregar ${specs[kind].name}`}
                onPointerDown={event => trayDown(event, kind)} onPointerMove={trayMove} onPointerUp={trayUp} onPointerCancel={trayCancel}
                onClick={() => { if (skipClick.current) skipClick.current = false; else addPart(kind); }}>
                <PartPicture kind={kind} />
                <span className="part-tile-name">{specs[kind].name}</span>
              </button>)}
            </div>)}
          </div>
          <div className="work-actions">
            {selected && (controlLabel(selected) || selected.kind === "switch" || selected.kind === "push-button") && <div className="selection-tools">
              {controlLabel(selected) && <label>{controlLabel(selected)}
                <span className="value-input"><input type="number" min="0.01" step={selected.kind === "transistor" ? "10" : selected.kind === "capacitor" || selected.kind === "inductor" ? "10" : "0.1"} value={selected.value} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && value > 0) changePart(selected.id, { value }); }} aria-label={`${controlLabel(selected)} del componente`} /><span>{specs[selected.kind].unit}</span></span>
              </label>}
              {(selected.kind === "switch" || selected.kind === "push-button") && <button className="control-button" onClick={() => changePart(selected.id, { on: !selected.on })}>{selected.kind === "switch" ? (selected.on ? "Abrir switch" : "Cerrar switch") : (selected.on ? "Soltar pulsador" : "Pulsar")}</button>}
              {selected.kind === "potentiometer" && <label>Posición <input className="position-slider" type="range" min="0" max="1" step="0.01" value={selected.position ?? 0.5} onChange={event => changePart(selected.id, { position: Number(event.target.value) })} aria-label="Posición del potenciómetro" /><span>{Math.round((selected.position ?? 0.5) * 100)}%</span></label>}
              {selected.kind === "transistor" && <label>Tipo <select value={selected.polarity ?? "NPN"} onChange={event => changePart(selected.id, { polarity: event.target.value as "NPN" | "PNP" })}><option value="NPN">NPN</option><option value="PNP">PNP</option></select></label>}
            </div>}
            {selectedResult && <div className="readout"><span className={`readout-led${ledLit ? " readout-on" : ""}`} />{selectedResult.voltage.toFixed(2)} V&nbsp; · &nbsp;{(selectedResult.current * 1000).toFixed(1)} mA{typeof selectedResult.measurements?.rpm === "number" ? ` · ${selectedResult.measurements.rpm.toFixed(0)} RPM` : ""}{selectedResult.measurements?.active ? " · Activo" : ""}{selectedResult.measurements?.triggered ? ` · Eco ${Number(selectedResult.measurements.echoPulseWidthMicroseconds).toFixed(0)} µs` : ""}</div>}
          </div>
        </div>
      </section>

      <footer className="play-footer"><span><kbd>Agregar</kbd> Arrastra una pieza al área o haz clic en ella</span>{view === "3d"
        ? <><span><kbd>Girar</kbd> Arrastra para mover la cámara</span><span><kbd>Piezas</kbd> Se mueven en modo 2D</span><span><kbd>Desplazar</kbd> Arrastra con clic derecho</span><span><kbd>Acercar</kbd> Ctrl o ⌘ con la rueda</span><span><kbd>Conectar</kbd> {mount === "loose" ? "Haz clic en dos patitas, puntas o agujeros" : "Haz clic en dos borneras o agujeros"}</span><span><kbd>Quitar cable</kbd> Haz clic en el cable</span></>
        : <><span><kbd>Conectar</kbd> Selecciona dos terminales o agujeros</span><span><kbd>Mover</kbd> Arrastra o usa las flechas</span><span><kbd>Quitar cable</kbd> Selecciona el cable</span><span><kbd>Valores</kbd> Edita el componente seleccionado</span></>}
        <span><kbd>Protoboard</kbd> Cada columna une a–e y f–j; cada riel va de punta a punta</span>
        <span className="model-note">Modelo educativo DC: capacitor abierto e inductor en corto en estado estacionario.</span></footer>
      {ghost && <div className={`drag-ghost${ghost.over ? " ghost-over" : ""}`} style={{ left: ghost.x, top: ghost.y }} aria-hidden="true"><PartPicture kind={ghost.kind} /></div>}
    </main>
  );
}
