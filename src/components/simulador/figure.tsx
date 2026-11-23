import { Plate } from "@/components/iso/react/draw";
import { Art, HEIGHT, WIDTH, board, padAndTrace, polyline, silkscreen, terminalBlock, traces } from "./stage";
import { LAYOUT, type Plane } from "./layout";
import { PIECES } from "./pieces";
import { specOf, type Entry } from "./catalog";
import { Caption, figureNumber } from "./caption";
import { TOP, crackOn, waveOn, type Cues, type Fault, type Point } from "./faults";
import { Specimen } from "./specimen";

// What a fault adds over the healthy part: a cross on each open pad, a copper bridge, a crack or a waveform on the top.
function marks(art: Art, pads: Plane[], cues: Cues, top: Point) {
  for (const slot of cues.open ?? []) {
    const [x, y] = pads[slot];
    const cross = polyline([[x - 1.4, y - 1.4, 1], [x + 1.4, y + 1.4, 1]]) + polyline([[x - 1.4, y + 1.4, 1], [x + 1.4, y - 1.4, 1]]);
    art.line(cross, { tone: "red", className: "sim-mark" });
  }
  if (cues.bridge) {
    const [a, b] = cues.bridge.map((slot) => pads[slot]);
    const up = top[2] + 2;
    art.line(polyline([[a[0], a[1], 0.6], [a[0], a[1], up], [b[0], b[1], up], [b[0], b[1], 0.6]]), { tone: "red", className: "sim-mark" });
  }
  if (cues.cracked) art.line(polyline(crackOn(top)), { tone: "red", className: "sim-mark" });
  if (cues.wave) art.line(polyline(waveOn(top)), { tone: "red", className: "sim-mark" });
}

export function ComponentFigure({ entry, index, fault }: { entry: Entry; index: number; fault?: Fault }) {
  const { component, className, title } = entry;
  const piece = PIECES[component.type];
  const layout = LAYOUT[component.type];
  if (!piece || !layout) throw new Error(`No figure for component type "${component.type}"`);
  const ids = component.terminals.map((terminal) => terminal.id);
  if (layout.pads.length !== ids.length) throw new Error(`${className}: ${layout.pads.length} pads for ${ids.length} terminals`);

  const cues = fault?.cues ?? {};
  const open = new Set(cues.open);

  const art = new Art();
  const term = (slot: number, build: (art: Art) => void) => art.group({ "data-terminal": ids[slot] }, build);
  board(art);
  silkscreen(art, layout.footprint, component.id);
  traces(layout.pads, ids.length).forEach((route, slot) => term(slot, (art) => padAndTrace(art, layout.pads[slot], route)));
  // The part itself: burnt parts go black, and an open terminal draws no lead.
  art.group(cues.burnt ? { className: "sim-charred" } : {}, (part) => {
    const cell = (slot: number, build: (art: Art) => void) =>
      part.group({ "data-terminal": ids[slot] }, (inner) => {
        if (!open.has(slot)) build(inner);
      });
    piece.draw(part, cell, component);
    marks(part, layout.pads, cues, TOP[component.type]);
  });
  terminalBlock(art, ids, term);

  const spec = specOf(entry);
  const idle = `${ids.length} terminales`;
  const plate = fault ? `${title} · ${fault.label}` : title;

  return (
    <Plate fig={figureNumber(index, spec)} title={plate} hint="Pasa sobre un terminal" readout={idle} caption={<Caption spec={spec} fault={fault} />}>
      <Specimen key="stage" label={`${plate}: placa con sus ${ids.length} terminales`} idle={idle} terminals={spec.terminals}>
        <svg className="iso-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${plate} (${className}) montado en una placa con bornes ${ids.join(", ")}`} focusable="false">
          {art.nodes}
        </svg>
      </Specimen>
    </Plate>
  );
}
