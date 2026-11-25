// Validation schema for every part the playground can place: what values may be typed, which DC paths
// each part offers the solver, and the electrical limits checked after a simulation. The playground
// enforces these rules (src/components/simulador/simular.ts) and the technical sheets print them, so a
// sheet and the simulator can't disagree. Pure data and functions: no React, no solver imports.

export type ComponentKind =
  | "breadboard"
  | "battery" | "resistor" | "led" | "diode" | "capacitor" | "inductor"
  | "switch" | "push-button" | "potentiometer" | "ldr" | "ultrasonic"
  | "dc-motor" | "active-buzzer" | "transistor";

/** error: the circuit (or that part of it) is not simulated. advertencia: it is, but a real part would fail. info: worth knowing. */
export type Nivel = "error" | "advertencia" | "info";

export interface Aviso {
  nivel: Nivel;
  /** Stable id of the rule, e.g. "valor-fuera-de-rango", "limite-corriente". */
  regla: string;
  mensaje: string;
  /** Part id when the warning is about one part. */
  componente?: string;
}

export interface Rango {
  min: number;
  max: number;
}

export interface ValorSpec {
  etiqueta: string;
  /** Unit shown in the input field. */
  unidad: string;
  /** Field value × aSI = value in SI units (F, H, Ω…). */
  aSI: number;
  unidadSI: string;
  /** Outside this range the value is rejected and nothing is simulated. In field units. */
  permitido: Rango;
  /** Outside this range the value is accepted with a warning. In field units. */
  recomendado?: Rango & { motivo: string };
  porDefecto: number;
}

export type Magnitud = "voltaje" | "voltajeInverso" | "corriente" | "potencia";

export interface LimiteOperacion {
  magnitud: Magnitud;
  /** Absolute limits in SI units (V, A, W). */
  min?: number;
  max?: number;
  /** Limits relative to the part's own value (e.g. 1.25 × nominal voltage). */
  minRelativo?: number;
  maxRelativo?: number;
  nivel: Nivel;
  /** What happens to a real part beyond the limit. */
  motivo: string;
}

export interface ComponentSpec {
  kind: ComponentKind;
  nombre: string;
  /** Slug of its technical sheet: /componentes/<ficha>. */
  ficha: string;
  terminales: string[];
  /** Terminal pairs the solver always joins with a conducting branch (or a source). */
  ramas: Array<[string, string]>;
  /** Parts the solver turns into an ideal 0 Ω connection between their two terminals. */
  ideal?: "siempre" | "cerrado";
  valor?: ValorSpec;
  limites: LimiteOperacion[];
  /** Connection rules in plain language, for the sheet. */
  reglas: string[];
}

