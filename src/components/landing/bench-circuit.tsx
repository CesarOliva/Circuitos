// Circuito de la demostración: fuente de 9 V, resistor de 1 kΩ y LED rojo de 2 V, así que I = (9 − 2) V / 1 kΩ = 7 mA.
// Lo usa «Cómo funciona» (se arma al bajar).

// Cables, en este orden: fuente → resistor, resistor → LED y LED → fuente.
const WIRES = [
  "M95 140 V120 H250",
  "M390 120 H440 V272 H490",
  "M125 140 V84 H560 V264 H510",
];

// Camino de la corriente convencional: del positivo, por el resistor y el LED, de vuelta al negativo.
const FLOW = "M95 140 V120 H250 M390 120 H440 V272 H490 M510 264 H560 V84 H125 V140";

const PADS = [
  { n: 1, x: 95, y: 140, end: false },
  { n: 1, x: 250, y: 120, end: true },
  { n: 2, x: 390, y: 120, end: false },
  { n: 2, x: 490, y: 272, end: true },
  { n: 3, x: 125, y: 140, end: false },
  { n: 3, x: 510, y: 264, end: true },
];

const RAYS = [-150, -125, -100, -80, -55, -30].map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  return { x1: 500 + Math.cos(radians) * 30, y1: 205 + Math.sin(radians) * 30, x2: 500 + Math.cos(radians) * 46, y2: 205 + Math.sin(radians) * 46 };
});

function Cursor() {
  return (
    <g className="how-cursor">
      <path d="M0 0 V17 L4.5 13 L7.5 20 L10.5 18.6 L7.6 12 H13.5 Z" />
    </g>
  );
}

// Contenido del <svg> (coordenadas 640 × 380 con la protoboard en 20–620). idPrefix evita ids repetidos si hay dos escenas.
export function BenchCircuit({ idPrefix, cursors = false }: { idPrefix: string; cursors?: boolean }) {
  return (
    <>
      <defs>
        <pattern id={`${idPrefix}-holes`} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="9" cy="9" r="2" fill="#2a3856" />
        </pattern>
        <radialGradient id={`${idPrefix}-glow`}>
          <stop offset="0" stopColor="#ff5a66" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#ff3d4d" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ff3d4d" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect className="how-board" x="20" y="40" width="600" height="310" rx="16" />
      <rect x="34" y="52" width="572" height="286" rx="10" fill={`url(#${idPrefix}-holes)`} />

      {/* Fuente de 9 V */}
      <g className="how-part how-part-1">
        <ellipse cx="110" cy="266" rx="46" ry="7" fill="#000" opacity="0.35" />
        <rect x="70" y="150" width="80" height="110" rx="8" fill="#1f3b7a" />
        <rect x="75" y="155" width="7" height="100" rx="3" fill="#fff" opacity="0.16" />
        <rect x="88" y="140" width="14" height="12" rx="3" fill="#c4c4c4" />
        <rect x="118" y="140" width="14" height="12" rx="3" fill="#c4c4c4" />
        <text x="110" y="214" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700" fontFamily="Arial, sans-serif">9 V</text>
        <text x="95" y="176" textAnchor="middle" fill="#fff" fontSize="13">+</text>
        <text x="125" y="176" textAnchor="middle" fill="#fff" fontSize="13">−</text>
        {cursors && <g transform="translate(112 226)"><Cursor /></g>}
      </g>

      {/* Resistor de 1 kΩ */}
      <g className="how-part how-part-2">
        <ellipse cx="320" cy="142" rx="44" ry="5" fill="#000" opacity="0.3" />
        <path d="M250 120 H290 M350 120 H390" stroke="#c4c4c4" strokeWidth="4" strokeLinecap="round" />
        <rect x="290" y="106" width="60" height="28" rx="14" fill="#e7c895" stroke="#b8985e" />
        <rect x="296" y="109" width="48" height="4" rx="2" fill="#fff" opacity="0.5" />
        <rect x="302" y="106" width="6" height="28" fill="#6b3a1e" />
        <rect x="314" y="106" width="6" height="28" fill="#111" />
        <rect x="326" y="106" width="6" height="28" fill="#c0392b" />
        <rect x="338" y="106" width="6" height="28" fill="#d4a72c" />
        <text x="320" y="160" textAnchor="middle" className="how-label">1 kΩ</text>
        {cursors && <g transform="translate(330 124)"><Cursor /></g>}
      </g>

      {/* LED rojo */}
      <g className="how-part how-part-3">
        <ellipse cx="500" cy="282" rx="26" ry="5" fill="#000" opacity="0.3" />
        <path d="M490 244 V272 M510 244 V264" stroke="#c4c4c4" strokeWidth="3" strokeLinecap="round" />
        <rect x="480" y="240" width="40" height="8" rx="2" fill="#3a1218" />
        <path d="M484 244 V196 a16 16 0 0 1 32 0 V244 Z" fill="#5c1f26" stroke="#3a1218" />
        <path className="how-led-lit" d="M484 244 V196 a16 16 0 0 1 32 0 V244 Z" fill="#ff4d5a" />
        <ellipse cx="493" cy="200" rx="3" ry="9" fill="#fff" opacity="0.3" />
        <text x="500" y="302" textAnchor="middle" className="how-label">LED</text>
        {cursors && <g transform="translate(508 214)"><Cursor /></g>}
      </g>

      {/* Cables */}
      {WIRES.map((d, index) => (
        <path key={d} className={`how-wire how-wire-${index + 1}`} pathLength="1" d={d} />
      ))}
      {PADS.map((pad) => (
        <g key={`${pad.x}-${pad.y}`} className={`how-pad how-pad-${pad.n}${pad.end ? " how-pad-end" : ""}`}>
          <circle className="how-pad-base" cx={pad.x} cy={pad.y} r="5" />
          <circle className="how-pad-on" cx={pad.x} cy={pad.y} r="8" />
        </g>
      ))}

      {/* Corriente y luz */}
      <path className="how-flow" d={FLOW} />
      <g className="how-glow">
        <g className="how-glow-pulse">
          <circle cx="500" cy="205" r="92" fill={`url(#${idPrefix}-glow)`} />
          {RAYS.map((ray) => (
            <line key={`${ray.x1}`} className="how-ray" x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
          ))}
        </g>
      </g>
    </>
  );
}

// Cursor suelto para el botón Simular de «Cómo funciona».
export { Cursor };
