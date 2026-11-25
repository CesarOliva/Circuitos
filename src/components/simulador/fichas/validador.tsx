"use client";

import { useMemo, useState } from "react";
import {
  BOARD_SPECS,
  COMPONENT_SPECS,
  describirRango,
  formatear,
  validarPlaca,
  type Aviso,
  type BoardSpecId,
  type ComponentKind,
} from "@/data/componentSpecs";
import { simularCircuito, type Part, type Wire } from "../simular";

const NIVEL: Record<Aviso["nivel"], string> = { error: "Error", advertencia: "Advertencia", info: "Nota" };

function Avisos({ avisos, vacio }: { avisos: Aviso[]; vacio: string }) {
  if (!avisos.length) return <p className="validador-ok">✓ {vacio}</p>;
  return (
    <ul className="validador-avisos">
      {avisos.map((aviso, index) => (
        <li key={`${aviso.regla}-${aviso.componente ?? ""}-${index}`} className={`validador-${aviso.nivel}`}>
          <span>{NIVEL[aviso.nivel]}</span> {aviso.mensaje}
        </li>
      ))}
    </ul>
  );
}

function Campo({ etiqueta, unidad, valor, onChange, ayuda, min, step = "any" }: { etiqueta: string; unidad: string; valor: number; onChange(v: number): void; ayuda?: string; min?: number; step?: string }) {
  return (
    <label className="validador-campo">
      <span>{etiqueta}</span>
      <span className="validador-input">
        <input type="number" value={Number.isFinite(valor) ? valor : ""} min={min} step={step} onChange={(event) => onChange(event.target.value === "" ? NaN : Number(event.target.value))} />
        <span>{unidad}</span>
      </span>
      {ayuda && <small>{ayuda}</small>}
    </label>
  );
}

let cable = 0;
const W = (a: string, b: string): Wire => {
  const [c1, t1] = a.split(".");
  const [c2, t2] = b.split(".");
  return { id: `W${++cable}`, from: { componentId: c1, terminalId: t1 }, to: { componentId: c2, terminalId: t2 } };
};
const P = (id: string, kind: ComponentKind, value: number, extra: Partial<Part> = {}): Part => ({ id, kind, value, x: 0, y: 0, ...extra });

interface Banco {
  bateria: number;
  serie: number;
  base: number;
  valor: number;
  cerrado: boolean;
  posicion: number;
}

/** The test circuit for a part: a battery, an optional series resistor, and the part under test (X1). */
export function montaje(kind: ComponentKind, b: Banco): { parts: Part[]; wires: Wire[]; texto: string } {
  const spec = COMPONENT_SPECS[kind];
  const v = (n: number) => formatear(n, "V");
  const r = (n: number) => formatear(n, "Ω");
  if (kind === "battery") {
    const parts = [P("X1", "battery", b.valor)];
    if (b.serie > 0) return { parts: [...parts, P("RL", "resistor", b.serie)], wires: [W("X1.+", "RL.1"), W("RL.2", "X1.-")], texto: `Batería ${v(b.valor)} con una carga de ${r(b.serie)}` };
    return { parts, wires: [W("X1.+", "X1.-")], texto: `Batería ${v(b.valor)} con sus terminales unidos (sin carga)` };
  }
  const bateria = P("V1", "battery", b.bateria);
  const x1 = P("X1", kind, b.valor, { on: b.cerrado, position: b.posicion, polarity: "NPN" });
  if (kind === "ultrasonic") {
    return { parts: [bateria, x1], wires: [W("V1.+", "X1.VCC"), W("V1.+", "X1.TRIG"), W("X1.GND", "V1.-")], texto: `Batería ${v(b.bateria)}: VCC y TRIG al +, GND al −` };
  }
  if (kind === "transistor") {
    return {
      parts: [bateria, x1, P("RB", "resistor", b.base), P("RC", "resistor", b.serie)],
      wires: [W("V1.+", "RB.1"), W("RB.2", "X1.B"), W("V1.+", "RC.1"), W("RC.2", "X1.C"), W("X1.E", "V1.-")],
      texto: `Batería ${v(b.bateria)}; base por ${r(b.base)}; carga de ${r(b.serie)} en el colector; emisor a −`,
    };
  }
  const [t0, t1] = kind === "potentiometer" ? ["A", "B"] : spec.terminales;
  const parts = [bateria, x1];
  const wires = [W(`X1.${t1}`, "V1.-")];
  if (b.serie > 0) {
    parts.push(P("RS", "resistor", b.serie));
    wires.push(W("V1.+", "RS.1"), W("RS.2", `X1.${t0}`));
  } else {
    wires.push(W("V1.+", `X1.${t0}`));
  }
  return { parts, wires, texto: `Batería ${v(b.bateria)} → ${b.serie > 0 ? `${r(b.serie)} → ` : ""}${spec.nombre} (${t0} → ${t1}) → −` };
}

