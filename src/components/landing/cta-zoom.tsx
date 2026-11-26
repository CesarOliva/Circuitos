import Link from "next/link";
import { ScrollStage } from "./scroll-stage";

// Placa de la escena: un microchip de 8 pines por lado en el centro (viewBox 1000 × 600) y una pista por pin,
// abiertas en abanico a 45° hasta una vía. Todo se calcula con aritmética simple, así que servidor y cliente coinciden.
const COUNT = 8;
const FAN = 34;
const PIN_STEP = 116 / (COUNT - 1);
const TOP_STEP = 180 / (COUNT - 1);

interface Trace {
  d: string;
  via: [number, number];
  seconds: number;
  delay: number;
  reverse: boolean;
}

const TRACES: Trace[] = Array.from({ length: COUNT }, (_, i) => {
  const y = 242 + i * PIN_STEP;
  const x = 410 + i * TOP_STEP;
  const spread = (i - (COUNT - 1) / 2) * FAN;
  const reach = Math.abs(spread);
  const endX = 60 + (i % 4) * 40;
  const endY = 20 + (i % 4) * 10;
  const base = (index: number) => ({ seconds: 2.6 + ((i * 3 + index * 5) % 7) * 0.45, delay: -((i * 7 + index * 11) % 10) * 0.37, reverse: (i + index) % 2 === 1 });
  return [
    { d: `M372 ${y} H340 L${340 - reach} ${y + spread} H${endX}`, via: [endX, y + spread] as [number, number], ...base(0) },
    { d: `M628 ${y} H660 L${660 + reach} ${y + spread} H${1000 - endX}`, via: [1000 - endX, y + spread] as [number, number], ...base(1) },
    { d: `M${x} 212 V180 L${x + spread} ${180 - reach} V${endY}`, via: [x + spread, endY] as [number, number], ...base(2) },
    { d: `M${x} 388 V420 L${x + spread} ${420 + reach} V${600 - endY}`, via: [x + spread, 600 - endY] as [number, number], ...base(3) },
  ];
}).flat();

const PINS = Array.from({ length: COUNT }, (_, i) => ({ y: 242 + i * PIN_STEP, x: 410 + i * TOP_STEP }));

// Cierre de la portada: al bajar, la cámara se acerca al microchip mientras las señales llegan por las pistas;
// al final aparece la invitación a empezar. El chip está en el centro del lienzo para que el zoom lo apunte siempre.
export function CtaZoom() {
  return (
    <section aria-label="Empezar a armar">
      <ScrollStage className="cta-stage">
        <div className="cta-sticky">
          <div className="cta-grid" aria-hidden="true" />
          <div className="cta-world" aria-hidden="true">
            <svg className="cta-svg" viewBox="0 0 1000 600">
              {TRACES.map((trace) => (
                <g key={trace.d}>
                  <path className="cta-trace" d={trace.d} />
                  <circle className="cta-via" cx={trace.via[0]} cy={trace.via[1]} r="6" />
                  <path
                    className="cta-pulse"
                    pathLength="1"
                    d={trace.d}
                    style={{ animationDuration: `${trace.seconds}s`, animationDelay: `${trace.delay}s`, animationDirection: trace.reverse ? "reverse" : "normal" }}
                  />
                </g>
              ))}
              {PINS.map(({ x, y }) => (
                <g key={`${x}-${y}`} className="cta-pin">
                  <rect x="372" y={y - 3} width="18" height="6" rx="1" />
                  <rect x="610" y={y - 3} width="18" height="6" rx="1" />
                  <rect x={x - 3} y="212" width="6" height="18" rx="1" />
                  <rect x={x - 3} y="370" width="6" height="18" rx="1" />
                </g>
              ))}
              <rect className="cta-chip-ring" x="388" y="228" width="224" height="144" rx="16" />
              <rect className="cta-chip-body" x="390" y="230" width="220" height="140" rx="14" />
              <rect className="cta-chip-die" x="420" y="255" width="160" height="90" rx="8" />
              <path className="cta-wave" d="M440 300 q15 -32 30 0 t30 0 t30 0 t30 0" />
              <text className="cta-chip-label" x="500" y="337" textAnchor="middle">SIMULADOR</text>
              <circle className="cta-chip-dot" cx="402" cy="242" r="3" />
            </svg>
          </div>
          <div className="cta-flash" aria-hidden="true" />
          <div className="cta-title">
            <h2>Tu banco de trabajo te espera</h2>
            <p>Sigue bajando y acércate al circuito.</p>
          </div>
          <div className="cta-final-copy">
            <p className="cta-big">Empieza a armar</p>
            <p className="cta-sub">Sin instalar nada: el circuito se arma, se simula y se examina aquí mismo, en claro o en oscuro.</p>
            <Link className="cta-primary" href="/simulador">
              <span aria-hidden="true">▶</span> Empezar a armar
            </Link>
          </div>
        </div>
      </ScrollStage>
    </section>
  );
}
