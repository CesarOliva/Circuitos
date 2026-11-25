"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PlaygroundKind } from "@/content";

// Simuladores de las lecciones: todos usan las cifras del curso (fuente de 9 V, LED rojo de 2 V).
const SUPPLY = 9;
const LED_DROP = 2;
const LED_MAX_MA = 20;

const trim = (value: number, digits = 2) => String(Number(value.toFixed(digits)));
const fmtOhms = (ohms: number) => (ohms >= 1000 ? `${trim(ohms / 1000)} kΩ` : `${trim(ohms, 0)} Ω`);
const fmtMa = (ma: number) => (ma >= 1000 ? `${trim(ma / 1000)} A` : `${trim(ma, ma < 10 ? 2 : 1)} mA`);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Velocidad de la corriente animada: 9 mA equivale a 1.8 s por vuelta.
const flowSeconds = (ma: number) => clamp(16.2 / ma, 0.3, 6);

function Shell({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
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

function Slider({
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

function Resistor({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g className="pg-part">
      <path d={`M${x} ${y} l9 -14 14 28 14 -28 14 28 14 -28 9 14`} />
      <text x={x + 37} y={y - 20} textAnchor="middle">{label}</text>
    </g>
  );
}

// ---------- Voltaje, corriente y resistencia: la tubería de agua ----------

function PipePlayground() {
  const [volts, setVolts] = useState(9);
  const [ohms, setOhms] = useState(1000);
  const ma = (volts / ohms) * 1000;
  const pipe = 56 - ((ohms - 100) / 1900) * 40;
  const seconds = flowSeconds(ma);

  return (
    <Shell title="La tubería de agua" hint="Sube la presión o aprieta la tubería y mira qué le pasa al caudal.">
      <svg className="pg-svg" viewBox="0 0 520 150" role="img" aria-label={`Tubería con presión de ${volts} voltios y resistencia de ${fmtOhms(ohms)}: circula una corriente de ${fmtMa(ma)}.`}>
        <rect className="pg-gauge" x="20" y="20" width="26" height="106" rx="4" />
        <rect className="pg-gauge-fill" x="22" y={124 - (volts / 12) * 102} width="22" height={(volts / 12) * 102} rx="3" />
        <text className="pg-label" x="33" y="144" textAnchor="middle">V</text>
        <rect className="pg-pipe" x="70" y={75 - pipe / 2} width="400" height={pipe} rx="6" />
        {Array.from({ length: 6 }, (_, index) => (
          <circle
            key={index}
            className="pg-drop"
            cx="80"
            cy="75"
            r="4"
            style={{ animationDuration: `${seconds}s`, animationDelay: `${(-index * seconds) / 6}s` } as CSSProperties}
          />
        ))}
        <text className="pg-label" x="270" y={75 - pipe / 2 - 10} textAnchor="middle">R</text>
        <text className="pg-label" x="492" y="79">I</text>
      </svg>
      <div className="pg-controls">
        <Slider label="Voltaje (presión)" display={`${volts} V`} value={volts} min={1} max={12} step={1} onChange={setVolts} />
        <Slider label="Resistencia (tubería angosta)" display={fmtOhms(ohms)} value={ohms} min={100} max={2000} step={100} onChange={setOhms} />
      </div>
      <p className="pg-readout">I = V / R = {volts} V / {fmtOhms(ohms)} = <strong>{fmtMa(ma)}</strong></p>
    </Shell>
  );
}

// ---------- Ley de Ohm: calculadora con reto ----------

const OHM_TARGET_MA = 6;

function OhmPlayground() {
  const [volts, setVolts] = useState(9);
  const [ohms, setOhms] = useState(1000);
  const ma = (volts / ohms) * 1000;
  const solved = Math.abs(ma - OHM_TARGET_MA) < 0.005;

  return (
    <Shell title="Calculadora de Ohm" hint={`Reto: combina el voltaje y la resistencia para que circulen exactamente ${OHM_TARGET_MA} mA.`}>
      <div className="pg-controls">
        <Slider label="Voltaje" display={`${volts} V`} value={volts} min={1} max={12} step={1} onChange={setVolts} />
        <Slider label="Resistencia" display={fmtOhms(ohms)} value={ohms} min={100} max={5000} step={100} onChange={setOhms} />
      </div>
      <p className="pg-readout">I = V / R = {volts} V / {fmtOhms(ohms)} = <strong>{fmtMa(ma)}</strong></p>
      <div className="pg-meter" aria-hidden="true">
        <span className="pg-meter-fill" style={{ width: `${clamp((ma / 30) * 100, 0, 100)}%` }} />
        <span className="pg-meter-target" style={{ left: `${(OHM_TARGET_MA / 30) * 100}%` }} />
      </div>
      <p className="pg-status" data-state={solved ? "ok" : undefined} role="status">
        {solved
          ? `¡Lo lograste! ${volts} V entre ${fmtOhms(ohms)} dan justo ${OHM_TARGET_MA} mA. Hay más combinaciones, ¿encuentras otra?`
          : ma > 30
            ? "La barra se salió de la escala: hay mucha corriente."
            : `Vas en ${fmtMa(ma)}. La marca es ${OHM_TARGET_MA} mA.`}
      </p>
    </Shell>
  );
}

// ---------- LED y resistor: no lo quemes ----------

function LedPlayground() {
  const [ohms, setOhms] = useState(1000);
  const [burnt, setBurnt] = useState(false);
  const ma = ((SUPPLY - LED_DROP) / ohms) * 1000;
  const glow = burnt ? 0 : clamp(ma / LED_MAX_MA, 0, 1);

  function changeResistor(value: number) {
    setOhms(value);
    if (((SUPPLY - LED_DROP) / value) * 1000 > LED_MAX_MA) setBurnt(true);
  }

  const status = burnt
    ? "¡Se quemó! Pasó demasiada corriente. Cambia el LED y prueba con más resistencia."
    : ma < 0.5
      ? "Casi no se ve: pasa muy poca corriente."
      : "Brilla bien y trabaja seguro.";

  return (
    <Shell title="Salva al LED" hint="Baja la resistencia y mira cuánta corriente aguanta un LED antes de quemarse. Luego encuentra el valor más bajo que sea seguro.">
      <svg className="pg-svg pg-svg-narrow" viewBox="0 0 320 120" role="img" aria-label={burnt ? "LED quemado" : `LED encendido con ${fmtMa(ma)}`}>
        <path className="pg-wire" d="M10 60 H30 M104 60 H120 M220 60 H310" />
        <Resistor x={30} y={60} label={fmtOhms(ohms)} />
        <circle className="pg-led-glow" cx="150" cy="60" r="46" style={{ opacity: 0.04 + glow * 0.6 }} />
        <g className="pg-part" data-burnt={burnt || undefined}>
          <path d="M120 32 V88 L170 60 Z M170 32 V88 M170 60 H220" />
          <path d="M156 24 l16 -16 M168 32 l16 -16" />
        </g>
        {burnt && <path className="pg-crack" d="M136 42 l30 36 M166 42 l-30 36" />}
      </svg>
      <div className="pg-controls">
        <Slider label="Resistor en serie" display={fmtOhms(ohms)} value={ohms} min={100} max={5000} step={50} onChange={changeResistor} />
      </div>
      <p className="pg-readout">I = (9 V − 2 V) / {fmtOhms(ohms)} = <strong>{fmtMa(ma)}</strong></p>
      <p className="pg-status" data-state={burnt ? "bad" : ma >= 0.5 ? "ok" : undefined} role="status">{status}</p>
      {burnt && (
        <div className="pg-actions">
          <button type="button" onClick={() => { setBurnt(false); setOhms(1000); }}>Cambiar el LED</button>
        </div>
      )}
    </Shell>
  );
}

// ---------- Serie y paralelo ----------

type Mode = "serie" | "paralelo";

function SeriesParallelPlayground() {
  const [mode, setMode] = useState<Mode>("serie");
  const [r1, setR1] = useState(1000);
  const [r2, setR2] = useState(1000);
  const series = mode === "serie";
  const total = series ? r1 + r2 : (r1 * r2) / (r1 + r2);
  const ma = (SUPPLY / total) * 1000;
  const seconds = flowSeconds(ma);
  const wire = series
    ? "M40 60 H80 M154 60 H190 M264 60 H330 V120 H30 V60"
    : "M40 60 H80 V30 H140 M214 30 H270 V60 M80 60 V90 H140 M214 90 H270 V60 M270 60 H330 V130 H30 V60";

  return (
    <Shell title="Serie contra paralelo" hint="Cambia la conexión y los valores. Fíjate en la resistencia equivalente y en la corriente total.">
      <div className="pg-actions" role="group" aria-label="Tipo de conexión">
        {(["serie", "paralelo"] as const).map((option) => (
          <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)}>
            {option === "serie" ? "En serie" : "En paralelo"}
          </button>
        ))}
      </div>
      <svg className="pg-svg pg-svg-narrow" viewBox="0 0 360 150" role="img" aria-label={`Dos resistencias conectadas en ${mode}: equivalen a ${fmtOhms(total)}.`}>
        <path className="pg-wire" d={wire} />
        <path className="pg-flow" d={wire} style={{ animationDuration: `${seconds}s` }} />
        <g className="pg-part"><path d="M30 40 V80 M40 46 V74" /><text x="35" y="30" textAnchor="middle">9 V</text></g>
        {series ? (
          <>
            <Resistor x={80} y={60} label="R1" />
            <Resistor x={190} y={60} label="R2" />
          </>
        ) : (
          <>
            <Resistor x={140} y={30} label="R1" />
            <Resistor x={140} y={90} label="R2" />
          </>
        )}
      </svg>
      <div className="pg-controls">
        <Slider label="R1" display={fmtOhms(r1)} value={r1} min={100} max={2000} step={100} onChange={setR1} />
        <Slider label="R2" display={fmtOhms(r2)} value={r2} min={100} max={2000} step={100} onChange={setR2} />
      </div>
      <p className="pg-readout">
        {series
          ? <>R = R1 + R2 = {fmtOhms(r1)} + {fmtOhms(r2)} = <strong>{fmtOhms(total)}</strong></>
          : <>1/R = 1/R1 + 1/R2 → R = <strong>{fmtOhms(total)}</strong></>}
        {" · "}corriente total <strong>{fmtMa(ma)}</strong>
      </p>
      {!series && (
        <p className="pg-status" data-state="ok">
          En paralelo la equivalente ({fmtOhms(total)}) siempre es menor que la más pequeña ({fmtOhms(Math.min(r1, r2))}).
        </p>
      )}
    </Shell>
  );
}

// ---------- Capacitor: carga y descarga en cámara lenta ----------

const AXIS_SECONDS = 1.5;
const SLOW_MOTION = 5;
const PLOT = { left: 40, right: 340, top: 15, bottom: 120 };

function CapacitorPlayground() {
  const [ohms, setOhms] = useState(1000);
  const [microfarads, setMicrofarads] = useState(100);
  const [mode, setMode] = useState<"carga" | "descarga">("carga");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);

  const tau = (ohms * microfarads) / 1e6;
  const simulated = Math.min(elapsed / SLOW_MOTION, AXIS_SECONDS);
  const voltageAt = (t: number) => (mode === "carga" ? SUPPLY * (1 - Math.exp(-t / tau)) : SUPPLY * Math.exp(-t / tau));
  const volts = voltageAt(simulated);
  const x = (t: number) => PLOT.left + (t / AXIS_SECONDS) * (PLOT.right - PLOT.left);
  const y = (v: number) => PLOT.bottom - (v / SUPPLY) * (PLOT.bottom - PLOT.top);
  const curve = Array.from({ length: 61 }, (_, k) => {
    const t = (AXIS_SECONDS * k) / 60;
    return `${k === 0 ? "M" : "L"}${x(t).toFixed(1)} ${y(voltageAt(t)).toFixed(1)}`;
  }).join(" ");

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const tick = () => {
      const seconds = (performance.now() - startedAt.current) / 1000;
      setElapsed(seconds);
      if (seconds / SLOW_MOTION >= AXIS_SECONDS) {
        setRunning(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  function start(next: "carga" | "descarga") {
    startedAt.current = performance.now();
    setMode(next);
    setElapsed(0);
    setRunning(true);
  }

  function change(setter: (value: number) => void, value: number) {
    setter(value);
    setRunning(false);
    setElapsed(0);
    setMode("carga");
  }

  return (
    <Shell title="Cargando un capacitor" hint={`Pulsa Cargar. Todo va en cámara lenta (×${SLOW_MOTION}). Prueba con más resistencia o más capacitancia y compara.`}>
      <div className="pg-actions">
        <button type="button" onClick={() => start("carga")}>Cargar</button>
        <button type="button" onClick={() => start("descarga")}>Descargar</button>
      </div>
      <svg className="pg-svg pg-svg-narrow" viewBox="0 0 360 150" role="img" aria-label={`Voltaje del capacitor: ${trim(volts, 1)} voltios de ${SUPPLY}.`}>
        <path className="pg-axis" d={`M${PLOT.left} ${PLOT.top} V${PLOT.bottom} H${PLOT.right}`} />
        <text className="pg-label" x={PLOT.left - 6} y={PLOT.top + 4} textAnchor="end">9 V</text>
        <text className="pg-label" x={PLOT.left - 6} y={PLOT.bottom + 4} textAnchor="end">0</text>
        <text className="pg-label" x={PLOT.right} y={PLOT.bottom + 18} textAnchor="end">{AXIS_SECONDS} s</text>
        {tau < AXIS_SECONDS && (
          <>
            <path className="pg-tau" d={`M${x(tau)} ${PLOT.top} V${PLOT.bottom}`} />
            <text className="pg-label" x={x(tau) + 4} y={PLOT.top + 10}>τ</text>
          </>
        )}
        <path className="pg-curve" d={curve} />
        <circle className="pg-dot" cx={x(simulated)} cy={y(volts)} r="5" />
      </svg>
      <div className="pg-controls">
        <Slider label="Resistencia" display={fmtOhms(ohms)} value={ohms} min={100} max={2000} step={100} onChange={(value) => change(setOhms, value)} />
        <Slider label="Capacitancia" display={`${microfarads} µF`} value={microfarads} min={10} max={220} step={10} onChange={(value) => change(setMicrofarads, value)} />
      </div>
      <div className="pg-meter" aria-hidden="true">
        <span className="pg-meter-fill" style={{ width: `${(volts / SUPPLY) * 100}%` }} />
      </div>
      <p className="pg-readout">
        τ = R · C = {fmtOhms(ohms)} × {microfarads} µF = <strong>{trim(tau * 1000, 1)} ms</strong>
        {" · "}V = <strong>{trim(volts, 1)} V</strong> ({Math.round((volts / SUPPLY) * 100)} %)
      </p>
    </Shell>
  );
}

export function Playground({ kind }: { kind: PlaygroundKind }) {
  switch (kind) {
    case "pipe":
      return <PipePlayground />;
    case "ohm":
      return <OhmPlayground />;
    case "led":
      return <LedPlayground />;
    case "series-parallel":
      return <SeriesParallelPlayground />;
    case "capacitor":
      return <CapacitorPlayground />;
  }
}