export const COMPONENT_SPECS: Record<ComponentKind, ComponentSpec> = {
  breadboard: {
    kind: "breadboard",
    nombre: "Protoboard",
    ficha: "breadboard",
    terminales: [],
    ramas: [],
    limites: [],
    reglas: [
      "Cada columna une sus agujeros a–e por un lado y f–j por el otro; el canal central no conduce.",
      "Cada riel de alimentación es un solo nodo de punta a punta.",
      "Dos terminales en la misma tira quedan conectados aunque no haya cable entre ellos.",
    ],
  },
  battery: {
    kind: "battery",
    nombre: "Batería",
    ficha: "dc-voltage-source",
    terminales: ["+", "-"],
    ramas: [["+", "-"]],
    valor: { etiqueta: "Voltaje", unidad: "V", aSI: 1, unidadSI: "V", permitido: { min: 0.1, max: 30 }, porDefecto: 9 },
    limites: [
      { magnitud: "corriente", max: 1, nivel: "advertencia", motivo: "Una pila real no entrega tanta corriente: probablemente hay un cortocircuito o falta una resistencia." },
    ],
    reglas: [
      "El + y el − no pueden quedar unidos por un cable, interruptor cerrado o inductor: sería un cortocircuito.",
      "Dos baterías no pueden quedar en paralelo directo.",
      "Cada circuito necesita al menos una batería; un circuito sin batería se deja fuera de la simulación.",
    ],
  },
  resistor: {
    kind: "resistor",
    nombre: "Resistencia",
    ficha: "resistor",
    terminales: ["1", "2"],
    ramas: [["1", "2"]],
    valor: { etiqueta: "Resistencia", unidad: "Ω", aSI: 1, unidadSI: "Ω", permitido: { min: 1, max: 10e6 }, porDefecto: 470 },
    limites: [
      { magnitud: "potencia", max: 0.25, nivel: "advertencia", motivo: "Una resistencia de 1/4 W se sobrecalienta y puede quemarse." },
    ],
    reglas: ["Sin polaridad."],
  },
  led: {
    kind: "led",
    nombre: "LED",
    ficha: "led",
    terminales: ["A", "K"],
    ramas: [["A", "K"]],
    valor: { etiqueta: "Caída directa", unidad: "V", aSI: 1, unidadSI: "V", permitido: { min: 1.5, max: 3.6 }, porDefecto: 2.1 },
    limites: [
      { magnitud: "corriente", max: 0.02, nivel: "advertencia", motivo: "Un LED real se quemaría: agrega o aumenta la resistencia en serie." },
      { magnitud: "voltajeInverso", max: 5, nivel: "advertencia", motivo: "Más de 5 V en inversa pueden romper la unión del LED." },
    ],
    reglas: ["El ánodo (A) va hacia el + y el cátodo (K) hacia el −.", "Siempre con una resistencia en serie."],
  },
  diode: {
    kind: "diode",
    nombre: "Diodo",
    ficha: "diode",
    terminales: ["A", "K"],
    ramas: [["A", "K"]],
    valor: { etiqueta: "Caída directa", unidad: "V", aSI: 1, unidadSI: "V", permitido: { min: 0.1, max: 1.5 }, porDefecto: 0.7 },
    limites: [
      { magnitud: "corriente", max: 1, nivel: "advertencia", motivo: "Supera la corriente media de un 1N4001; el diodo se sobrecalienta." },
      { magnitud: "voltajeInverso", max: 50, nivel: "advertencia", motivo: "Supera el voltaje inverso máximo: el diodo entra en ruptura." },
    ],
    reglas: ["Conduce de ánodo (A) a cátodo (K)."],
  },
  capacitor: {
    kind: "capacitor",
    nombre: "Capacitor",
    ficha: "capacitor",
    terminales: ["1", "2"],
    ramas: [],
    valor: { etiqueta: "Capacitancia", unidad: "µF", aSI: 1e-6, unidadSI: "F", permitido: { min: 0.001, max: 10_000 }, porDefecto: 100 },
    limites: [
      { magnitud: "voltaje", max: 25, nivel: "advertencia", motivo: "Supera los 25 V nominales: el dieléctrico puede perforarse o el electrolítico hincharse." },
    ],
    reglas: ["En DC no conduce: un terminal conectado solo a través de un capacitor queda sin camino de corriente."],
  },
  inductor: {
    kind: "inductor",
    nombre: "Inductor",
    ficha: "inductor",
    terminales: ["1", "2"],
    ramas: [["1", "2"]],
    ideal: "siempre",
    valor: { etiqueta: "Inductancia", unidad: "mH", aSI: 1e-3, unidadSI: "H", permitido: { min: 0.001, max: 10_000 }, porDefecto: 100 },
    limites: [
      { magnitud: "corriente", max: 1, nivel: "advertencia", motivo: "Supera 1 A: el núcleo se satura y el alambre se calienta." },
    ],
    reglas: ["En DC es un conductor ideal: no puede quedar en paralelo con una batería."],
  },
  switch: {
    kind: "switch",
    nombre: "Interruptor",
    ficha: "switch",
    terminales: ["1", "2"],
    ramas: [],
    ideal: "cerrado",
    limites: [
      { magnitud: "corriente", max: 0.5, nivel: "advertencia", motivo: "Supera la capacidad típica de un interruptor deslizable (0.5 A)." },
      { magnitud: "voltaje", max: 50, nivel: "advertencia", motivo: "Supera el voltaje de aislamiento típico (50 V DC)." },
    ],
    reglas: ["Cerrado es un conductor ideal: no puede quedar en paralelo con una batería."],
  },
  "push-button": {
    kind: "push-button",
    nombre: "Pulsador",
    ficha: "push-button",
    terminales: ["1", "2"],
    ramas: [],
    ideal: "cerrado",
    limites: [
      { magnitud: "corriente", max: 0.05, nivel: "advertencia", motivo: "Un pulsador táctil soporta unos 50 mA." },
      { magnitud: "voltaje", max: 12, nivel: "advertencia", motivo: "Un pulsador táctil está especificado para 12 V DC." },
    ],
    reglas: ["Presionado es un conductor ideal: no puede quedar en paralelo con una batería."],
  },
  potentiometer: {
    kind: "potentiometer",
    nombre: "Potenciómetro",
    ficha: "potentiometer",
    terminales: ["A", "W", "B"],
    ramas: [["A", "W"], ["W", "B"]],
    valor: { etiqueta: "Resistencia total", unidad: "kΩ", aSI: 1e3, unidadSI: "Ω", permitido: { min: 0.1, max: 1000 }, porDefecto: 10 },
    limites: [
      { magnitud: "potencia", max: 0.2, nivel: "advertencia", motivo: "La pista de un potenciómetro pequeño se quema por encima de ~0.2 W." },
    ],
    reglas: ["En los extremos del recorrido un tramo vale 0 Ω: no lo pongas en paralelo con una batería."],
  },
  ldr: {
    kind: "ldr",
    nombre: "Fotorresistencia",
    ficha: "ldr",
    terminales: ["1", "2"],
    ramas: [["1", "2"]],
    valor: { etiqueta: "Iluminación", unidad: "lx", aSI: 1, unidadSI: "lx", permitido: { min: 0, max: 100_000 }, porDefecto: 10 },
    limites: [
      { magnitud: "potencia", max: 0.1, nivel: "advertencia", motivo: "Supera los 100 mW de una GL5528." },
      { magnitud: "voltaje", max: 150, nivel: "advertencia", motivo: "Supera los 150 V máximos de una GL5528." },
    ],
    reglas: ["Sin polaridad."],
  },
  ultrasonic: {
    kind: "ultrasonic",
    nombre: "Sensor ultrasónico",
    ficha: "ultrasonic",
    terminales: ["VCC", "TRIG", "ECHO", "GND"],
    ramas: [["ECHO", "GND"]],
    valor: {
      etiqueta: "Distancia", unidad: "cm", aSI: 1, unidadSI: "cm", permitido: { min: 0, max: 1000 }, porDefecto: 100,
      recomendado: { min: 2, max: 400, motivo: "Fuera del alcance del HC-SR04 (2–400 cm): no habrá eco." },
    },
    limites: [
      { magnitud: "voltaje", min: 4.5, max: 5.5, nivel: "advertencia", motivo: "El HC-SR04 se alimenta con 5 V (se comprueba cuando hay eco, porque entonces ECHO = VCC)." },
    ],
    reglas: ["VCC al +5 V y GND al −.", "TRIG debe estar a 2.5 V o más para medir.", "VCC y TRIG no conducen: deben conectarse a la batería o a otro nodo con camino de corriente."],
  },
  "dc-motor": {
    kind: "dc-motor",
    nombre: "Motor DC",
    ficha: "dc-motor",
    terminales: ["+", "-"],
    ramas: [["+", "-"]],
    valor: { etiqueta: "Voltaje nominal", unidad: "V", aSI: 1, unidadSI: "V", permitido: { min: 1, max: 24 }, porDefecto: 6 },
    limites: [
      { magnitud: "voltaje", maxRelativo: 1.25, nivel: "advertencia", motivo: "Más de 125 % del voltaje nominal: el bobinado y las escobillas se sobrecalientan." },
      { magnitud: "voltaje", minRelativo: 0.3, nivel: "info", motivo: "Con menos de 30 % del nominal, un motor real no vence la fricción y no arranca." },
    ],
    reglas: ["No lo conectes directo a un pin de microcontrolador: usa un transistor."],
  },
  "active-buzzer": {
    kind: "active-buzzer",
    nombre: "Buzzer activo",
    ficha: "active-buzzer",
    terminales: ["+", "-"],
    ramas: [["+", "-"]],
    valor: { etiqueta: "Voltaje nominal", unidad: "V", aSI: 1, unidadSI: "V", permitido: { min: 1, max: 24 }, porDefecto: 5 },
    limites: [
      { magnitud: "voltaje", maxRelativo: 1.2, nivel: "advertencia", motivo: "Más de 120 % del nominal puede dañar el oscilador interno." },
      { magnitud: "voltaje", minRelativo: 1, nivel: "info", motivo: "Por debajo de su voltaje nominal el modelo no suena." },
    ],
    reglas: ["El + va hacia el positivo."],
  },
  transistor: {
    kind: "transistor",
    nombre: "Transistor BJT",
    ficha: "transistor-bjt",
    terminales: ["B", "C", "E"],
    ramas: [["B", "E"]],
    valor: { etiqueta: "Ganancia β", unidad: "β", aSI: 1, unidadSI: "", permitido: { min: 10, max: 1000 }, porDefecto: 100 },
    limites: [
      { magnitud: "corriente", max: 0.6, nivel: "advertencia", motivo: "Supera los 600 mA de colector de un 2N2222A." },
      { magnitud: "voltaje", max: 40, nivel: "advertencia", motivo: "Supera la VCE máxima de 40 V." },
    ],
    reglas: [
      "La base siempre a través de una resistencia (1–10 kΩ).",
      "El colector conduce solo cuando el transistor está encendido: necesita otro camino de corriente (la carga).",
    ],
  },
};

