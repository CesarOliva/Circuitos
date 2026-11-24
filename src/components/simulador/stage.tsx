import * as React from "react";
import * as k from "@/components/iso/iso-kit";
import { Dots, FaceText, Line, Solid } from "@/components/iso/react/draw";
import type { Flat, Plan, Plane, Point3, SolidPaths, LineTone, Tone } from "@/components/iso/iso-kit";
import { BLOCK_D, BLOCK_Y, BOARD, BOARD_T, PITCH, STANDOFF_H, STEP_Z, TOWER_D, TOWER_Z, cellX } from "./layout";

export { traces } from "./layout";

export const WIDTH = 420;
export const HEIGHT = 300;

export const P = k.fitProjection(
  [...k.boxCorners(BOARD, -BOARD_T - STANDOFF_H, 0), [0, -18, 44]],
  WIDTH,
  HEIGHT,
  { pad: 14, azimuth: 40 },
);

export const at = (point: Point3): Flat => k.iso(point, P);

// Collects keyed React elements in painter's order.
export class Art {
  readonly nodes: React.ReactNode[] = [];
  private count = 0;

  private key() {
    return `n${this.count++}`;
  }

  solid(paths: SolidPaths, style: { tone?: Tone; crease?: Tone | "none"; lit?: boolean; className?: string; inner?: React.ReactNode } = {}) {
    this.nodes.push(<Solid key={this.key()} paths={paths} {...style} />);
    return this;
  }

  line(d: string, style: { tone?: LineTone; free?: boolean | "start" | "end"; className?: string } = {}) {
    if (d) this.nodes.push(<Line key={this.key()} d={d} {...style} />);
    return this;
  }

  dots(points: Flat[], style: { size?: number; tone?: Tone } = {}) {
    this.nodes.push(<Dots key={this.key()} points={points} {...style} />);
    return this;
  }

  text(transform: string, text: string, style: { size?: number; tone?: Tone; anchor?: "start" | "middle" | "end" } = {}) {
    this.nodes.push(
      <FaceText key={this.key()} transform={transform} {...style}>
        {text}
      </FaceText>,
    );
    return this;
  }

  path(d: string, className: string, extra: Record<string, string> = {}) {
    this.nodes.push(<path key={this.key()} className={className} d={d} {...extra} />);
    return this;
  }

  group(attributes: Record<string, string | React.CSSProperties>, build: (art: Art) => void) {
    const inner = new Art();
    build(inner);
    this.nodes.push(
      <g key={this.key()} {...attributes}>
        {inner.nodes}
      </g>,
    );
    return this;
  }
}

// A wide transparent stroke over a thin line, so the pointer can find it.
export const hit = (art: Art, d: string) => art.path(d, "sim-hit");

// A line through 3D points: leads, bent pins, wires.
export const polyline = (points: Point3[]) => k.pathOf(points.map(at));

export function hexagon(cx: number, cy: number, r: number): Plane[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as Plane;
  });
}

