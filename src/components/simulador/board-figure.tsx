import { Plate } from "@/components/iso/react/draw";
import * as k from "@/components/iso/iso-kit";
import { Art, HEIGHT, P, WIDTH, at, board as mountingBoard, silkscreen } from "./stage";
import { BoardDesign, HEADER_H, PCB_T, PIN_TOP, specOfBoard } from "./boards";
import { Caption, figureNumber } from "./caption";
import { Specimen } from "./specimen";

// A microcontroller board on the mounting board: its PCB, header blocks, chips and pins, each pin a terminal.
export function BoardFigure({ design, index }: { design: BoardDesign; index: number }) {
  const spec = specOfBoard(design);
  const idle = `${spec.terminals.length} terminales`;

  const art = new Art();
  mountingBoard(art);
  silkscreen(art, design.pcb, spec.id);
  art.solid(k.slabOf(design.pcb, 0, PCB_T, P, 4, 0.4), { tone: "mid" });
  for (const header of design.headers) art.solid(k.slabOf(header, PCB_T, HEADER_H, P, 2, 0.2), { tone: "lo" });
  for (const part of design.parts) {
    if (part.kind === "round") {
      const { plan } = part;
      art.solid(k.cylinder(plan.x + plan.w / 2, plan.y + plan.d / 2, plan.w / 2, PCB_T, part.h, P, 24), { tone: "hi" });
    } else {
      art.solid(k.slabOf(part.plan, PCB_T, part.h, P, 3, 0.4), { tone: part.tone === "shield" ? "hi" : "mid" });
    }
  }
  for (const pin of design.pins) {
    const draw = (inner: Art) => {
      inner.solid(k.cylinder(pin.x, pin.y, 0.32, PCB_T + HEADER_H, PIN_TOP - PCB_T - HEADER_H, P, 8), { tone: "hi", crease: "none" });
      inner.dots([at([pin.x, pin.y, PIN_TOP])], { size: 0.5, tone: "hi" });
      inner.text(k.topMatrix([pin.x + pin.dx, pin.y + pin.dy], PCB_T, P, "x"), pin.name, { size: 1.9, tone: "mid", anchor: "middle" });
    };
    if (pin.id) art.group({ "data-terminal": pin.id }, draw);
    else draw(art);
  }

  return (
    <Plate fig={figureNumber(index, spec)} title={design.title} hint="Pasa sobre un pin" readout={idle} caption={<Caption spec={spec} />}>
      <Specimen key="stage" label={`${design.title}: placa con sus ${spec.terminals.length} pines`} idle={idle} terminals={spec.terminals}>
        <svg className="iso-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${design.title} sobre la placa de montaje`} focusable="false">
          {art.nodes}
        </svg>
      </Specimen>
    </Plate>
  );
}