/** Limits the microcontroller boards enforce or document; shown on their sheets. */
export const BOARD_SPECS = {
  "arduino-uno-r3": {
    nombre: "Arduino UNO R3",
    voltajeLogico: 5,
    entradaAnalogica: { min: 0, max: 5 },
    corrientePorPin: { recomendada: 0.02, max: 0.04 },
    duracionMaxima: 10,
  },
  "esp32-devkit-v1": {
    nombre: "ESP32 DevKit V1",
    voltajeLogico: 3.3,
    entradaAnalogica: { min: 0, max: 3.3 },
    corrientePorPin: { recomendada: 0.02, max: 0.04 },
    duracionMaxima: 10,
  },
} as const;

export type BoardSpecId = keyof typeof BOARD_SPECS;

/**
 * Checks a voltage applied to a board's input and the current an LED would draw from one of its outputs
 * through `resistenciaLed` ohms (a red LED, VF ≈ 2.1 V).
 */
export function validarPlaca(placa: BoardSpecId, { voltajeEntrada, resistenciaLed }: { voltajeEntrada?: number; resistenciaLed?: number }): Aviso[] {
  const spec = BOARD_SPECS[placa];
  const avisos: Aviso[] = [];
  if (voltajeEntrada !== undefined) {
    const { min, max } = spec.entradaAnalogica;
    if (!Number.isFinite(voltajeEntrada) || voltajeEntrada < min || voltajeEntrada > max) {
      avisos.push({ nivel: "error", regla: "entrada-fuera-de-rango", mensaje: `${formatear(voltajeEntrada, "V")} en una entrada del ${spec.nombre} está fuera de ${formatear(min, "V")} – ${formatear(max, "V")}: dañaría el pin (y runSketch rechaza la simulación).` });
    } else {
      const cuentas = spec.voltajeLogico === 5 ? 1023 : 4095;
      avisos.push({ nivel: "info", regla: "lectura-analogica", mensaje: `analogRead() leería ≈ ${Math.round((voltajeEntrada / max) * cuentas)} de ${cuentas}.` });
    }
  }
  if (resistenciaLed !== undefined) {
    const corriente = resistenciaLed > 0 ? Math.max(0, spec.voltajeLogico - 2.1) / resistenciaLed : Infinity;
    const texto = `Un LED rojo con ${formatear(resistenciaLed, "Ω")} en un pin de ${formatear(spec.voltajeLogico, "V")} consume ${formatear(corriente, "A")}`;
    if (corriente > spec.corrientePorPin.max) avisos.push({ nivel: "error", regla: "pin-sobrecorriente", mensaje: `${texto}: supera el máximo absoluto de ${formatear(spec.corrientePorPin.max, "A")} y dañaría el pin.` });
    else if (corriente > spec.corrientePorPin.recomendada) avisos.push({ nivel: "advertencia", regla: "pin-corriente-alta", mensaje: `${texto}: por encima de los ${formatear(spec.corrientePorPin.recomendada, "A")} recomendados.` });
    else avisos.push({ nivel: "info", regla: "pin-corriente-ok", mensaje: `${texto}: dentro del límite recomendado.` });
  }
  return avisos;
}

