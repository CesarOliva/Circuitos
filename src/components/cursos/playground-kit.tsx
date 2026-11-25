"use client";

import { useId, type ReactNode } from "react";

// Piezas compartidas por los simuladores de las lecciones. Cifras del curso: fuente de 9 V, LED rojo de 2 V.
export const SUPPLY = 9;
export const LED_DROP = 2;
export const LED_MAX_MA = 20;
export const RESISTOR_RATED_W = 0.25;

export const trim = (value: number, digits = 2) => String(Number(value.toFixed(digits)));
export const fmtOhms = (ohms: number) => (ohms >= 1000 ? `${trim(ohms / 1000)} kΩ` : `${trim(ohms, 0)} Ω`);
export const fmtMa = (ma: number) => (ma >= 1000 ? `${trim(ma / 1000)} A` : `${trim(ma, ma < 10 ? 2 : 1)} mA`);
export const fmtVolts = (volts: number) => `${trim(volts)} V`;
export const fmtWatts = (watts: number) => (watts >= 1 ? `${trim(watts)} W` : `${trim(watts * 1000, watts * 1000 < 10 ? 1 : 0)} mW`);
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Velocidad de la corriente animada: 9 mA equivale a 1.8 s por vuelta.
export const flowSeconds = (ma: number) => clamp(16.2 / ma, 0.3, 6);

export function Shell({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="playground" aria-label={title}>
      <header>
        <p className="quiz-kicker">Pruébalo tú</p>
        <h3>{title}</h3>
        <p className="pg-hint">{hint}</p>
      </header>
      {children}
    </section>
  );
}

export function Slider({
  label,
  display,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="pg-slider">
      <label htmlFor={id}>
        <span>{label}</span>
        <output>{display}</output>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}

export function Resistor({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g className="pg-part">
      <path d={`M${x} ${y} l9 -14 14 28 14 -28 14 28 14 -28 9 14`} />
      <text x={x + 37} y={y - 20} textAnchor="middle">{label}</text>
    </g>
  );
}

// Barra partida en tramos proporcionales: sirve para repartir voltajes o corrientes.
export function Split({ parts, label }: { parts: Array<{ label: string; value: number }>; label: string }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  return (
    <div className="pg-split" role="img" aria-label={label}>
      {parts.map((part, index) => (
        <span key={index} data-part={index} style={{ flexGrow: Math.max(part.value, total * 0.04) }}>
          {part.label}
        </span>
      ))}
    </div>
  );
}
