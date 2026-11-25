import type { CSSProperties } from "react";

// Piezas que comparten todas las escenas (lienzo de 760 × 230): velocidad de la corriente, fuente y resistor.
export const flow = (seconds: number): CSSProperties => ({ animationDuration: `${seconds}s` });

export const ZIGZAG = "l9 -14 14 28 14 -28 14 28 14 -28 9 14";

export function Battery({ x, label }: { x: number; label: string }) {
  return (
    <g className="scene-part">
      <path d={`M${x} 72 V152 M${x + 16} 86 V138`} />
      <text x={x + 8} y="56" textAnchor="middle">{label}</text>
    </g>
  );
}

export function Resistor({ x, y = 112, label, labelY }: { x: number; y?: number; label: string; labelY: number }) {
  return (
    <g className="scene-part">
      <path d={`M${x} ${y} ${ZIGZAG}`} />
      <text x={x + 37} y={labelY} textAnchor="middle">{label}</text>
    </g>
  );
}

// Fuente con el positivo a la derecha (placa larga): la corriente de los cables sale por ahí.
export function Source({ x, label }: { x: number; label: string }) {
  return (
    <g className="scene-part">
      <path d={`M${x} 86 V138 M${x + 16} 72 V152`} />
      <text x={x + 8} y="56" textAnchor="middle">{label}</text>
    </g>
  );
}

// Símbolo del LED con sus rayos; el ánodo queda a la izquierda.
export function LedSymbol({ x, y = 112, label }: { x: number; y?: number; label?: string }) {
  return (
    <g className="scene-part scene-led">
      <path d={`M${x} ${y - 25} V${y + 25} L${x + 44} ${y} Z M${x + 44} ${y - 25} V${y + 25}`} />
      <path d={`M${x + 32} ${y - 33} l18 -18 M${x + 42} ${y - 21} l18 -18`} />
      {label && <text x={x + 24} y={y + 46} textAnchor="middle">{label}</text>}
    </g>
  );
}
