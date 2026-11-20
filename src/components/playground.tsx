"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ActiveBuzzer,
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
import type { Jumper, Placed } from "./simulador3d/circuit";
import type { Mount } from "./simulador3d/model";
import "./playground.css";

// three.js only loads once someone opens the 3D view.
const Circuit3D = dynamic(() => import("./simulador3d/circuit"), {
  ssr: false,
  loading: () => <div className="circuit-3d"><p className="circuit-3d-note">Cargando vista 3D…</p></div>,
});

type Kind =
  | "battery" | "resistor" | "led" | "diode" | "capacitor" | "inductor"
  | "switch" | "push-button" | "potentiometer" | "ldr" | "ultrasonic"
  | "dc-motor" | "active-buzzer" | "transistor";
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
type Wire = { id: string; from: TerminalRef; to: TerminalRef };
type TerminalSpec = { id: string; x: number; y: number; ax: number; ay: number; labelX: number; labelY: number; anchor: "start" | "middle" | "end" };
type GroupName = "Pasivos y controles" | "Sensores y actuadores" | "Semiconductores";
type ComponentSpec = { name: string; prefix: string; unit: string; value: number; group: GroupName; terminals: TerminalSpec[] };
type Result = ReturnType<DCSolver["simulate"]>;

const terminal = (id: string, side: -1 | 1, anchor = 40): TerminalSpec => ({
  id, x: side * 58, y: 0, ax: side * anchor, ay: 0,
  labelX: side * 18, labelY: 4, anchor: side < 0 ? "end" : "start",
});
const specs: Record<Kind, ComponentSpec> = {
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
};

const groups: GroupName[] = ["Pasivos y controles", "Sensores y actuadores", "Semiconductores"];
const kinds = Object.keys(specs) as Kind[];
const initialParts: Part[] = [];

function setValue(part: Part, value: number) {
  if (part.kind === "capacitor") return value * 1e-6;
  if (part.kind === "inductor") return value * 1e-3;
  if (part.kind === "potentiometer") return value * 1000;
  return value;
}

function terminalPoint(part: Part, id: string): [number, number] {
  const { x, y } = specs[part.kind].terminals.find(item => item.id === id)!;
  return [part.x + x, part.y + y];
}

function createComponent(part: Part) {
  const value = setValue(part, part.value);
  switch (part.kind) {
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
  default: return null;
  }
}

