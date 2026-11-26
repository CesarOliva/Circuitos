"use client";

import { useState } from "react";
import {
  RESISTOR_RATED_W,
  SUPPLY,
  Shell,
  Slider,
  Split,
  clamp,
  flowSeconds,
  fmtMa,
  fmtOhms,
  fmtVolts,
  fmtWatts,
} from "./playground-kit";

// ---------- Potencia y el límite del resistor ----------

export function PowerPlayground() {
  const [volts, setVolts] = useState(5);
  const [ohms, setOhms] = useState(1000);
  const watts = (volts * volts) / ohms;
  const ma = (volts / ohms) * 1000;
  const ratio = watts / RESISTOR_RATED_W;
  const state = ratio > 1 ? "over" : ratio > 0.8 ? "hot" : "ok";

  const status =
    state === "over"
      ? `¡Sobrecarga! Disipa ${fmtWatts(watts)} y este resistor solo aguanta ${fmtWatts(RESISTOR_RATED_W)}. En la vida real se calentaría hasta quemarse.`
      : state === "hot"
        ? "Cerca del límite: funciona, pero muy caliente. Deja siempre un poco de margen."
        : volts === 9 && ohms <= 400
          ? `Seguro, pero justo: con 9 V el mínimo es 324 Ω (V² / 0.25 W) y ${fmtOhms(ohms)} ya casi lo roza.`
          : "Seguro: disipa bastante menos de lo que aguanta.";

  return (
    <Shell title="¿Cuánto calor aguanta?" hint="Reto: con 9 V, ¿cuál es la resistencia más baja que no se pasa de 0.25 W? Pista: R = V² / P.">
      <svg className="pg-svg pg-svg-narrow" viewBox="0 0 320 120" role="img" aria-label={`Resistor de ${fmtOhms(ohms)} con ${fmtVolts(volts)}: disipa ${fmtWatts(watts)}.`}>
        <path className="pg-wire" d="M10 78 H123 M197 78 H310" />
        <g className="pg-part" data-state={state}>
          <path d="M123 78 l9 -14 14 28 14 -28 14 28 14 -28 9 14" />
        </g>
        <g className="pg-heat-waves" style={{ opacity: ratio < 0.05 ? 0 : clamp(ratio * 0.8, 0.15, 1) }}>
          {[140, 160, 180].map((x, index) => (
            <path key={x} className="pg-heat" d={`M${x} 52 q 6 -7 0 -14 t 0 -14`} style={{ animationDelay: `${index * -0.5}s` }} />
          ))}
        </g>
      </svg>
      <div className="pg-controls">
        <Slider label="Voltaje" display={fmtVolts(volts)} value={volts} min={1} max={12} step={1} onChange={setVolts} />
        <Slider label="Resistencia" display={fmtOhms(ohms)} value={ohms} min={50} max={2000} step={50} onChange={setOhms} />
      </div>
      <p className="pg-readout">
        P = V · I = {fmtVolts(volts)} × {fmtMa(ma)} = <strong>{fmtWatts(watts)}</strong>
        {" · "}límite {fmtWatts(RESISTOR_RATED_W)}
      </p>
      <div className="pg-meter" aria-hidden="true">
        <span className="pg-meter-fill" data-state={state} style={{ width: `${clamp(watts / (RESISTOR_RATED_W * 2), 0, 1) * 100}%` }} />
        <span className="pg-meter-target pg-meter-limit" style={{ left: "50%" }} />
      </div>
      <p className="pg-status" data-state={state === "ok" ? "ok" : state === "over" ? "bad" : undefined} role="status">{status}</p>
    </Shell>
  );
}

// ---------- Divisor de voltaje ----------

const DIVIDER_TARGET = 3;

