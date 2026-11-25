export function CircuitScene() {
  return (
    <figure className="lesson-scene">
      <svg viewBox="0 0 760 230" role="img" aria-labelledby="circuit-title circuit-description">
        <title id="circuit-title">Recorrido de un circuito eléctrico</title>
        <desc id="circuit-description">Una fuente, una resistencia y un LED unidos en un circuito cerrado.</desc>
        <path className="scene-wire" d="M112 112 H248 M370 112 H504 M610 112 H650 V190 H72 V112 H112" />
        <path className="scene-current" d="M112 112 H248 M370 112 H504 M610 112 H650 V190 H72 V112 H112" />
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
        <text className="scene-note" x="72" y="218">ESQUEMA ILUSTRATIVO · CIRCUITO EN SERIE</text>
      </svg>
      <figcaption>Del diagrama al concepto: sigue el recorrido de la corriente.</figcaption>
    </figure>
  );
}
