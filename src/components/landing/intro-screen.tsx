import type { CSSProperties } from "react";

// Ocho pistas de circuito impreso que entran desde los bordes y terminan en los lados del logo.
// via: la perforación en el primer quiebre; d: retraso de cada pista, en segundos.
const TRACES = [
  { d: "M-20 70H110L140 100H170", via: [110, 70], delay: 0 },
  { d: "M-20 170H120L140 140H170", via: [120, 170], delay: 0.08 },
  { d: "M420 60H300L260 100H230", via: [300, 60], delay: 0.04 },
  { d: "M420 180H290L250 140H230", via: [290, 180], delay: 0.12 },
  { d: "M150 -20V40L190 80V90", via: [150, 40], delay: 0.06 },
  { d: "M260 -20V30L210 80V90", via: [260, 30], delay: 0.14 },
  { d: "M140 260V200L190 160V150", via: [140, 200], delay: 0.1 },
  { d: "M250 260V210L210 170V150", via: [250, 210], delay: 0.02 },
];
// Bienvenida a pantalla completa: las pistas convergen en el logo, un pulso de corriente lo enciende
// y aparece el nombre de la marca (ver landing.css).
export function IntroScreen() {
  return (
    <div className="intro-screen" aria-hidden="true">
      <div className="intro-scene">
        <svg className="intro-art" viewBox="0 0 400 240">
          <defs>
            <linearGradient id="intro-mark-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "var(--accent-bright)" }} />
              <stop offset="0.6" style={{ stopColor: "var(--accent)" }} />
              <stop offset="1" stopColor="#1259d6" />
            </linearGradient>
          </defs>

          {TRACES.map(({ d, via: [x, y], delay }) => (
            <g key={d} style={{ "--d": `${delay}s` } as CSSProperties}>
              <path className="intro-trace" pathLength="1" d={d} />
              <path className="intro-pulse" pathLength="1" d={d} />
              <circle className="intro-via" cx={x} cy={y} r="4" />
            </g>
          ))}

          <rect className="intro-mark-outline" x="170" y="90" width="60" height="60" rx="16" />
          <g className="intro-mark">
            <rect x="170" y="90" width="60" height="60" rx="16" fill="url(#intro-mark-fill)" />
            <text x="200" y="131">C</text>
          </g>
        </svg>
        <p className="intro-brand">Circuitos</p>      </div>
    </div>
  );
}
