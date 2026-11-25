import type { CourseArt as CourseArtKind } from "@/content";

// Dibujo del curso de circuitos: una protoboard con batería, resistor y LED.
const COLUMNS = Array.from({ length: 24 }, (_, index) => 28 + index * 12);
const ROWS = [30, 42, 54, 66, 78, 106, 118, 130, 142, 154];

function CircuitArt() {
  return (
    <svg className="course-art" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="16" y="16" width="288" height="168" rx="10" fill="#ebe8de" stroke="#c9c4b4" />
      <rect x="16" y="92" width="288" height="14" fill="#d6d2c4" />
      {ROWS.map((y) => COLUMNS.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#8a8778" />))}

      <ellipse cx="66" cy="164" rx="30" ry="6" fill="#000" opacity="0.25" />
      <rect x="40" y="70" width="50" height="90" rx="6" fill="#1f3b7a" />
      <rect x="44" y="74" width="6" height="82" fill="#fff" opacity="0.18" />
      <rect x="52" y="60" width="8" height="12" rx="2" fill="#bfbfbf" />
      <rect x="72" y="60" width="8" height="12" rx="2" fill="#bfbfbf" />
      <text x="65" y="122" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">9V</text>
      <text x="56" y="100" textAnchor="middle" fill="#fff" fontSize="11">+</text>

      <ellipse cx="192" cy="122" rx="40" ry="5" fill="#000" opacity="0.22" />
      <line x1="136" y1="103" x2="160" y2="103" stroke="#bdbdbd" strokeWidth="2.5" />
      <line x1="224" y1="103" x2="250" y2="103" stroke="#bdbdbd" strokeWidth="2.5" />
      <rect x="160" y="96" width="64" height="14" rx="7" fill="#e7c895" stroke="#b8985e" strokeWidth="0.8" />
      <rect x="164" y="98" width="56" height="3" rx="1.5" fill="#fff" opacity="0.5" />
      <rect x="172" y="96" width="5" height="14" fill="#6b3a1e" />
      <rect x="182" y="96" width="5" height="14" fill="#111" />
      <rect x="192" y="96" width="5" height="14" fill="#c0392b" />
      <rect x="212" y="96" width="5" height="14" fill="#d4a72c" />

      <ellipse cx="262" cy="180" rx="16" ry="4" fill="#000" opacity="0.2" />
      <circle cx="262" cy="136" r="26" fill="#e53935" opacity="0.18" />
      <rect x="256" y="112" width="12" height="46" rx="2" fill="#c9c9c9" />
      <rect x="264" y="112" width="3" height="30" fill="#b0b0b0" />
      <path d="M248 112 H276 V118 H248 Z" fill="#c62828" />
      <path d="M250 112 A 12 12 0 0 1 274 112 Z" fill="#e53935" />
      <circle cx="257" cy="106" r="4" fill="#ffd0cc" opacity="0.8" />

      <path d="M56 66 C 56 34 140 30 160 103" fill="none" stroke="#d62828" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M55 64 C 55 33 139 28 158 101" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.35" />
      <path d="M68 162 C 96 194 236 192 262 168" fill="none" stroke="#1d1d1d" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M68 160 C 96 190 236 188 260 165" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.2" />
    </svg>
  );
}

// Esquema del curso de análisis: una fuente, un resistor en serie y dos ramas en paralelo.
function AnalysisArt() {
  const wire = "M44 80 H66 M140 80 H168 M168 80 V52 H196 M270 52 H290 M168 80 V108 H196 M270 108 H290 M290 52 V150 H162 M150 150 H44 V80";
  return (
    <svg className="course-art" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="16" y="16" width="288" height="168" rx="10" fill="var(--surface-2)" stroke="var(--line-strong)" />
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 12 }, (_, col) => <circle key={`${row}-${col}`} cx={34 + col * 23} cy={32 + row * 28} r="1.2" fill="var(--line-strong)" />),
      )}
      <path d={wire} fill="none" stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d={wire} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 11" />
      <g fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M150 134 V166 M162 141 V159" />
        <path d="M66 80 l9 -12 14 24 14 -24 14 24 14 -24 9 12" />
        <path d="M196 52 l9 -12 14 24 14 -24 14 24 14 -24 9 12" />
        <path d="M196 108 l9 -12 14 24 14 -24 14 24 14 -24 9 12" />
      </g>
      <circle cx="168" cy="80" r="4.5" fill="var(--accent-bright)" />
      <circle cx="290" cy="80" r="4.5" fill="var(--accent-bright)" />
      <g fill="var(--muted)" fontFamily="monospace" fontSize="11">
        <text x="103" y="62" textAnchor="middle">R1</text>
        <text x="233" y="32" textAnchor="middle">R2</text>
        <text x="233" y="130" textAnchor="middle">R3</text>
        <text x="156" y="128" textAnchor="middle" fill="var(--accent-ink)">9 V</text>
      </g>
      <text x="160" y="177" textAnchor="middle" fill="var(--faint)" fontFamily="monospace" fontSize="10">ΣI = 0 · ΣV = 0</text>
    </svg>
  );
}

