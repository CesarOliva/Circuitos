import type { CSSProperties } from "react";

// Cada pieza aparece en la "foto" y recibe su recuadro cuando la línea de escaneo pasa por ella (--d, en segundos).
const DETECTIONS = [
  { label: "Resistencia · 97 %", box: [28, 42, 104, 36], d: 0.8 },
  { label: "LED · 99 %", box: [206, 28, 48, 76], d: 0.74 },
  { label: "Capacitor · 95 %", box: [74, 110, 44, 72], d: 1.12 },
  { label: "Transistor · 93 %", box: [202, 120, 48, 64], d: 1.18 },
];

// Bienvenida a pantalla completa: el visor de la cámara escanea una foto con cuatro componentes sueltos,
// los identifica uno a uno y después aparece el nombre de la marca (ver landing.css).
export function IntroScreen() {
  return (
    <div className="intro-screen" aria-hidden="true">
      <div className="intro-scene">
        <svg className="intro-art" viewBox="0 0 320 200">
          <path className="intro-finder" d="M10 34V10h24M286 10h24v24M310 166v24h-24M34 190H10v-24" />

          <g className="intro-part" style={{ "--d": "0.15s" } as CSSProperties}>
            <path className="intro-lead" d="M34 60h22M104 60h22" />
            <rect className="intro-body" x="56" y="52" width="48" height="16" rx="6" />
            <rect x="66" y="52" width="4" height="16" fill="#d8433f" />
            <rect x="75" y="52" width="4" height="16" fill="#d8433f" />
            <rect x="84" y="52" width="4" height="16" fill="#8a5a2b" />
            <rect x="94" y="52" width="3" height="16" fill="#c9a227" />
          </g>

          <g className="intro-part" style={{ "--d": "0.25s" } as CSSProperties}>
            <path className="intro-lead" d="M224 74v26M236 74v22" />
            <path className="intro-body intro-led" d="M216 74V48a14 14 0 0 1 28 0v26z" />
            <rect className="intro-body" x="213" y="72" width="34" height="5" rx="2" />
          </g>

          <g className="intro-part" style={{ "--d": "0.35s" } as CSSProperties}>
            <path className="intro-lead" d="M90 156v22M102 156v18" />
            <rect className="intro-body" x="82" y="116" width="28" height="42" rx="5" />
            <rect x="100" y="116" width="6" height="42" className="intro-stripe" />
          </g>

          <g className="intro-part" style={{ "--d": "0.45s" } as CSSProperties}>
            <path className="intro-lead" d="M216 152v28M226 152v30M236 152v28" />
            <path className="intro-body" d="M210 152v-14a16 16 0 0 1 32 0v14z" />
          </g>

          <rect className="intro-scanline" x="14" y="14" width="292" height="2" />

          {DETECTIONS.map(({ label, box: [x, y, w, h], d }) => (
            <g key={label} className="intro-detect" style={{ "--d": `${d}s` } as CSSProperties}>
              <rect className="intro-box" x={x} y={y} width={w} height={h} rx="4" />
              <g className="intro-tag">
                <rect x={x} y={y - 15} width={label.length * 5.4 + 10} height="12" rx="3" />
                <text x={x + 5} y={y - 6}>{label}</text>
              </g>
            </g>
          ))}
        </svg>
        <p className="intro-count">4 componentes identificados</p>
        <p className="intro-brand">Circuitos</p>
      </div>
    </div>
  );
}