export default function Playground() {
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingTerminal, setPendingTerminal] = useState<TerminalRef | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("Agrega componentes y conecta sus terminales para empezar.");
  const [dragging, setDragging] = useState<string | null>(null);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [mount, setMount] = useState<Mount>("board");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragOffset = useRef<[number, number]>([0, 0]);
  const selected = parts.find(part => part.id === selectedId) ?? null;
  const selectedResult = result?.components.find(component => component.componentId === selectedId);
  const ledLit = Boolean(result?.success && result.components.some(component => component.type === "led" && component.current > 0.002));
  const placed = useMemo<Placed[]>(() => parts.flatMap(part => {
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

  function addPart(kind: Kind) {
    const spec = specs[kind];
    let count = 1;
    while (parts.some(part => part.id === `${spec.prefix}${count}`)) count++;
    const index = parts.length % 15;
    const part: Part = {
      id: `${spec.prefix}${count}`, kind,
      x: 125 + (index % 5) * 178,
      y: 115 + Math.floor(index / 5) * 170,
      value: spec.value,
      ...(kind === "switch" || kind === "push-button" ? { on: false } : {}),
      ...(kind === "potentiometer" ? { position: 0.5 } : {}),
      ...(kind === "transistor" ? { polarity: "NPN" as const } : {}),
    };
    setParts(current => [...current, part]);
    setSelectedId(part.id);
    setResult(null);
    setMessage(`${spec.name} añadido. Conecta sus terminales.`);
  }

  function connectTerminal(ref: TerminalRef) {
    setSelectedId(ref.componentId);
    setResult(null);
    if (!pendingTerminal) {
      setPendingTerminal(ref);
      setMessage(`Terminal ${ref.terminalId} seleccionada. Elige otra terminal para conectar.`);
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
      for (const part of parts) circuit.addComponent(createComponent(part));
      for (const wire of wires) circuit.addConnection(new Connection(wire.id, wire.from, wire.to));
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
    setParts(current => current.map(part => part.id === partId ? { ...part, x: Math.max(80, Math.min(880, x)), y: Math.max(90, Math.min(470, y)) } : part));
  }

  function startDrag(event: PointerEvent<SVGGElement>, part: Part) {
    if ((event.target as Element).closest(".terminal-button")) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 960;
    const y = ((event.clientY - rect.top) / rect.height) * 560;
    dragOffset.current = [part.x - x, part.y - y];
    setDragging(part.id);
    setSelectedId(part.id);
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
    if (!selected) return;
    setParts(current => current.filter(part => part.id !== selected.id));
    setWires(current => current.filter(wire => wire.from.componentId !== selected.id && wire.to.componentId !== selected.id));
    setSelectedId(null);
    setPendingTerminal(null);
    setResult(null);
    setMessage(`${specs[selected.kind].name} eliminado.`);
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

      <section className="workspace" aria-label="Constructor de circuitos">
        <div className="work-topbar">
          <div className="work-title"><span className="live-dot" /> Área de trabajo <span className="part-count">{parts.length} {parts.length === 1 ? "componente" : "componentes"}</span></div>
          <div className="work-controls">
            {view === "3d" && <div className="view-toggle" role="group" aria-label="Montaje de los componentes">
              {([["board", "En placa"], ["loose", "Sueltos"]] as const).map(([option, text]) => <button key={option} aria-pressed={mount === option} onClick={() => setMount(option)}>{text}</button>)}
            </div>}
            <div className="view-toggle" role="group" aria-label="Vista del área de trabajo">
              {(["2d", "3d"] as const).map(option => <button key={option} aria-pressed={view === option} onClick={() => setView(option)}>{option.toUpperCase()}</button>)}
            </div>
            <button className="run-button" onClick={simulate} disabled={!parts.length}><span aria-hidden="true">▶</span> Simular</button>
          </div>
        </div>

        <div className="canvas-wrap">
          {view === "3d" ? <Circuit3D parts={placed} wires={jumpers} mount={mount} selectedId={selectedId} pending={pendingTerminal} onSelect={setSelectedId} onTerminal={connectTerminal} onRemoveWire={removeWire} /> :
          <svg ref={svgRef} className="circuit-canvas" viewBox="0 0 960 560" role="group" aria-label="Área para colocar y conectar componentes">
            <defs><pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="#d8dfdc" /></pattern></defs>
            <rect width="960" height="560" fill="url(#dot-grid)" />
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
            {parts.map(part => {
              const componentResult = result?.components.find(component => component.componentId === part.id);
              const active = part.kind === "dc-motor" ? Number(componentResult?.measurements?.rpm) > 0 : part.kind === "active-buzzer" ? Boolean(componentResult?.measurements?.active) : false;
              return <g key={part.id} className={`placed-part${selectedId === part.id ? " part-selected" : ""}${dragging === part.id ? " part-dragging" : ""}`} transform={`translate(${part.x} ${part.y})`} onPointerDown={event => startDrag(event, part)} onPointerMove={event => onDrag(event, part.id)} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)} onClick={() => setSelectedId(part.id)} onKeyDown={event => {
                if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
                  event.preventDefault();
                  const delta = event.shiftKey ? 20 : 8;
                  movePart(part.id, part.x + (event.key === "ArrowRight" ? delta : event.key === "ArrowLeft" ? -delta : 0), part.y + (event.key === "ArrowDown" ? delta : event.key === "ArrowUp" ? -delta : 0));
                }
              }} tabIndex={0} role="group" aria-label={`${specs[part.kind].name} ${part.id}. Usa flechas para mover`}>
                <ComponentArt part={part} lit={part.kind === "led" && ledLit} active={active} />
                {specs[part.kind].terminals.map(item => <line key={`lead-${item.id}`} className="component-lead" x1={item.ax} y1={item.ay} x2={item.x} y2={item.y} />)}
                {specs[part.kind].terminals.map(item => {
                  const pending = pendingTerminal?.componentId === part.id && pendingTerminal.terminalId === item.id;
                  return <g key={item.id} className={`terminal-button${pending ? " terminal-pending" : ""}`} transform={`translate(${item.x} ${item.y})`} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); connectTerminal({ componentId: part.id, terminalId: item.id }); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.stopPropagation(); connectTerminal({ componentId: part.id, terminalId: item.id }); } }} tabIndex={0} role="button" aria-label={`Conectar terminal ${item.id} de ${specs[part.kind].name} ${part.id}`}>
                    <circle r="13" className="terminal-hit" /><circle r="5" className="terminal-dot" /><text className="terminal-label" x={item.labelX} y={item.labelY} textAnchor={item.anchor}>{item.id}</text>
                  </g>;
                })}
                {componentResult && <text className="component-readout" x="0" y="90">{(componentResult.voltage).toFixed(2)} V · {(componentResult.current * 1000).toFixed(1)} mA</text>}
              </g>;
            })}
            {!parts.length && <g className="empty-canvas" transform="translate(480 270)"><circle r="27" /><path d="M-9 0h18m-9-9v18" /><text y="58">Agrega un componente para comenzar</text></g>}
          </svg>}
          <div className={`canvas-message${ledLit ? " message-success" : ""}`} role="status"><span className="message-indicator" />{message}</div>
        </div>

        <div className="work-bottom">
          <div className="component-tray" aria-label="Agregar componentes">
            {groups.map(group => <div className="palette-group" key={group}>
              <span className="tray-label">{group}</span>
              {kinds.filter(kind => specs[kind].group === group).map(kind => <button key={kind} onClick={() => addPart(kind)} aria-label={`Agregar ${specs[kind].name}`} title={`Agregar ${specs[kind].name}`}>
                <span className={`tray-symbol tray-${kind}`} aria-hidden="true"><TrayIcon kind={kind} /></span><span>{specs[kind].name}</span><b>+</b>
              </button>)}
            </div>)}
          </div>
          <div className="work-actions">
            {selected && <div className="selection-tools">
              {controlLabel(selected) && <label>{controlLabel(selected)}
                <span className="value-input"><input type="number" min="0.01" step={selected.kind === "transistor" ? "10" : selected.kind === "capacitor" || selected.kind === "inductor" ? "10" : "0.1"} value={selected.value} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && value > 0) changePart(selected.id, { value }); }} aria-label={`${controlLabel(selected)} del componente`} /><span>{specs[selected.kind].unit}</span></span>
              </label>}
              {(selected.kind === "switch" || selected.kind === "push-button") && <button className="control-button" onClick={() => changePart(selected.id, { on: !selected.on })}>{selected.kind === "switch" ? (selected.on ? "Abrir switch" : "Cerrar switch") : (selected.on ? "Soltar pulsador" : "Pulsar")}</button>}
              {selected.kind === "potentiometer" && <label>Posición <input className="position-slider" type="range" min="0" max="1" step="0.01" value={selected.position ?? 0.5} onChange={event => changePart(selected.id, { position: Number(event.target.value) })} aria-label="Posición del potenciómetro" /><span>{Math.round((selected.position ?? 0.5) * 100)}%</span></label>}
              {selected.kind === "transistor" && <label>Tipo <select value={selected.polarity ?? "NPN"} onChange={event => changePart(selected.id, { polarity: event.target.value as "NPN" | "PNP" })}><option value="NPN">NPN</option><option value="PNP">PNP</option></select></label>}
              <button className="remove-button" onClick={removeSelected}>Eliminar</button>
            </div>}
            {selectedResult && <div className="readout"><span className={`readout-led${ledLit ? " readout-on" : ""}`} />{selectedResult.voltage.toFixed(2)} V&nbsp; · &nbsp;{(selectedResult.current * 1000).toFixed(1)} mA{typeof selectedResult.measurements?.rpm === "number" ? ` · ${selectedResult.measurements.rpm.toFixed(0)} RPM` : ""}{selectedResult.measurements?.active ? " · Activo" : ""}{selectedResult.measurements?.triggered ? ` · Eco ${Number(selectedResult.measurements.echoPulseWidthMicroseconds).toFixed(0)} µs` : ""}</div>}
          </div>
        </div>
      </section>

      <footer className="play-footer">{view === "3d"
        ? <><span><kbd>Girar</kbd> Arrastra la mesa</span><span><kbd>Desplazar</kbd> Arrastra con clic derecho</span><span><kbd>Acercar</kbd> Ctrl o ⌘ con la rueda</span><span><kbd>Conectar</kbd> {mount === "loose" ? "Haz clic en dos patitas o puntas" : "Haz clic en dos borneras"}</span><span><kbd>Quitar cable</kbd> Haz clic en el cable</span><span><kbd>Mover</kbd> Usa la vista 2D</span></>
        : <><span><kbd>Conectar</kbd> Selecciona dos terminales</span><span><kbd>Mover</kbd> Arrastra o usa las flechas</span><span><kbd>Quitar cable</kbd> Selecciona el cable</span><span><kbd>Valores</kbd> Edita el componente seleccionado</span></>}
        <span className="model-note">Modelo educativo DC: capacitor abierto e inductor en corto en estado estacionario.</span></footer>
    </main>
  );
}