// Fondo común de los dibujos de curso.
function ArtFrame({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <svg className="course-art" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="16" y="16" width="288" height="168" rx="10" fill="var(--surface-2)" stroke="var(--line-strong)" />
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 12 }, (_, col) => <circle key={`${row}-${col}`} cx={34 + col * 23} cy={32 + row * 28} r="1.2" fill="var(--line-strong)" />),
      )}
      {children}
      <text x="160" y="177" textAnchor="middle" fill="var(--faint)" fontFamily="monospace" fontSize="10">{caption}</text>
    </svg>
  );
}

const ART_STROKE = { fill: "none", stroke: "var(--foreground)", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Current({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill="none" stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 11" />
    </>
  );
}

// Fuente, protoboard y pasivos: resistor, capacitor e inductor en serie.
function PassiveArt() {
  return (
    <ArtFrame caption="R · C · L">
      <Current d="M36 90 H56 M130 90 H156 M168 90 H196 M276 90 H292 V140 H36 V90" />
      <g {...ART_STROKE}>
        <path d="M56 90 l9 -12 14 24 14 -24 14 24 14 -24 9 12" />
        <path d="M156 68 V112 M168 68 V112" />
        <path d="M196 90 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0" />
      </g>
      <circle cx="36" cy="90" r="4.5" fill="var(--accent-bright)" />
    </ArtFrame>
  );
}

// Control y semiconductores: interruptor, diodo y LED.
function ControlArt() {
  return (
    <ArtFrame caption="SW · D · LED">
      <Current d="M36 100 H60 M110 100 H150 M190 100 H220 M264 100 H292 V146 H36 V100" />
      <g {...ART_STROKE}>
        <path d="M60 100 L104 76" />
        <path d="M150 82 V118 L176 100 Z M176 82 V118" />
        <path d="M220 75 V125 L264 100 Z M264 75 V125" />
      </g>
      <path d="M244 68 l16 -16 M254 80 l16 -16" stroke="var(--accent-bright)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="100" r="4.5" fill="var(--accent-bright)" />
      <circle cx="110" cy="100" r="4.5" fill="var(--accent-bright)" />
    </ArtFrame>
  );
}

// Sensores y actuadores: un sensor ultrasónico que mide la distancia a un objeto.
function SensorsArt() {
  return (
    <ArtFrame caption="d = v · t / 2">
      <rect x="36" y="64" width="64" height="56" rx="8" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="2.5" />
      <circle cx="54" cy="92" r="11" fill="none" stroke="var(--line-strong)" strokeWidth="2" />
      <circle cx="82" cy="92" r="11" fill="none" stroke="var(--line-strong)" strokeWidth="2" />
      <g fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M120 78 q10 14 0 28" />
        <path d="M136 70 q14 22 0 44" opacity="0.7" />
        <path d="M152 62 q18 30 0 60" opacity="0.45" />
      </g>
      <rect x="248" y="52" width="14" height="80" rx="3" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="2.5" />
      <path d="M36 146 H262 M36 140 V152 M262 140 V152" stroke="var(--faint)" strokeWidth="1.5" strokeLinecap="round" />
    </ArtFrame>
  );
}

// Microcontroladores: un chip con sus pines.
function DigitalArt() {
  const pins = Array.from({ length: 6 }, (_, index) => 112 + index * 20);
  return (
    <ArtFrame caption="D0–D13 · A0–A5">
      <rect x="100" y="52" width="120" height="82" rx="6" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="2.5" />
      {pins.map((x) => (
        <g key={x}>
          <path d={`M${x} 52 V40`} stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <path d={`M${x} 134 V146`} stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="116" cy="68" r="4" fill="var(--accent-bright)" />
      <text x="160" y="100" textAnchor="middle" fill="var(--foreground)" fontFamily="monospace" fontSize="14" fontWeight="700">MCU</text>
      <text x="160" y="118" textAnchor="middle" fill="var(--muted)" fontFamily="monospace" fontSize="9">UNO · ESP32</text>
    </ArtFrame>
  );
}

function GenericArt({ label }: { label: string }) {
  return (
    <svg className="course-art" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="16" y="16" width="288" height="168" rx="10" fill="var(--surface-2)" stroke="var(--line-strong)" />
      <circle cx="160" cy="88" r="38" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M160 62v52M134 88h52" stroke="var(--accent-bright)" strokeWidth="2" strokeLinecap="round" />
      <text x="160" y="158" textAnchor="middle" fill="var(--foreground)" fontSize="14" fontFamily="Arial, sans-serif">{label}</text>
    </svg>
  );
}

export function CourseArt({ kind = "generic", label = "Curso" }: { kind?: CourseArtKind; label?: string }) {
  if (kind === "circuit") return <CircuitArt />;
  if (kind === "analysis") return <AnalysisArt />;
  if (kind === "passive") return <PassiveArt />;
  if (kind === "control") return <ControlArt />;
  if (kind === "sensors") return <SensorsArt />;
  if (kind === "digital") return <DigitalArt />;
  return <GenericArt label={label} />;
}