export function DividerPlayground() {
  const [r1, setR1] = useState(1000);
  const [r2, setR2] = useState(1000);
  const vout = (SUPPLY * r2) / (r1 + r2);
  const vr1 = SUPPLY - vout;
  const solved = Math.abs(vout - DIVIDER_TARGET) < 0.01;

  return (
    <Shell title="Reparte el voltaje" hint={`Reto: con la fuente de 9 V, consigue que Vout sea exactamente ${DIVIDER_TARGET} V moviendo R1 y R2.`}>
      <Split label={`R1 se queda con ${fmtVolts(vr1)} y R2 con ${fmtVolts(vout)}`} parts={[{ label: `R1 · ${fmtVolts(vr1)}`, value: vr1 }, { label: `R2 · Vout = ${fmtVolts(vout)}`, value: vout }]} />
      <div className="pg-controls">
        <Slider label="R1" display={fmtOhms(r1)} value={r1} min={100} max={5000} step={100} onChange={setR1} />
        <Slider label="R2" display={fmtOhms(r2)} value={r2} min={100} max={5000} step={100} onChange={setR2} />
      </div>
      <p className="pg-readout">
        Vout = 9 V × R2 / (R1 + R2) = 9 V × {fmtOhms(r2)} / ({fmtOhms(r1)} + {fmtOhms(r2)}) = <strong>{fmtVolts(vout)}</strong>
      </p>
      <p className="pg-status" data-state={solved ? "ok" : undefined} role="status">
        {solved
          ? `¡Lo lograste! Con R1 = ${fmtOhms(r1)} y R2 = ${fmtOhms(r2)} salen justo ${DIVIDER_TARGET} V. Fíjate: R1 es el doble de R2.`
          : `Vas en ${fmtVolts(vout)}. Necesitas ${DIVIDER_TARGET} V.`}
      </p>
    </Shell>
  );
}

// ---------- Leyes de Kirchhoff ----------

export function KirchhoffPlayground() {
  const [tab, setTab] = useState<"nodos" | "mallas">("nodos");
  const [ra, setRa] = useState(1000);
  const [rb, setRb] = useState(2000);
  const [r1, setR1] = useState(2000);
  const [r2, setR2] = useState(1000);

  const ia = (SUPPLY / ra) * 1000;
  const ib = (SUPPLY / rb) * 1000;
  const loopMa = (SUPPLY / (r1 + r2)) * 1000;
  const v1 = (loopMa / 1000) * r1;
  const v2 = (loopMa / 1000) * r2;

  return (
    <Shell title="Nodos y mallas" hint="Cambia las resistencias y comprueba que las sumas siempre cuadran.">
      <div className="pg-actions" role="group" aria-label="Ley de Kirchhoff">
        <button type="button" aria-pressed={tab === "nodos"} onClick={() => setTab("nodos")}>Corrientes en un nodo</button>
        <button type="button" aria-pressed={tab === "mallas"} onClick={() => setTab("mallas")}>Voltajes en una malla</button>
      </div>
      {tab === "nodos" ? (
        <>
          <Split label={`La corriente total ${fmtMa(ia + ib)} se reparte en ${fmtMa(ia)} y ${fmtMa(ib)}`} parts={[{ label: `I1 · ${fmtMa(ia)}`, value: ia }, { label: `I2 · ${fmtMa(ib)}`, value: ib }]} />
          <div className="pg-controls">
            <Slider label="Rama 1 (R1)" display={fmtOhms(ra)} value={ra} min={500} max={3000} step={100} onChange={setRa} />
            <Slider label="Rama 2 (R2)" display={fmtOhms(rb)} value={rb} min={500} max={3000} step={100} onChange={setRb} />
          </div>
          <p className="pg-readout">
            I = I1 + I2 = {fmtMa(ia)} + {fmtMa(ib)} = <strong>{fmtMa(ia + ib)}</strong>
          </p>
          <p className="pg-status">Las dos ramas están conectadas a los 9 V completos; la fuente entrega la suma de lo que se lleva cada una.</p>
        </>
      ) : (
        <>
          <Split label={`Los 9 V se reparten en ${fmtVolts(v1)} y ${fmtVolts(v2)}`} parts={[{ label: `V1 · ${fmtVolts(v1)}`, value: v1 }, { label: `V2 · ${fmtVolts(v2)}`, value: v2 }]} />
          <div className="pg-controls">
            <Slider label="R1" display={fmtOhms(r1)} value={r1} min={500} max={3000} step={100} onChange={setR1} />
            <Slider label="R2" display={fmtOhms(r2)} value={r2} min={500} max={3000} step={100} onChange={setR2} />
          </div>
          <p className="pg-readout">
            9 V = V1 + V2 = {fmtVolts(v1)} + {fmtVolts(v2)}
            {" · "}la corriente de la malla es <strong>{fmtMa(loopMa)}</strong>
          </p>
          <p className="pg-status">Es la misma corriente en toda la malla; cada resistor se queda con la parte de voltaje que le toca.</p>
        </>
      )}
    </Shell>
  );
}

// ---------- Circuitos mixtos paso a paso ----------

function Box({ x, y, w = 72, label }: { x: number; y: number; w?: number; label: string }) {
  return (
    <g className="pg-part">
      <rect className="pg-box" x={x} y={y} width={w} height="30" rx="6" />
      <text x={x + w / 2} y={y + 19} textAnchor="middle">{label}</text>
    </g>
  );
}

