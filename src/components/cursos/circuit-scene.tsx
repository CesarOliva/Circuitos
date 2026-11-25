import type { CSSProperties } from "react";
import type { LessonScene } from "@/content";

// Todas las escenas comparten lienzo (760 × 230) y estilos; cambia el esquema y la velocidad de la corriente.
const flow = (seconds: number): CSSProperties => ({ animationDuration: `${seconds}s` });

const ZIGZAG = "l9 -14 14 28 14 -28 14 28 14 -28 9 14";

function Battery({ x, label }: { x: number; label: string }) {
  return (
    <g className="scene-part">
      <path d={`M${x} 72 V152 M${x + 16} 86 V138`} />
      <text x={x + 8} y="56" textAnchor="middle">{label}</text>
    </g>
  );
}

function Resistor({ x, y = 112, label, labelY }: { x: number; y?: number; label: string; labelY: number }) {
  return (
    <g className="scene-part">
      <path d={`M${x} ${y} ${ZIGZAG}`} />
      <text x={x + 37} y={labelY} textAnchor="middle">{label}</text>
    </g>
  );
}

function Magnitudes() {
  const wire = "M116 112 H420 M494 112 H650 V190 H72 V112 H100";
  return (
    <svg viewBox="0 0 760 230" role="img" aria-labelledby="circuit-title circuit-description">
      <title id="circuit-title">Voltaje, corriente y resistencia</title>
      <desc id="circuit-description">Un circuito cerrado donde la fuente aporta el voltaje, la corriente recorre los cables y la resistencia se opone a su paso.</desc>
      <path className="scene-wire" d={wire} />
      <path className="scene-current" d={wire} />
      <Battery x={100} label="V · VOLTAJE" />
      <Resistor x={420} label="R · RESISTENCIA" labelY={74} />
      <g className="scene-part"><text x="360" y="176" textAnchor="middle">I · CORRIENTE</text></g>
      <circle className="scene-node" cx="72" cy="112" r="5" />
      <circle className="scene-node" cx="650" cy="112" r="5" />
      <text className="scene-note" x="72" y="218">VOLTAJE = PRESIÓN · CORRIENTE = CAUDAL · RESISTENCIA = TUBERÍA</text>
    </svg>
  );
}

function OhmLoop({ x, resistance, current, seconds }: { x: number; resistance: string; current: string; seconds: number }) {
  const wire = "M56 112 H120 M194 112 H290 V190 H0 V112 H40";
  return (
    <g transform={`translate(${x} 0)`}>
      <path className="scene-wire" d={wire} />
      <path className="scene-current" d={wire} style={flow(seconds)} />
      <Battery x={40} label="9 V" />
      <Resistor x={120} label={`R = ${resistance}`} labelY={74} />
      <g className="scene-part"><text x="145" y="176" textAnchor="middle">I = {current}</text></g>
      <circle className="scene-node" cx="0" cy="112" r="5" />
      <circle className="scene-node" cx="290" cy="112" r="5" />
    </g>
  );
}

function Ohm() {
  return (
    <svg viewBox="0 0 760 230" role="img" aria-labelledby="circuit-title circuit-description">
      <title id="circuit-title">La ley de Ohm</title>
      <desc id="circuit-description">Dos circuitos con la misma fuente de 9 voltios: con una resistencia de 1 kiloohmio circulan 9 miliamperios y con 2 kiloohmios, la mitad.</desc>
      <OhmLoop x={30} resistance="1 kΩ" current="9 mA" seconds={1.8} />
      <OhmLoop x={410} resistance="2 kΩ" current="4.5 mA" seconds={3.6} />
      <text className="scene-note" x="30" y="218">V = I · R · EL DOBLE DE RESISTENCIA, LA MITAD DE CORRIENTE</text>
    </svg>
  );
}

function Led() {
  return (
    <svg viewBox="0 0 760 230" role="img" aria-labelledby="circuit-title circuit-description">
      <title id="circuit-title">Un LED con su resistor en serie</title>
      <desc id="circuit-description">Una fuente, una resistencia y un LED unidos en un circuito cerrado.</desc>
      <path className="scene-wire" d="M112 112 H248 M370 112 H504 M610 112 H650 V190 H72 V112 H112" />
      <path className="scene-current" d="M112 112 H248 M370 112 H504 M610 112 H650 V190 H72 V112 H112" />
      <circle className="scene-led-glow" cx="548" cy="112" r="40" />
      <g className="scene-part">
        <path d="M112 72 V152 M128 86 V138" />
        <text x="120" y="56">FUENTE</text><text x="116" y="174">V</text>
      </g>
      <g className="scene-part">
        <path d="M248 112 l12 -16 20 32 20 -32 20 32 20 -32 18 16" />
        <text x="306" y="74">RESISTENCIA</text><text x="306" y="160">R</text>
      </g>
      <g className="scene-part scene-led">
        <path d="M504 87 V137 L548 112 Z M548 87 V137 M548 112 H610" />
        <path d="M536 79 l18 -18 M546 91 l18 -18" />
        <text x="550" y="158">LED</text>
      </g>
      <circle className="scene-node" cx="72" cy="112" r="5" />
      <circle className="scene-node" cx="650" cy="112" r="5" />
      <text className="scene-note" x="72" y="218">ESQUEMA ILUSTRATIVO · EL RESISTOR LIMITA LA CORRIENTE DEL LED</text>
    </svg>
  );
}

