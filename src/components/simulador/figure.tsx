import { Plate } from "@/components/iso/react/draw";
import { Art, HEIGHT, WIDTH, board, padAndTrace, silkscreen, terminalBlock, traces } from "./stage";
import { LAYOUT } from "./layout";
import { PIECES } from "./pieces";
import { specOf, type Entry } from "./catalog";
import { Caption, figureNumber } from "./caption";
import { Specimen } from "./specimen";

export function ComponentFigure({ entry, index }: { entry: Entry; index: number }) {
  const { component, className, title } = entry;
  const piece = PIECES[component.type];
  const layout = LAYOUT[component.type];
  if (!piece || !layout) throw new Error(`No figure for component type "${component.type}"`);
  const ids = component.terminals.map((terminal) => terminal.id);
  if (layout.pads.length !== ids.length) throw new Error(`${className}: ${layout.pads.length} pads for ${ids.length} terminals`);

  const art = new Art();
  const term = (slot: number, build: (art: Art) => void) => art.group({ "data-terminal": ids[slot] }, build);
  board(art);
  silkscreen(art, layout.footprint, component.id);
  traces(layout.pads, ids.length).forEach((route, slot) => term(slot, (art) => padAndTrace(art, layout.pads[slot], route)));
  piece.draw(art, term, component);
  terminalBlock(art, ids, term);

  const spec = specOf(entry);
  const idle = `${ids.length} terminales`;

  return (
    <Plate fig={figureNumber(index, spec)} title={title} hint="Pasa sobre un terminal" readout={idle} caption={<Caption spec={spec} />}>
      <Specimen key="stage" label={`${title}: placa con sus ${ids.length} terminales`} idle={idle} terminals={spec.terminals}>
        <svg className="iso-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${title} (${className}) montado en una placa con bornes ${ids.join(", ")}`} focusable="false">
          {art.nodes}
        </svg>
      </Specimen>
    </Plate>
  );
}