export function specPorFicha(slug: string): ComponentSpec | undefined {
  return Object.values(COMPONENT_SPECS).find((spec) => spec.ficha === slug);
}

// ── Formatting ──────────────────────────────────────────────────────────────

const PREFIJOS: Array<[number, string]> = [[1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"]];

/** 0.0147 A → "14.7 mA"; values without a prefixable unit keep their unit as is. */
export function formatear(valor: number, unidad: string): string {
  if (!Number.isFinite(valor)) return `∞ ${unidad}`.trim();
  if (valor === 0 || !["V", "A", "W", "Ω", "F", "H"].includes(unidad)) return `${Number(valor.toPrecision(4))} ${unidad}`.trim();
  const [escala, prefijo] = PREFIJOS.find(([paso]) => Math.abs(valor) >= paso) ?? PREFIJOS[PREFIJOS.length - 1];
  return `${Number((valor / escala).toPrecision(3))} ${prefijo}${unidad}`;
}

const UNIDAD_MAGNITUD: Record<Magnitud, string> = { voltaje: "V", voltajeInverso: "V", corriente: "A", potencia: "W" };
const NOMBRE_MAGNITUD: Record<Magnitud, string> = { voltaje: "Voltaje", voltajeInverso: "Voltaje inverso", corriente: "Corriente", potencia: "Potencia" };

export function describirLimite(limite: LimiteOperacion, valorNominal?: string) {
  const unidad = UNIDAD_MAGNITUD[limite.magnitud];
  const nominal = valorNominal ?? "el valor nominal";
  return {
    magnitud: NOMBRE_MAGNITUD[limite.magnitud],
    min: limite.min !== undefined ? formatear(limite.min, unidad) : limite.minRelativo !== undefined ? `${limite.minRelativo * 100} % de ${nominal}` : "—",
    max: limite.max !== undefined ? formatear(limite.max, unidad) : limite.maxRelativo !== undefined ? `${limite.maxRelativo * 100} % de ${nominal}` : "—",
  };
}

/**
 * A field value as text, in the unit the field is typed in: SI prefixes when the field is in base units
 * (470000 Ω → "470 kΩ"), the field's own unit otherwise (capacitor field 0.001 → "0.001 µF").
 */
export function formatearValor(valor: ValorSpec, n: number) {
  return valor.unidadSI && valor.aSI === 1 ? formatear(n, valor.unidadSI) : `${n} ${valor.unidad}`;
}

export function describirRango(valor: ValorSpec, rango: Rango = valor.permitido) {
  return `${formatearValor(valor, rango.min)} – ${formatearValor(valor, rango.max)}`;
}

// ── Rules ───────────────────────────────────────────────────────────────────

/** A placed part, as far as the rules need to know it. */
export interface Pieza {
  id: string;
  kind: ComponentKind;
  value: number;
  on?: boolean;
  position?: number;
  polarity?: "NPN" | "PNP";
}

export function nombreDe(pieza: Pick<Pieza, "id" | "kind">) {
  return `${COMPONENT_SPECS[pieza.kind].nombre} ${pieza.id}`;
}

/** Checks a typed value against the part's allowed and recommended ranges. */
export function validarValor(pieza: Pick<Pieza, "id" | "kind" | "value">): Aviso | null {
  const valor = COMPONENT_SPECS[pieza.kind].valor;
  if (!valor) return null;
  const v = pieza.value;
  if (!Number.isFinite(v) || v < valor.permitido.min || v > valor.permitido.max) {
    return {
      nivel: "error",
      regla: "valor-fuera-de-rango",
      componente: pieza.id,
      mensaje: `${nombreDe(pieza)}: ${valor.etiqueta.toLowerCase()} de ${Number.isFinite(v) ? `${v} ${valor.unidad}` : "valor no numérico"} está fuera del rango permitido (${describirRango(valor)}).`,
    };
  }
  if (valor.recomendado && (v < valor.recomendado.min || v > valor.recomendado.max)) {
    return { nivel: "advertencia", regla: "valor-no-recomendado", componente: pieza.id, mensaje: `${nombreDe(pieza)}: ${v} ${valor.unidad}. ${valor.recomendado.motivo}` };
  }
  return null;
}

/** The value clamped into the allowed range, for drawing a part whose typed value is invalid. */
export function valorSeguro(pieza: Pick<Pieza, "kind" | "value">): number {
  const valor = COMPONENT_SPECS[pieza.kind].valor;
  if (!valor) return pieza.value;
  if (!Number.isFinite(pieza.value)) return valor.porDefecto;
  return Math.min(valor.permitido.max, Math.max(valor.permitido.min, pieza.value));
}

class UnionFind {
  private padre = new Map<string, string>();
  find(x: string): string {
    const p = this.padre.get(x) ?? x;
    if (p === x) return x;
    const raiz = this.find(p);
    this.padre.set(x, raiz);
    return raiz;
  }
  union(a: string, b: string) {
    this.padre.set(this.find(a), this.find(b));
  }
}

/** Which ideal connections a part contributes right now (closed switch, inductor, potentiometer at an end). */
function conexionesIdeales(pieza: Pieza): Array<[string, string]> {
  const spec = COMPONENT_SPECS[pieza.kind];
  if (spec.ideal === "siempre" || (spec.ideal === "cerrado" && pieza.on)) return [[spec.terminales[0], spec.terminales[1]]];
  if (pieza.kind === "potentiometer") {
    const posicion = pieza.position ?? 0.5;
    if (posicion === 0) return [["A", "W"]];
    if (posicion === 1) return [["W", "B"]];
  }
  return [];
}

export interface AnalisisConexiones {
  avisos: Aviso[];
  /** Separate circuits that can be solved, each with its battery; part ids. */
  islas: string[][];
}

/**
 * Checks values and wiring before solving. `netDe` returns the net a terminal is wired to, or null when
 * nothing is connected to it. Parts that can't be solved are left out with a warning instead of
 * making the whole simulation fail; only invalid values or a circuit with no battery stop everything.
 */
export function analizarConexiones(piezas: Pieza[], netDe: (id: string, terminal: string) => string | null): AnalisisConexiones {
  const avisos: Aviso[] = [];
  const electricas = piezas.filter((p) => p.kind !== "breadboard");

  if (!electricas.length) {
    return { avisos: [{ nivel: "error", regla: "circuito-vacio", mensaje: "Agrega componentes al área de trabajo para simular." }], islas: [] };
  }

  const errores = electricas.map(validarValor).filter((a): a is Aviso => a !== null);
  avisos.push(...errores);
  if (errores.some((a) => a.nivel === "error")) {
    avisos.unshift({ nivel: "error", regla: "valores-invalidos", mensaje: "Corrige los valores marcados antes de simular." });
    return { avisos, islas: [] };
  }

  const net = (p: Pieza, t: string) => netDe(p.id, t) ?? `suelto:${p.id}:${t}`;
  const incluidas = new Set<string>();

  for (const p of electricas) {
    const terminales = COMPONENT_SPECS[p.kind].terminales;
    if (terminales.every((t) => netDe(p.id, t) === null)) {
      avisos.push({ nivel: "advertencia", regla: "sin-conexiones", componente: p.id, mensaje: `${nombreDe(p)} no tiene ningún cable: se dejó fuera de la simulación.` });
    } else {
      incluidas.add(p.id);
    }
  }

  // Ideal 0 Ω connections first: one closing a loop with another ideal connection is redundant (same
  // voltages, indeterminate current), so it is left out.
  const ideales = new UnionFind();
  for (const p of electricas) {
    if (!incluidas.has(p.id)) continue;
    for (const [a, b] of conexionesIdeales(p)) {
      if (ideales.find(net(p, a)) === ideales.find(net(p, b))) {
        incluidas.delete(p.id);
        avisos.push({
          nivel: "info",
          regla: "conductor-ideal-redundante",
          componente: p.id,
          mensaje: `${nombreDe(p)} une dos puntos que ya estaban unidos sin resistencia (otro cable, interruptor o inductor): no cambia el circuito y se omitió del cálculo.`,
        });
      } else {
        ideales.union(net(p, a), net(p, b));
      }
    }
  }

  // Batteries: + and − joined without resistance is a short; two batteries on the same pair of nodes are in parallel.
  const bloqueadas = new Set<string>();
  const conBaterias = new UnionFind();
  for (const p of electricas) {
    if (!incluidas.has(p.id)) continue;
    for (const [a, b] of conexionesIdeales(p)) conBaterias.union(net(p, a), net(p, b));
  }
  for (const p of electricas) {
    if (p.kind !== "battery" || !incluidas.has(p.id)) continue;
    const mas = ideales.find(net(p, "+"));
    const menos = ideales.find(net(p, "-"));
    if (mas === menos) {
      bloqueadas.add(p.id);
      avisos.push({
        nivel: "error",
        regla: "bateria-en-corto",
        componente: p.id,
        mensaje: `${nombreDe(p)} está en cortocircuito: su + y su − quedan unidos sin ninguna resistencia. Ese circuito no se simuló.`,
      });
    } else if (conBaterias.find(net(p, "+")) === conBaterias.find(net(p, "-"))) {
      bloqueadas.add(p.id);
      avisos.push({
        nivel: "error",
        regla: "baterias-en-paralelo",
        componente: p.id,
        mensaje: `${nombreDe(p)} queda en paralelo directo con otra batería. Dos fuentes ideales no pueden compartir los mismos nodos. Ese circuito no se simuló.`,
      });
    } else {
      conBaterias.union(net(p, "+"), net(p, "-"));
    }
  }

  // A part whose terminals both land on the same node gets no voltage.
  for (const p of electricas) {
    const t = COMPONENT_SPECS[p.kind].terminales;
    if (!incluidas.has(p.id) || p.kind === "battery" || t.length !== 2 || COMPONENT_SPECS[p.kind].ideal) continue;
    if (ideales.find(net(p, t[0])) === ideales.find(net(p, t[1]))) {
      avisos.push({ nivel: "info", regla: "componente-en-corto", componente: p.id, mensaje: `${nombreDe(p)} está puenteado: sus dos terminales están unidos, así que no recibe voltaje.` });
    }
  }

  // A transistor whose base sits on a battery terminal and emitter on the other has no base resistor.
  for (const p of electricas) {
    if (p.kind !== "transistor" || !incluidas.has(p.id)) continue;
    const base = ideales.find(net(p, "B"));
    const emisor = ideales.find(net(p, "E"));
    const directa = electricas.some((b) => b.kind === "battery" && incluidas.has(b.id) && (() => {
      const mas = ideales.find(net(b, "+"));
      const menos = ideales.find(net(b, "-"));
      return (base === mas && emisor === menos) || (base === menos && emisor === mas);
    })());
    if (directa) {
      avisos.push({ nivel: "advertencia", regla: "base-sin-resistencia", componente: p.id, mensaje: `${nombreDe(p)}: la base va directo a la batería. En la realidad la unión base-emisor se quemaría; pon una resistencia de 1–10 kΩ.` });
    }
  }

  // Keep only parts whose every terminal has a DC path to a battery; repeat, since leaving a part out can strand others.
  let islas: Map<string, string[]> = new Map();
  for (let vuelta = 0; vuelta < 100; vuelta++) {
    const grafo = new UnionFind();
    for (const p of electricas) {
      if (!incluidas.has(p.id)) continue;
      for (const [a, b] of [...COMPONENT_SPECS[p.kind].ramas, ...conexionesIdeales(p)]) grafo.union(ideales.find(net(p, a)), ideales.find(net(p, b)));
    }
    const isla = (p: Pieza, t: string) => grafo.find(ideales.find(net(p, t)));
    const conBateria = new Set(electricas.filter((p) => p.kind === "battery" && incluidas.has(p.id)).map((p) => isla(p, "+")));

    let cambio = false;
    islas = new Map();
    for (const p of electricas) {
      if (!incluidas.has(p.id)) continue;
      const terminales = COMPONENT_SPECS[p.kind].terminales;
      const propias = new Set(terminales.map((t) => isla(p, t)));
      const flotantes = terminales.filter((t) => !conBateria.has(isla(p, t)));
      if (flotantes.length === terminales.length) {
        incluidas.delete(p.id);
        cambio = true;
        avisos.push({ nivel: "advertencia", regla: "sin-bateria", componente: p.id, mensaje: `${nombreDe(p)} no forma un circuito con ninguna batería: se dejó fuera de la simulación.` });
      } else if (flotantes.length) {
        incluidas.delete(p.id);
        cambio = true;
        const sueltos = flotantes.filter((t) => netDe(p.id, t) === null);
        avisos.push({
          nivel: "advertencia",
          regla: "terminal-flotante",
          componente: p.id,
          mensaje: sueltos.length
            ? `${nombreDe(p)}: ${sueltos.length === 1 ? "el terminal" : "los terminales"} ${sueltos.join(", ")} ${sueltos.length === 1 ? "está suelto" : "están sueltos"}, así que no se puede calcular. Se dejó fuera; conéctalo o quítalo.`
            : `${nombreDe(p)}: ${flotantes.length === 1 ? "el terminal" : "los terminales"} ${flotantes.join(", ")} no ${flotantes.length === 1 ? "tiene" : "tienen"} un camino de corriente continua hacia la batería (queda flotando, p. ej. solo a través de un capacitor). Se dejó fuera de la simulación.`,
        });
      } else if (propias.size > 1) {
        incluidas.delete(p.id);
        cambio = true;
        avisos.push({ nivel: "advertencia", regla: "une-circuitos-separados", componente: p.id, mensaje: `${nombreDe(p)} une dos circuitos con baterías distintas pero sin camino de corriente entre ellos; se dejó fuera.` });
      } else {
        const clave = [...propias][0];
        islas.set(clave, [...(islas.get(clave) ?? []), p.id]);
      }
    }
    if (!cambio) break;
  }

  const resultado = [...islas.values()].filter((ids) => !ids.some((id) => bloqueadas.has(id)));
  if (!resultado.length && !avisos.some((a) => a.nivel === "error")) {
    avisos.unshift({
      nivel: "error",
      regla: "sin-bateria",
      mensaje: electricas.some((p) => p.kind === "battery") ? "Ninguna batería forma un circuito cerrado: conecta sus dos terminales a través de los componentes." : "Agrega una batería: sin fuente de energía no hay nada que simular.",
    });
  }
  return { avisos, islas: resultado };
}

/** What the solver reports for one part (structurally the simulator's ComponentResult). */
export interface Medicion {
  componentId: string;
  voltage: number;
  current: number;
  power: number;
  measurements?: Record<string, number | boolean>;
}

function magnitud(m: Medicion, cual: Magnitud): number {
  switch (cual) {
    case "voltaje": return Math.abs(m.voltage);
    case "voltajeInverso": return Math.max(0, -m.voltage);
    case "corriente": return Math.abs(m.current);
    case "potencia": return Math.abs(m.power);
  }
}

/** Checks each solved part against its operating limits, plus a few behaviours worth pointing out. */
export function validarResultado(pieza: Pieza, m: Medicion): Aviso[] {
  const spec = COMPONENT_SPECS[pieza.kind];
  const avisos: Aviso[] = [];
  const nominal = spec.valor ? pieza.value * spec.valor.aSI : 0;

  for (const limite of spec.limites) {
    // The sensor's supply is only visible on ECHO while it is echoing.
    if (pieza.kind === "ultrasonic" && !m.measurements?.triggered) continue;
    const medido = magnitud(m, limite.magnitud);
    const unidad = UNIDAD_MAGNITUD[limite.magnitud];
    const max = limite.max ?? (limite.maxRelativo !== undefined ? limite.maxRelativo * nominal : undefined);
    const min = limite.min ?? (limite.minRelativo !== undefined ? limite.minRelativo * nominal : undefined);
    if (max !== undefined && medido > max * (1 + 1e-9)) {
      avisos.push({ nivel: limite.nivel, regla: `limite-${limite.magnitud}`, componente: pieza.id, mensaje: `${nombreDe(pieza)}: ${NOMBRE_MAGNITUD[limite.magnitud].toLowerCase()} de ${formatear(medido, unidad)}, por encima del máximo de ${formatear(max, unidad)}. ${limite.motivo}` });
    } else if (min !== undefined && medido > 0 && medido < min * (1 - 1e-9)) {
      avisos.push({ nivel: limite.nivel, regla: `limite-${limite.magnitud}-minimo`, componente: pieza.id, mensaje: `${nombreDe(pieza)}: ${NOMBRE_MAGNITUD[limite.magnitud].toLowerCase()} de ${formatear(medido, unidad)}, por debajo de ${formatear(min, unidad)}. ${limite.motivo}` });
    }
  }

  if ((pieza.kind === "led" || pieza.kind === "diode") && m.voltage < 0) {
    avisos.push({ nivel: "info", regla: "polarizado-en-inversa", componente: pieza.id, mensaje: `${nombreDe(pieza)} está polarizado en inversa: el ánodo (A) debe ir hacia el + de la batería.` });
  } else if (pieza.kind === "led" && m.current > 0 && m.current < 0.002) {
    avisos.push({ nivel: "info", regla: "led-tenue", componente: pieza.id, mensaje: `${nombreDe(pieza)} conduce solo ${formatear(m.current, "A")}: casi no se vería encendido. Reduce la resistencia en serie.` });
  }
  if (pieza.kind === "dc-motor" && m.measurements?.stalled) {
    avisos.push({ nivel: "advertencia", regla: "motor-bloqueado", componente: pieza.id, mensaje: `${nombreDe(pieza)} alcanza su corriente de bloqueo: se calentaría rápidamente.` });
  }
  if (pieza.kind === "ultrasonic" && !m.measurements?.triggered && pieza.value >= 2 && pieza.value <= 400) {
    avisos.push({ nivel: "info", regla: "sin-eco", componente: pieza.id, mensaje: `${nombreDe(pieza)} no mide: TRIG necesita 2.5 V o más respecto de GND.` });
  }
  return avisos;
}

/** Rules about one solved circuit as a whole (one battery's island). */
export function validarCircuito(piezas: Pieza[], mediciones: Medicion[]): Aviso[] {
  // The ultrasonic model draws no current, so a circuit feeding only sensors would look open.
  if (piezas.some((p) => p.kind === "ultrasonic")) return [];
  if (mediciones.some((m) => Math.abs(m.current) > 1e-9)) return [];
  const bateria = piezas.find((p) => p.kind === "battery");
  return [{
    nivel: "info",
    regla: "circuito-abierto",
    componente: bateria?.id,
    mensaje: `${bateria ? nombreDe(bateria) : "La batería"} no entrega corriente: el circuito está abierto. Revisa cables, interruptores abiertos y el canal central de la protoboard.`,
  }];
}

/** Turns an error thrown by the solver or a component class into a message a student can act on. */
export function traducirErrorDelSolver(mensaje: string): string {
  if (/Floating nodes/i.test(mensaje)) return "Hay terminales sin un camino de corriente hacia la batería. Revisa los cables sueltos.";
  if (/Conflicting ideal voltage sources/i.test(mensaje)) return "Hay baterías en cortocircuito o en paralelo con voltajes distintos.";
  if (/Redundant ideal voltage constraints/i.test(mensaje)) return "Hay conductores ideales (cables, interruptores cerrados, inductores o baterías) formando un lazo sin resistencia.";
  if (/did not converge/i.test(mensaje)) return "El circuito no se pudo estabilizar (diodos, LEDs o transistores en una configuración que oscila). Agrega una resistencia en serie o revisa su orientación.";
  if (/At least one DC source/i.test(mensaje)) return "Agrega una batería: sin fuente de energía no hay nada que simular.";
  if (/Invalid resistance|must be positive|must be.*(finite|non-?negative|between)/i.test(mensaje)) return `Un componente tiene un valor no válido (${mensaje}).`;
  if (/Singular/i.test(mensaje)) return "El circuito no tiene solución única: revisa que no haya partes conectadas solo entre sí.";
  return `No se pudo resolver el circuito: ${mensaje}`;
}