function TrayIcon({ kind }: { kind: Kind }) {
  if (kind === "battery") return <svg viewBox="0 0 20 20"><path d="M4 10h5m2 0h5M7 7v6m6-4v2" /></svg>;
  if (kind === "resistor") return <svg viewBox="0 0 20 20"><path d="M2 10h3l2-4 4 8 3-8 2 4h2" /></svg>;
  if (kind === "led" || kind === "diode") return <svg viewBox="0 0 20 20"><path d="M5 4v12l9-6zM16 4v12" /></svg>;
  if (kind === "capacitor") return <svg viewBox="0 0 20 20"><path d="M7 3v14m6-14v14M2 10h5m6 0h5" /></svg>;
  if (kind === "inductor") return <svg viewBox="0 0 20 20"><path d="M2 10h2c0-6 4-6 4 0s4 6 4 0 4-6 4 0h2" /></svg>;
  if (kind === "switch" || kind === "push-button") return <svg viewBox="0 0 20 20"><path d="M2 14h5l8-8m0 8h3" /></svg>;
  if (kind === "potentiometer") return <svg viewBox="0 0 20 20"><path d="M2 13h4l3-6 3 6h6M10 2v6m-2-2 2 2 2-2" /></svg>;
  if (kind === "ldr") return <svg viewBox="0 0 20 20"><circle cx="11" cy="11" r="5" /><path d="m2 4 4 3m-2-6 4 5" /></svg>;
  if (kind === "ultrasonic") return <svg viewBox="0 0 20 20"><circle cx="6" cy="10" r="4" /><circle cx="15" cy="10" r="4" /></svg>;
  if (kind === "dc-motor") return <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" /><path d="M10 5v10m-5-5h10" /></svg>;
  if (kind === "active-buzzer") return <svg viewBox="0 0 20 20"><path d="M3 8h4l5-4v12l-5-4H3zM15 7q4 3 0 6" /></svg>;
  return <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" /><path d="M4 10h4m0-5v10m0-7 6-4m-6 8 6 4" /></svg>;
}
