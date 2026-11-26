import { BOARD, footprintLandmarks, LAYOUT, type Plane } from "./layout";
import { specOf, type Entry } from "./catalog";

const WIDTH = 360;
const HEIGHT = 320;
const PADDING = 32;
const SCALE = Math.min((WIDTH - PADDING * 2) / BOARD.w, (HEIGHT - PADDING * 2) / BOARD.d);
const BOARD_WIDTH = BOARD.w * SCALE;
const BOARD_HEIGHT = BOARD.d * SCALE;
const LEFT = (WIDTH - BOARD_WIDTH) / 2;
const TOP = (HEIGHT - BOARD_HEIGHT) / 2;

function project([x, y]: Plane) {
  return [LEFT + (x - BOARD.x) * SCALE, TOP + (y - BOARD.y) * SCALE] as const;
}

function formatCoordinate(value: number) {
  const rounded = Number(value.toFixed(2));
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(2);
}

function coordinateText([x, y]: Plane) {
  return `(${formatCoordinate(x)}, ${formatCoordinate(y)})`;
}

export function CoordinateMap({ entry }: { entry: Entry }) {
  const spec = specOf(entry);
  const layout = LAYOUT[spec.type];
  if (!layout) throw new Error(`No coordinate map for component type "${spec.type}"`);
  if (layout.pads.length !== spec.terminals.length) {
    throw new Error(`${spec.className}: ${layout.pads.length} pads for ${spec.terminals.length} terminals`);
  }

  const landmarks = footprintLandmarks(layout.footprint);
  const [originX, originY] = project([0, 0]);
  const component = layout.footprint;
  const [componentX, componentY] = project([component.x, component.y]);

  return (
    <article className="sim-coordinate-card">
      <header className="sim-coordinate-heading">
        <h2>{spec.title}</h2>
        <span>{spec.id}</span>
      </header>
      <div className="sim-coordinate-content">
        <svg
          className="sim-coordinate-svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${spec.title}: mapa superior del protoboard con sus cuatro esquinas, centro y terminales`}
        >
          <rect className="sim-coordinate-board" x={LEFT} y={TOP} width={BOARD_WIDTH} height={BOARD_HEIGHT} rx={BOARD.r * SCALE} />
          <line className="sim-coordinate-axis" x1={originX} y1={TOP} x2={originX} y2={TOP + BOARD_HEIGHT} />
          <line className="sim-coordinate-axis" x1={LEFT} y1={originY} x2={LEFT + BOARD_WIDTH} y2={originY} />
          <circle className="sim-coordinate-origin" cx={originX} cy={originY} r="2.5" />
          <text className="sim-coordinate-origin-label" x={originX + 5} y={originY - 5}>O (0, 0)</text>
          <rect
            className="sim-coordinate-footprint"
            x={componentX}
            y={componentY}
            width={component.w * SCALE}
            height={component.d * SCALE}
            rx={component.r * SCALE}
          />
          {landmarks.map(({ id, point }) => {
            const [x, y] = project(point);
            return (
              <g className={id === "Centro" ? "sim-coordinate-center" : "sim-coordinate-landmark"} key={id}>
                <circle cx={x} cy={y} r={id === "Centro" ? 4 : 3} />
                <text x={x + 5} y={y - 5}>{id === "Centro" ? "C" : id}</text>
              </g>
            );
          })}
          {spec.terminals.map((terminal, index) => {
            const point = layout.pads[index];
            const [x, y] = project(point);
            return (
              <g className="sim-coordinate-terminal" key={terminal.id}>
                <circle cx={x} cy={y} r="3.5" />
                <text x={x + 5} y={y + 11}>{terminal.id}</text>
              </g>
            );
          })}
        </svg>
        <dl className="sim-coordinate-list">
          <dt className="sim-coordinate-section">Puntos del componente</dt>
          {landmarks.map(({ id, name, point }) => (
            <div className="sim-coordinate-row" key={id}>
              <dt>{id} · {name}</dt>
              <dd>{coordinateText(point)}</dd>
            </div>
          ))}
          <dt className="sim-coordinate-section">Terminales</dt>
          {spec.terminals.map((terminal, index) => (
            <div className="sim-coordinate-row" key={terminal.id}>
              <dt>{terminal.id}</dt>
              <dd>{coordinateText(layout.pads[index])}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
