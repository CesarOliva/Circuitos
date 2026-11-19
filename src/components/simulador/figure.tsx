import { Plate } from "@/components/iso/react/draw";
import { Art, HEIGHT, WIDTH, board, padAndTrace, silkscreen, terminalBlock, traces } from "./stage";
import { PIECES } from "./pieces";
import { formatProperty, type Entry } from "./catalog";
import { Specimen } from "./specimen";

const TYPES: Record<string, string> = {
  positive: "positivo",
  negative: "negativo",
  anode: "ánodo",
  cathode: "cátodo",
  bidirectional: "bidireccional",
  base: "base",
  collector: "colector",
  emitter: "emisor",
  wiper: "cursor",
  input: "entrada",
  output: "salida",
};

export function ComponentFigure({ entry, index }: { entry: Entry; index: number }) {
  const { component, className, title, folder } = entry;
  const piece = PIECES[component.type];
  if (!piece) throw new Error(`No figure for component type "${component.type}"`);
  const ids = component.terminals.map((terminal) => terminal.id);
  if (piece.pads.length !== ids.length) throw new Error(`${className}: ${piece.pads.length} pads for ${ids.length} terminals`);

  const art = new Art();
  const term = (slot: number, build: (art: Art) => void) => art.group({ "data-terminal": ids[slot] }, build);
  board(art);
  silkscreen(art, piece.footprint, component.id);
  traces(piece.pads, ids.length).forEach((route, slot) => term(slot, (art) => padAndTrace(art, piece.pads[slot], route)));
  piece.draw(art, term, component);
  terminalBlock(art, ids, term);

  const properties = Object.entries(component.getProperties());
  const idle = `${ids.length} terminales`;
  const terminals = component.terminals.map((terminal) => ({
    id: terminal.id,
    text: `${terminal.id} · ${terminal.name} · ${TYPES[terminal.type] ?? terminal.type}`,
  }));

  return (
    <Plate
      fig={`${String(index + 1).padStart(2, "0")} · ${folder}`}
      title={title}
      hint="Pasa sobre un terminal"
      readout={idle}
      caption={
        <>
          <span className="sim-class">
            <code>{className}</code> · {component.name} · <code>{component.id}</code> · <code>type: {component.type}</code>
          </span>
          <dl className="sim-properties">
            {properties.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{formatProperty(key, value)}</dd>
              </div>
            ))}
          </dl>
        </>
      }
    >
      <Specimen key="stage" label={`${title}: placa con sus ${ids.length} terminales`} idle={idle} terminals={terminals}>
        <svg className="iso-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${title} (${className}) montado en una placa con bornes ${ids.join(", ")}`} focusable="false">
          {art.nodes}
        </svg>
      </Specimen>
    </Plate>
  );
}