function SeriesParallel() {
  const series = "M46 112 H80 M154 112 H176 M250 112 H290 V190 H0 V112 H30";
  const parallel = "M46 112 H90 M90 112 V72 H150 M224 72 H270 V112 M90 112 V152 H150 M224 152 H270 V112 M270 112 H290 V190 H0 V112 H30";
  return (
    <svg viewBox="0 0 760 230" role="img" aria-labelledby="circuit-title circuit-description">
      <title id="circuit-title">Resistencias en serie y en paralelo</title>
      <desc id="circuit-description">A la izquierda dos resistencias en serie, por las que pasa la misma corriente. A la derecha dos resistencias en paralelo, donde la corriente se reparte entre dos ramas.</desc>
      <g transform="translate(30 0)">
        <path className="scene-wire" d={series} />
        <path className="scene-current" d={series} style={flow(2.4)} />
        <Battery x={30} label="9 V" />
        <Resistor x={80} label="R1" labelY={84} />
        <Resistor x={176} label="R2" labelY={84} />
        <circle className="scene-node" cx="0" cy="112" r="5" />
        <circle className="scene-node" cx="290" cy="112" r="5" />
        <text className="scene-note" x="0" y="218">SERIE · R = R1 + R2</text>
      </g>
      <g transform="translate(410 0)">
        <path className="scene-wire" d={parallel} />
        <path className="scene-current" d={parallel} style={flow(1.2)} />
        <Battery x={30} label="9 V" />
        <Resistor x={150} y={72} label="R1" labelY={50} />
        <Resistor x={150} y={152} label="R2" labelY={130} />
        <circle className="scene-node" cx="90" cy="112" r="5" />
        <circle className="scene-node" cx="270" cy="112" r="5" />
        <text className="scene-note" x="0" y="218">PARALELO · 1/R = 1/R1 + 1/R2</text>
      </g>
    </svg>
  );
}

function Capacitor() {
  const wire = "M88 112 H200 M274 112 H436 M460 112 H650 V190 H72 V112";
  return (
    <svg viewBox="0 0 760 230" role="img" aria-labelledby="circuit-title circuit-description">
      <title id="circuit-title">Carga de un capacitor</title>
      <desc id="circuit-description">Una fuente, un resistor y un capacitor en serie. El capacitor se llena poco a poco y la corriente va disminuyendo hasta casi detenerse.</desc>
      <path className="scene-wire" d={wire} />
      <path className="scene-current scene-current-fade" d={wire} />
      <rect className="scene-charge" x="438" y="82" width="20" height="60" />
      <Battery x={72} label="9 V" />
      <Resistor x={200} label="R = 1 kΩ" labelY={74} />
      <g className="scene-part">
        <path d="M436 82 V142 M460 82 V142" />
        <text x="448" y="66" textAnchor="middle">C = 100 µF</text>
        <text x="448" y="164" textAnchor="middle">V(t)</text>
      </g>
      <circle className="scene-node" cx="650" cy="112" r="5" />
      <text className="scene-note" x="72" y="218">τ = R · C = 0.1 s · TRAS 5τ EL CAPACITOR YA ESTÁ CARGADO</text>
    </svg>
  );
}

const SCENES: Record<LessonScene, { Drawing: () => React.JSX.Element; caption: string }> = {
  magnitudes: { Drawing: Magnitudes, caption: "Las tres magnitudes en un solo circuito: la fuente empuja, la corriente fluye y la resistencia se opone." },
  ohm: { Drawing: Ohm, caption: "Con el mismo voltaje, duplicar la resistencia reduce la corriente a la mitad." },
  led: { Drawing: Led, caption: "Del diagrama al concepto: sigue el recorrido de la corriente." },
  "series-parallel": { Drawing: SeriesParallel, caption: "En serie pasa la misma corriente por todas; en paralelo se reparte entre las ramas." },
  capacitor: { Drawing: Capacitor, caption: "El capacitor se llena poco a poco mientras la corriente disminuye." },
};

export function CircuitScene({ scene = "led" }: { scene?: LessonScene }) {
  const { Drawing, caption } = SCENES[scene];
  return (
    <figure className="lesson-scene">
      <Drawing />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
