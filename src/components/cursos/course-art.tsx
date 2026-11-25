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
  return <GenericArt label={label} />;
}