// Screen hull of a box, as a hit area for a terminal cell.
function boxHull(plan: Plan, z0: number, z1: number) {
  const points = k.boxCorners(plan, z0, z1).map(at);
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Flat[] = [];
  const upper: Flat[] = [];
  for (const point of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  for (const point of [...points].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  return k.pathOf([...lower.slice(0, -1), ...upper.slice(0, -1)], true);
}

const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// The board: a PCB on four standoffs with screws, an edge groove and two fiducials.
export function board(art: Art) {
  art.path(k.haloOf(BOARD, -BOARD_T - STANDOFF_H, BOARD_T, P), "iso-halo");
  const posts = k.corners(BOARD, 7);
  for (const [x, y] of byDepth(posts)) {
    art.solid(k.cylinder(x, y, 3.4, -BOARD_T - STANDOFF_H, 1.4, P, 24), { tone: "lo" });
    art.solid(k.extrude(hexagon(x, y, 2.9), -BOARD_T - STANDOFF_H + 1.4, STANDOFF_H - 1.4, P), { tone: "mid" });
  }
  art.solid(k.slabOf(BOARD, -BOARD_T, BOARD_T, P, 6, 0.8), { tone: "mid" });
  art.line(k.planOutline(k.insetPlan(BOARD, 3.2), 0, P, 6), { tone: "faint" });
  for (const [x, y] of posts) {
    art.line(k.ring(x, y, 3.6, 0, P, 24), { tone: "lo" });
    art.solid(k.cylinder(x, y, 2.5, 0, 0.9, P, 20), { tone: "mid", crease: "lo" });
    art.line(k.lineOnTop([x - 2.5, y], [x + 2.5, y], 0.9, P), { tone: "lo" });
    art.line(k.lineOnTop([x, y - 2.5], [x, y + 2.5], 0.9, P), { tone: "lo" });
  }
  for (const [x, y] of [
    [BOARD.x + 16, BOARD.y + 7],
    [BOARD.x + BOARD.w - 7, BOARD.y + BOARD.d - 18],
  ] as Plane[]) {
    art.line(k.ring(x, y, 1.6, 0, P, 16), { tone: "lo" });
    art.dots([at([x, y, 0])], { size: 0.6, tone: "mid" });
  }
}

// Silkscreen: the part's outline and its reference designator, read from the instance id.
export function silkscreen(art: Art, footprint: Plan, id: string) {
  art.line(k.planOutline(footprint, 0, P, 3), { tone: "faint" });
  art.text(k.topMatrix([footprint.x + 1, footprint.y - 1.8], 0, P, "x"), id, { size: 3.2, tone: "lo" });
}

// A pad with its trace: copper ring, solder dot and the line to the block.
export function padAndTrace(art: Art, pad: Plane, route: Plane[]) {
  const d = k.onTop(route, 0, P);
  art.line(d, { tone: "mid" });
  hit(art, d);
  art.line(k.ring(pad[0], pad[1], 1.9, 0, P, 18), { tone: "mid" });
  art.dots([at([pad[0], pad[1], 0])], { size: 0.9, tone: "hi" });
}

// The screw terminal block: one cell per terminal of the component, its id engraved on the step.
export function terminalBlock(art: Art, ids: string[], cell: (index: number, build: (art: Art) => void) => void) {
  const count = ids.length;
  const plan: Plan = { x: -(count * PITCH) / 2, y: BLOCK_Y, w: count * PITCH, d: BLOCK_D, r: 1 };
  const tower: Plan = { ...plan, d: TOWER_D };
  art.path(k.haloOf(plan, 0, 1, P), "iso-halo");
  art.solid(k.slabOf(plan, 0, STEP_Z, P, 3, 0.5), { tone: "mid" });
  art.solid(k.slabOf(tower, STEP_Z, TOWER_Z - STEP_Z, P, 3, 0.5), { tone: "mid" });
  const front = BLOCK_Y + BLOCK_D;
  for (let index = 1; index < count; index++) {
    const x = plan.x + index * PITCH;
    art.line(
      k.pathOf([at([x, BLOCK_Y, TOWER_Z]), at([x, BLOCK_Y + TOWER_D, TOWER_Z]), at([x, BLOCK_Y + TOWER_D, STEP_Z]), at([x, front, STEP_Z]), at([x, front, 0])]),
      { tone: "lo" },
    );
  }
  ids.forEach((id, index) => {
    const cx = cellX(index, count);
    cell(index, (art) => {
      art.path(boxHull({ x: cx - PITCH / 2, y: BLOCK_Y, w: PITCH, d: BLOCK_D, r: 0 }, 0, TOWER_Z), "sim-hit-area");
      const sy = BLOCK_Y + TOWER_D / 2;
      art.line(k.ring(cx, sy, 3.6, TOWER_Z, P, 24), { tone: "lo" });
      art.solid(k.cylinder(cx, sy, 2.7, TOWER_Z, 0.7, P, 24), { tone: "hi", crease: "lo" });
      const slot = Math.PI / 4;
      art.line(k.lineOnTop([cx - 2.7 * Math.cos(slot), sy - 2.7 * Math.sin(slot)], [cx + 2.7 * Math.cos(slot), sy + 2.7 * Math.sin(slot)], TOWER_Z + 0.7, P), { tone: "mid" });
      const hole = [at([cx - 3.4, front, 1.4]), at([cx + 3.4, front, 1.4]), at([cx + 3.4, front, 5.4]), at([cx - 3.4, front, 5.4])];
      art.path(k.pathOf(hole, true), "sim-hole");
      art.line(k.pathOf(hole, true), { tone: "mid" });
      art.text(k.topMatrix([cx, BLOCK_Y + TOWER_D + 4.6], STEP_Z, P, "x"), id, { size: id.length > 2 ? 3.2 : 4.6, tone: "hi", anchor: "middle" });
    });
  });
}