const MIXED_WIRES = [
  "M40 65 H90 M162 65 H200 M200 65 V20 H230 M302 20 H332 V65 M200 65 V95 H230 M302 95 H332 V65 M332 65 H372 V135 H30 V65",
  "M40 65 H90 M162 65 H230 M302 65 H372 V135 H30 V65",
  "M40 65 H150 M250 65 H372 V135 H30 V65",
];

export function MixedPlayground() {
  const [step, setStep] = useState(0);
  const [r1, setR1] = useState(1000);
  const [r2, setR2] = useState(2000);
  const [r3, setR3] = useState(2000);

  const r23 = (r2 * r3) / (r2 + r3);
  const req = r1 + r23;
  const ma = (SUPPLY / req) * 1000;
  const vr1 = (ma / 1000) * r1;
  const v23 = SUPPLY - vr1;
  const wire = MIXED_WIRES[Math.min(step, 2)];

  function change(setter: (value: number) => void, value: number) {
    setter(value);
    setStep(0);
  }

  return (
    <Shell title="Reduce el circuito" hint="Pulsa «Siguiente paso» y mira cómo se simplifica hasta quedar una sola resistencia. Cambia los valores para repetirlo.">
      <svg className="pg-svg pg-svg-narrow" viewBox="0 0 400 150" role="img" aria-label={step === 0 ? "R1 en serie con R2 y R3 en paralelo." : step === 1 ? "R1 en serie con la equivalente de R2 y R3." : "Una sola resistencia equivalente."}>
        <path className="pg-wire" d={wire} />
        <path className="pg-flow" d={wire} style={{ animationDuration: `${flowSeconds(ma)}s` }} />
        <g className="pg-part"><path d="M30 45 V85 M40 52 V78" /><text x="35" y="36" textAnchor="middle">9 V</text></g>
        {step === 0 && (
          <>
            <Box x={90} y={50} label={`R1 ${fmtOhms(r1)}`} />
            <Box x={230} y={5} label={`R2 ${fmtOhms(r2)}`} />
            <Box x={230} y={80} label={`R3 ${fmtOhms(r3)}`} />
          </>
        )}
        {step === 1 && (
          <>
            <Box x={90} y={50} label={`R1 ${fmtOhms(r1)}`} />
            <Box x={230} y={50} label={`R23 ${fmtOhms(r23)}`} />
          </>
        )}
        {step >= 2 && <Box x={150} y={50} w={100} label={`Req ${fmtOhms(req)}`} />}
        {step >= 3 && <g className="pg-part"><text x="200" y="124" textAnchor="middle">I = {fmtMa(ma)}</text></g>}
      </svg>
      <div className="pg-controls">
        <Slider label="R1" display={fmtOhms(r1)} value={r1} min={100} max={3000} step={100} onChange={(value) => change(setR1, value)} />
        <Slider label="R2" display={fmtOhms(r2)} value={r2} min={100} max={3000} step={100} onChange={(value) => change(setR2, value)} />
        <Slider label="R3" display={fmtOhms(r3)} value={r3} min={100} max={3000} step={100} onChange={(value) => change(setR3, value)} />
      </div>
      <div className="pg-actions">
        <button type="button" disabled={step >= 3} onClick={() => setStep(step + 1)}>Siguiente paso</button>
        <button type="button" disabled={step === 0} onClick={() => setStep(0)}>Reiniciar</button>
      </div>
      {step === 0 ? (
        <p className="pg-status">Empieza por lo que está en paralelo: R2 y R3.</p>
      ) : (
        <ol className="pg-steps">
          <li>R2 ∥ R3 = {fmtOhms(r2)} ∥ {fmtOhms(r3)} = <strong>{fmtOhms(r23)}</strong></li>
          {step >= 2 && <li>Req = R1 + R23 = {fmtOhms(r1)} + {fmtOhms(r23)} = <strong>{fmtOhms(req)}</strong></li>}
          {step >= 3 && (
            <li>
              I = 9 V / {fmtOhms(req)} = <strong>{fmtMa(ma)}</strong>. R1 se queda con {fmtVolts(vr1)} y el bloque R2 ∥ R3 con {fmtVolts(v23)}, así que por R2 pasan {fmtMa((v23 / r2) * 1000)} y por R3, {fmtMa((v23 / r3) * 1000)}.
            </li>
          )}
        </ol>
      )}
    </Shell>
  );
}

// ---------- Protoboard ----------

