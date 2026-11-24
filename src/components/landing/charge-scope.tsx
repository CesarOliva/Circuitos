import type { CSSProperties } from "react";
import { ScrollStage } from "./scroll-stage";

// Carga de un capacitor: V(t) = 9 V · (1 − e^(−t/τ)), con R = 1 kΩ y C = 100 µF, así τ = RC = 0.1 s.
const SOURCE_VOLTS = 9;
const TAU = 0.1;
const T_MAX = 0.6; // 6τ, la pantalla va de 0 a 0.6 s
const SAMPLES = 60;
const PLOT = { left: 60, width: 520, top: 40, bottom: 300 };

const CURVE = Array.from({ length: SAMPLES + 1 }, (_, index) => {
  const t = (index / SAMPLES) * T_MAX;
  const volts = SOURCE_VOLTS * (1 - Math.exp(-t / TAU));
  const x = PLOT.left + (t / T_MAX) * PLOT.width;
  const y = PLOT.bottom - (volts / SOURCE_VOLTS) * (PLOT.bottom - PLOT.top);
  return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
}).join(" ");

const GRID_X = Array.from({ length: 11 }, (_, index) => PLOT.left + index * 52);
const GRID_Y = Array.from({ length: 11 }, (_, index) => PLOT.top + index * 26);
const TAU_MARKS = [1, 3, 5].map((multiple) => ({ label: `${multiple}τ`, x: PLOT.left + ((multiple * TAU) / T_MAX) * PLOT.width }));

const READOUTS = [
  { at: 0.05, label: "Constante de tiempo", value: "0.1 s", detail: "τ = R · C = 1 kΩ × 100 µF" },
  { at: 0.2, label: "Tras 1 τ", value: "5.7 V", detail: "63 % de 9 V" },
  { at: 0.5, label: "Tras 3 τ", value: "8.6 V", detail: "95 % de 9 V" },
  { at: 0.85, label: "Tras 5 τ", value: "8.9 V", detail: "99 % de 9 V" },
];

// Osciloscopio que dibuja la curva de carga mientras se baja; el punto recorre la curva y las lecturas aparecen en sus pasos.
export function ChargeScope() {
  return (
    <ScrollStage>
      <div className="stage-sticky">
        <div className="stage-progress" aria-hidden="true" />
        <div className="stage-head">
          <h2>Así se carga un capacitor</h2>
          <p>La curva sale de la ecuación del circuito RC, la misma que resuelve el simulador.</p>
        </div>
        <div className="scope-scene">
          <div className="scope-body">
            <div className="scope-screen">
              <svg className="scope-svg" viewBox="0 0 620 360" role="img" aria-label="Curva de carga de un capacitor de 100 µF a través de 1 kΩ, desde una fuente de 9 V">
                {GRID_X.map((x) => (
                  <line key={`x-${x}`} className="scope-grid" x1={x} y1={PLOT.top} x2={x} y2={PLOT.bottom} />
                ))}
                {GRID_Y.map((y) => (
                  <line key={`y-${y}`} className="scope-grid" x1={PLOT.left} y1={y} x2={PLOT.left + PLOT.width} y2={y} />
                ))}
                <line className="scope-ref" x1={PLOT.left} y1={PLOT.top} x2={PLOT.left + PLOT.width} y2={PLOT.top} />
                {TAU_MARKS.map(({ label, x }) => (
                  <g key={label}>
                    <line className="scope-ref" x1={x} y1={PLOT.top} x2={x} y2={PLOT.bottom} />
                    <text className="scope-axis" x={x} y="322" textAnchor="middle">{label}</text>
                  </g>
                ))}
                <text className="scope-axis" x="52" y="44" textAnchor="end">9 V</text>
                <text className="scope-axis" x="52" y="304" textAnchor="end">0 V</text>
                <text className="scope-axis" x={PLOT.left + PLOT.width} y="344" textAnchor="end">0.6 s</text>
                <path className="scope-curve" pathLength="1" d={CURVE} />
              </svg>
              <span className="scope-dot" aria-hidden="true" />
            </div>
            <p className="scope-caption">Canal 1 · V<sub>C</sub> · 0.9 V/div · 0.06 s/div</p>
          </div>
        </div>
        <ol className="scope-readouts">
          {READOUTS.map((readout) => (
            <li key={readout.label} className="scope-readout" style={{ "--s": readout.at } as CSSProperties}>
              <span>{readout.label}</span>
              <strong>{readout.value}</strong>
              <small>{readout.detail}</small>
            </li>
          ))}
        </ol>
      </div>
    </ScrollStage>
  );
}
