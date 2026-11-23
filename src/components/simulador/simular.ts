import {
  ActiveBuzzer,
  Breadboard,
  Capacitor,
  Circuit,
  Connection,
  DCMotor,
  DCSolver,
  DCVoltageSource,
  Diode,
  Inductor,
  LDR,
  LED,
  Potentiometer,
  PushButton,
  Resistor,
  Switch,
  Transistor,
  UltrasonicSensor,
  type SimulationResult,
} from "@simulacion/index";
import { BB_HOLE } from "../breadboard";
import {
  COMPONENT_SPECS,
  analizarConexiones,
  nombreDe,
  traducirErrorDelSolver,
  validarCircuito,
  validarResultado,
  valorSeguro,
  type Aviso,
  type ComponentKind,
  type Pieza,
} from "@/data/componentSpecs";

export type Kind = ComponentKind;
export type Part = Pieza & { x: number; y: number };
export type TerminalRef = { componentId: string; terminalId: string };
export type Wire = { id: string; from: TerminalRef; to: TerminalRef };

/**
 * The simulator instance for a placed part. Field values are converted to SI with the schema's `aSI`.
 * `seguro` clamps an out-of-range value so the part can still be drawn (3D view) while it is flagged.
 */
export function createComponent(part: Pieza, { seguro = false } = {}) {
  const value = (seguro ? valorSeguro(part) : part.value) * (COMPONENT_SPECS[part.kind].valor?.aSI ?? 1);
  switch (part.kind) {
    case "breadboard": return new Breadboard(part.id);
    case "battery": return new DCVoltageSource(part.id, value);
    case "resistor": return new Resistor(part.id, value);
    case "led": return new LED(part.id, "red", value, 0.02);
    case "diode": return new Diode(part.id, value);
    case "capacitor": return new Capacitor(part.id, value, 25);
    // DCSolver accepts an ideal (0 Ω) inductor in its first pass but rejects it in the second with
    // "Unsupported component", so a 1 mΩ winding resistance stands in for the ideal one.
    case "inductor": return new Inductor(part.id, value, 1e-3, 1);
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

// The schema's terminal lists must be the classes' real terminals, or the wiring rules check the wrong pins.
for (const spec of Object.values(COMPONENT_SPECS)) {
  if (spec.kind === "breadboard") continue;
  const reales = createComponent({ id: "check", kind: spec.kind, value: spec.valor?.porDefecto ?? 0 }).terminals.map((t) => t.id).join(",");
  if (reales !== spec.terminales.join(",")) throw new Error(`componentSpecs.${spec.kind}.terminales [${spec.terminales}] ≠ terminales de la clase [${reales}]`);
}

/** Union-find over terminal keys: a breadboard hole stands for its whole strip. */
function redes(parts: Part[], wires: Wire[]) {
  const boards = new Set(parts.filter((part) => part.kind === "breadboard").map((part) => part.id));
  const key = ({ componentId, terminalId }: TerminalRef) =>
    JSON.stringify(boards.has(componentId) ? [componentId, "strip", BB_HOLE.get(terminalId)!.strip] : [componentId, terminalId]);
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    const up = parent.get(id) ?? id;
    if (up === id) return id;
    const root = find(up);
    parent.set(id, root);
    return root;
  };
  for (const wire of wires) parent.set(find(key(wire.from)), find(key(wire.to)));
  return { boards, key, find, conectados: new Set(wires.flatMap((wire) => [key(wire.from), key(wire.to)])) };
}

// The protoboard isn't simulated as a part: every terminal wired into the same strip, or straight to another, is one node,
// and the circuit gets the connections that join each node's terminals. `incluidas` limits it to the parts being solved.
export function netlist(parts: Part[], wires: Wire[], incluidas?: ReadonlySet<string>) {
  const { boards, key, find } = redes(parts, wires);
  const terminals = new Map<string, TerminalRef>();
  for (const wire of wires) {
    for (const end of [wire.from, wire.to]) {
      if (!boards.has(end.componentId) && (!incluidas || incluidas.has(end.componentId))) terminals.set(key(end), end);
    }
  }
  const nets = new Map<string, TerminalRef[]>();
  for (const [id, ref] of terminals) nets.set(find(id), [...(nets.get(find(id)) ?? []), ref]);
  return [...nets.values()].flatMap((net) => net.slice(1).map((to, index) => ({ from: net[index], to })));
}

export interface Simulacion {
  /** Merged results of every circuit that could be solved; null when none could. */
  result: SimulationResult | null;
  /** Errors first, then warnings, then notes. */
  avisos: Aviso[];
}

const ORDEN = { error: 0, advertencia: 1, info: 2 } as const;

/**
 * Validates and solves the playground circuit. Never throws: whatever can't be simulated becomes an
 * `Aviso`, and each separate circuit with its own battery is solved on its own, so one bad part
 * doesn't take the rest down.
 */
export function simularCircuito(parts: Part[], wires: Wire[]): Simulacion {
  try {
    const { key, find, conectados } = redes(parts, wires);
    const netDe = (componentId: string, terminalId: string) => {
      const k = key({ componentId, terminalId });
      return conectados.has(k) ? find(k) : null;
    };
    const { avisos, islas } = analizarConexiones(parts, netDe);
    const result: SimulationResult = { success: false, nodes: [], components: [], errors: [] };

    islas.forEach((ids, index) => {
      const incluidas = new Set(ids);
      try {
        const circuit = new Circuit(`circuito-${index + 1}`, "Mi circuito");
        for (const part of parts) if (incluidas.has(part.id)) circuit.addComponent(createComponent(part));
        netlist(parts, wires, incluidas).forEach((link, k) => circuit.addConnection(new Connection(`N${k + 1}`, link.from, link.to)));
        const parcial = new DCSolver().simulate(circuit);
        if (!parcial.success) throw new Error(parcial.errors[0] ?? "Circuit could not be solved");
        result.success = true;
        avisos.push(...validarCircuito(parts.filter((part) => incluidas.has(part.id)), parcial.components));
        result.components.push(...parcial.components);
        result.nodes.push(...parcial.nodes.map((node) => ({ ...node, nodeId: `${index + 1}:${node.nodeId}` })));
      } catch (error) {
        const texto = error instanceof Error ? error.message : String(error);
        const nombres = parts.filter((part) => incluidas.has(part.id)).map(nombreDe).join(", ");
        avisos.push({ nivel: "error", regla: "error-del-solver", mensaje: `${traducirErrorDelSolver(texto)} (circuito con ${nombres})` });
        result.errors.push(texto);
      }
    });

    for (const medicion of result.components) {
      const pieza = parts.find((part) => part.id === medicion.componentId);
      if (pieza) avisos.push(...validarResultado(pieza, medicion));
    }
    avisos.sort((a, b) => ORDEN[a.nivel] - ORDEN[b.nivel]);
    return { result: result.success ? result : null, avisos };
  } catch (error) {
    const texto = error instanceof Error ? error.message : String(error);
    return { result: null, avisos: [{ nivel: "error", regla: "error-inesperado", mensaje: traducirErrorDelSolver(texto) }] };
  }
}