const ROWS = 12;
const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
const LETTER_X: Record<string, number> = { a: 88, b: 110, c: 132, d: 154, e: 176, f: 220, g: 242, h: 264, i: 286, j: 308 };
const RAILS = [
  { id: "L+", x: 24, sign: "+", side: "izquierdo" },
  { id: "L-", x: 46, sign: "−", side: "izquierdo" },
  { id: "R+", x: 350, sign: "+", side: "derecho" },
  { id: "R-", x: 372, sign: "−", side: "derecho" },
];
const rowY = (row: number) => 46 + (row - 1) * 24;

interface Hole {
  id: string;
  name: string;
  group: string;
  x: number;
  y: number;
  rail?: boolean;
  row?: number;
  half?: "a–e" | "f–j";
}

const HOLES: Hole[] = [
  ...Array.from({ length: ROWS }, (_, index) => index + 1).flatMap((row) =>
    LETTERS.map((letter): Hole => {
      const half = letter <= "e" ? "a–e" : "f–j";
      return { id: `${letter}${row}`, name: `${letter}${row}`, group: `fila ${row} ${half}`, x: LETTER_X[letter], y: rowY(row), row, half };
    }),
  ),
  ...RAILS.flatMap((rail) =>
    Array.from({ length: ROWS }, (_, index) => index + 1).map(
      (row): Hole => ({ id: `${rail.id}${row}`, name: `riel ${rail.sign} ${rail.side}`, group: `riel ${rail.id}`, x: rail.x, y: rowY(row), rail: true, row }),
    ),
  ),
];

function explain(a: Hole, b: Hole) {
  if (a.group === b.group) {
    return a.rail
      ? `Sí están conectados: ${a.name} es un riel que corre de punta a punta, así que todos sus agujeros son el mismo punto.`
      : `Sí están conectados: ${a.name} y ${b.name} están en la misma tira de 5 agujeros (${a.half} de la fila ${a.row}).`;
  }
  if (a.rail && b.rail) return `No están conectados: son rieles distintos y no se tocan entre sí.`;
  if (!a.rail && !b.rail && a.row === b.row) return `No están conectados: aunque son de la misma fila, el canal central separa a–e de f–j.`;
  return `No están conectados: están en tiras distintas. Para unirlos necesitarías un cable o un componente.`;
}

export function BreadboardPlayground() {
  const [picked, setPicked] = useState<string[]>([]);
  const first = HOLES.find((hole) => hole.id === picked[0]);
  const second = HOLES.find((hole) => hole.id === picked[1]);

  function pick(id: string) {
    setPicked((current) => (current.length === 1 ? [current[0], id] : [id]));
  }

  const message = second && first
    ? explain(first, second)
    : first
      ? `Elegiste ${first.name}. Lo resaltado en azul es todo lo que está unido a él. Elige otro agujero para comparar.`
      : "Toca un agujero para ver con cuáles está unido por dentro.";

  return (
    <Shell title="¿Qué está conectado?" hint="Toca dos agujeros y mira si están unidos. Reto: encuentra dos agujeros de la misma fila que NO estén conectados.">
      <svg className="pg-svg pg-svg-narrow" viewBox="0 0 400 340" role="group" aria-label="Protoboard de 12 filas (vista recortada)">
        <rect className="pg-board" x="8" y="30" width="384" height="296" rx="10" />
        <rect className="pg-channel" x="190" y="30" width="16" height="296" />
        {[...LETTERS.map((letter) => ({ x: LETTER_X[letter], text: letter })), ...RAILS.map((rail) => ({ x: rail.x, text: rail.sign }))].map((header) => (
          <text key={`${header.x}-${header.text}`} className="pg-label" x={header.x} y="22" textAnchor="middle">{header.text}</text>
        ))}
        {Array.from({ length: ROWS }, (_, index) => index + 1).map((row) => (
          <text key={row} className="pg-label" x="198" y={rowY(row) + 4} textAnchor="middle">{row}</text>
        ))}
        {HOLES.map((hole) => {
          const state = first && hole.group === first.group ? "a" : second && hole.group === second.group ? "b" : undefined;
          return (
            <circle
              key={hole.id}
              className="pg-hole"
              cx={hole.x}
              cy={hole.y}
              r="7"
              data-state={state}
              data-picked={hole.id === picked[0] || hole.id === picked[1] ? "" : undefined}
              role="button"
              aria-label={hole.rail ? `${hole.name}, agujero ${hole.row}` : `Agujero ${hole.name}`}
              onClick={() => pick(hole.id)}
            />
          );
        })}
      </svg>
      <p className="pg-status" data-state={first && second ? (first.group === second.group ? "ok" : "bad") : undefined} role="status">{message}</p>
      <div className="pg-actions">
        <button type="button" disabled={picked.length === 0} onClick={() => setPicked([])}>Limpiar</button>
      </div>
    </Shell>
  );
}