function ValidadorComponente({ kind }: { kind: ComponentKind }) {
  const spec = COMPONENT_SPECS[kind];
  const [banco, setBanco] = useState<Banco>({
    bateria: kind === "ultrasonic" ? 5 : kind === "dc-motor" ? 6 : kind === "active-buzzer" ? 5 : 9,
    serie: kind === "battery" ? 1000 : ["led", "diode", "capacitor", "inductor", "switch", "push-button"].includes(kind) ? 470 : kind === "transistor" ? 470 : 0,
    base: 10_000,
    valor: spec.valor?.porDefecto ?? 0,
    cerrado: true,
    posicion: 0.5,
  });
  const cambiar = (campo: keyof Banco) => (valor: number | boolean) => setBanco((actual) => ({ ...actual, [campo]: valor }));

  const { texto, simulacion } = useMemo(() => {
    const { parts, wires, texto } = montaje(kind, banco);
    return { texto, simulacion: simularCircuito(parts, wires) };
  }, [kind, banco]);
  const lectura = simulacion.result?.components.find((c) => c.componentId === "X1");
  const medidas = lectura?.measurements ?? {};

  return (
    <div className="validador">
      <div className="validador-campos">
        {kind !== "battery" && <Campo etiqueta="Voltaje de la batería" unidad="V" valor={banco.bateria} onChange={cambiar("bateria")} />}
        {spec.valor && (
          <Campo etiqueta={spec.valor.etiqueta} unidad={spec.valor.unidad} valor={banco.valor} onChange={cambiar("valor")} ayuda={`Permitido: ${describirRango(spec.valor)}`} />
        )}
        {kind === "transistor" && <Campo etiqueta="Resistencia de base" unidad="Ω" valor={banco.base} onChange={cambiar("base")} min={1} />}
        {kind !== "ultrasonic" && (
          <Campo
            etiqueta={kind === "battery" ? "Carga" : kind === "transistor" ? "Carga en el colector" : "Resistencia en serie"}
            unidad="Ω"
            valor={banco.serie}
            onChange={cambiar("serie")}
            min={0}
            ayuda={kind === "transistor" ? undefined : "0 = sin resistencia"}
          />
        )}
        {(kind === "switch" || kind === "push-button") && (
          <label className="validador-campo validador-check">
            <input type="checkbox" checked={banco.cerrado} onChange={(event) => cambiar("cerrado")(event.target.checked)} />
            <span>{kind === "switch" ? "Cerrado" : "Presionado"}</span>
          </label>
        )}
        {kind === "potentiometer" && (
          <label className="validador-campo">
            <span>Posición del cursor: {Math.round(banco.posicion * 100)} %</span>
            <input type="range" min={0} max={1} step={0.01} value={banco.posicion} onChange={(event) => cambiar("posicion")(Number(event.target.value))} />
          </label>
        )}
      </div>

      <p className="validador-montaje">
        <span>Circuito de prueba</span> {texto}
      </p>

      {lectura && (
        <dl className="validador-lectura">
          <div><dt>Voltaje</dt><dd>{formatear(lectura.voltage, "V")}</dd></div>
          <div><dt>Corriente</dt><dd>{formatear(Math.abs(lectura.current), "A")}</dd></div>
          <div><dt>Potencia</dt><dd>{formatear(Math.abs(lectura.power), "W")}</dd></div>
          {typeof medidas.rpm === "number" && <div><dt>Velocidad</dt><dd>{medidas.rpm.toFixed(0)} rpm</dd></div>}
          {typeof medidas.active === "boolean" && <div><dt>Suena</dt><dd>{medidas.active ? "sí" : "no"}</dd></div>}
          {typeof medidas.conducting === "boolean" && <div><dt>Conduce</dt><dd>{medidas.conducting ? "sí" : "no"}</dd></div>}
          {typeof medidas.triggered === "boolean" && <div><dt>Eco</dt><dd>{medidas.triggered ? `${Number(medidas.echoPulseWidthMicroseconds).toFixed(0)} µs` : "no"}</dd></div>}
        </dl>
      )}
      <Avisos avisos={simulacion.avisos} vacio="Dentro de todos los límites del componente." />
    </div>
  );
}

function ValidadorPlaca({ placa }: { placa: BoardSpecId }) {
  const spec = BOARD_SPECS[placa];
  const [entrada, setEntrada] = useState(spec.voltajeLogico / 2);
  const [resistencia, setResistencia] = useState(220);
  const avisos = useMemo(() => validarPlaca(placa, { voltajeEntrada: entrada, resistenciaLed: resistencia }), [placa, entrada, resistencia]);
  return (
    <div className="validador">
      <div className="validador-campos">
        <Campo etiqueta="Voltaje en una entrada analógica" unidad="V" valor={entrada} onChange={setEntrada} ayuda={`Permitido: ${formatear(spec.entradaAnalogica.min, "V")} – ${formatear(spec.entradaAnalogica.max, "V")}`} />
        <Campo etiqueta="Resistencia del LED en un pin de salida" unidad="Ω" valor={resistencia} onChange={setResistencia} min={0} ayuda="0 = LED sin resistencia" />
      </div>
      <Avisos avisos={avisos.filter((a) => a.nivel !== "info")} vacio="Voltaje de entrada y corriente del pin dentro de los límites." />
      <ul className="validador-avisos">
        {avisos.filter((a) => a.nivel === "info").map((a) => (
          <li key={a.regla} className="validador-info"><span>{NIVEL.info}</span> {a.mensaje}</li>
        ))}
      </ul>
    </div>
  );
}

/** Interactive voltage check for one technical sheet, driven by src/data/componentSpecs.ts. */
export function Validador({ slug }: { slug: string }) {
  if (slug in BOARD_SPECS) return <ValidadorPlaca placa={slug as BoardSpecId} />;
  const spec = Object.values(COMPONENT_SPECS).find((s) => s.ficha === slug);
  if (!spec || spec.kind === "breadboard") return null;
  return <ValidadorComponente kind={spec.kind} />;
}
