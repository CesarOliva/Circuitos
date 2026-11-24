import type { ReactNode } from "react";
import type { ElectronicComponent } from "@simulacion/index.ts";
import * as k from "@/components/iso/iso-kit";
import * as G from "@/components/iso/lathe.mjs";
import type { Flat, Plan, Plane, Point3, SolidPaths } from "@/components/iso/iso-kit";
import { CY, colourCode } from "./layout";
import { Art, P, at, hexagon, polyline } from "./stage";

export type Term = (index: number, build: (art: Art) => void) => void;

// The isometric drawing of one component; its pads and footprint are in layout.ts.
export interface Piece {
  draw(art: Art, term: Term, component: ElectronicComponent): void;
}

type Frame = ReturnType<typeof G.frameOf>;
const along = (o: Point3): Frame => G.frameOf(o, [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const upright = (o: Point3): Frame => G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const turned = (paths: unknown) => paths as SolidPaths;
const fillet = (points: Point3[], radius: number) => G.fillet(points, radius) as Point3[];
const dotsOn = (...args: Parameters<typeof G.dotsOf>) => G.dotsOf(...args) as Flat[];

// A lead or wire with a solder dot at each end.
function lead(art: Art, points: Point3[], radius = 1.6, tone: "hi" | "mid" = "hi") {
  const route = radius > 0 ? fillet(points, radius) : points;
  const d = polyline(route);
  art.line(d, { tone });
  art.path(d, "sim-hit");
  art.dots([at(points[0]), at(points[points.length - 1])], { size: 0.7, tone: "hi" });
}

// Thick coloured arc on a turned body: resistor and diode bands.
function band(F: Frame, s: number, r: number, color: string) {
  return <path key={`band-${s}`} className="sim-band" data-band={color} d={G.arcOf(F, s, r, P, { trim: 0.8 })} />;
}

const battery: Piece = {
  draw(art, term) {
    const body: Plan = { x: -10, y: -22.5, w: 20, d: 13, r: 1.8 };
    art.solid(k.slabOf({ x: -13, y: -27, w: 26, d: 22, r: 2 }, 0, 3, P, 4, 0.6), { tone: "lo" });
    art.dots([at([-9.5, -7.6, 3]), at([9.5, -7.6, 3])], { size: 0.6, tone: "mid" });
    art.solid(k.slabOf({ x: -13, y: -22, w: 2.2, d: 12, r: 0.6 }, 3, 11, P, 3, 0.3), { tone: "mid" });
    term(0, (art) => lead(art, [[-4.2, -16, 37.4], [-4.2, -16, 41], [-17, -16, 41], [-22, -6, 10], [-22, -2, 0]], 4, "mid"));
    art.solid(k.slabOf(body, 3, 30, P, 6, 0.5), {
      tone: "mid",
      inner: <path className="iso-line" data-tone="faint" d={k.sideSeam(body, 9, P, 6) + k.sideSeam(body, 27, P, 6)} />,
    });
    art.solid(k.slabOf(k.insetPlan(body, 0.6), 33, 1.4, P, 6, 0.3), { tone: "hi", crease: "lo" });
    art.solid(k.cylinder(-4.2, -16, 1.5, 34.4, 1, P, 16), { tone: "hi", crease: "none" });
    art.solid(k.cylinder(-4.2, -16, 2.2, 35.4, 2, P, 20), { tone: "hi" });
    art.solid(k.extrude(hexagon(4.2, -16, 3), 34.4, 2.6, P), { tone: "hi" });
    art.line(k.ring(4.2, -16, 1.7, 37, P, 16), { tone: "lo" });
    art.solid(k.slabOf({ x: 10.8, y: -22, w: 2.2, d: 12, r: 0.6 }, 3, 11, P, 3, 0.3), { tone: "mid" });
    term(1, (art) => lead(art, [[4.2, -16, 37], [4.2, -16, 41], [17, -16, 41], [22, -6, 10], [22, -2, 0]], 4, "mid"));
  },
};

const motor: Piece = {
  draw(art, term) {
    const F = along([0, CY, 12]);
    for (const x of [-14, 6]) art.solid(k.slabOf({ x, y: -22, w: 5, d: 16, r: 1 }, 0, 4, P, 3, 0.4), { tone: "lo" });
    const profile = [[-22, 9], [-21.3, 10], [-19, 10], [-19, 11], [13.3, 11], [14, 10.3], [14, 9.6], [17, 9.6], [17, 3], [19.5, 3], [19.5, 1.1], [24, 1.1]];
    art.solid(turned(G.solidOf(profile, F, P)), {
      tone: "mid",
      inner: <path className="iso-line" data-tone="faint" d={G.arcOf(F, -15, 11, P) + G.arcOf(F, 9, 11, P)} />,
    });
    art.line(G.circleOf(F, 17, 6.6, P, 40), { tone: "lo" });
    art.dots(dotsOn(F, 17, 6.6, 2, P, { all: true, phase: Math.PI / 2 }), { size: 0.7, tone: "mid" });
    art.solid(turned(G.disc(24, 28, 4.4, F, P)), { tone: "hi", inner: <path className="iso-line" data-tone="lo" d={G.arcOf(F, 26, 4.4, P)} /> });
    art.solid(turned(G.disc(28, 30.5, 1.1, F, P)), { tone: "hi" });
    for (const [index, y] of [[1, -18], [0, -10]] as const) {
      art.solid(k.slabOf({ x: -21.2, y: y - 1.4, w: 1.4, d: 2.8, r: 0.3 }, 21.6, 4, P, 2), { tone: "hi", crease: "none" });
      const x = index === 0 ? -34 : -28;
      term(index, (art) => lead(art, [[-20.5, y, 25.4], [x, y, 25.4], [x, y, 0]], 3));
    }
  },
};

const buzzer: Piece = {
  draw(art) {
    art.solid(k.cylinder(0, CY, 9.6, 0, 1, P, 48), { tone: "lo" });
    art.solid(k.cylinder(0, CY, 9, 1, 9, P, 56, 0.6), { tone: "mid", inner: <path className="iso-line" data-tone="faint" d={k.sideArc(0, CY, 9, 8, P, 32)} /> });
    art.line(k.ring(0, CY, 6.4, 10, P, 40), { tone: "lo" });
    art.line(k.ring(0, CY, 4.4, 10, P, 32), { tone: "faint" });
    art.path(k.ring(0, CY, 1.4, 10, P, 18), "sim-hole");
    art.line(k.ring(0, CY, 1.4, 10, P, 18), { tone: "mid" });
    art.line(k.lineOnTop([-6.6, CY - 3.2], [-4.6, CY - 3.2], 10, P), { tone: "lo", free: true });
    art.line(k.lineOnTop([-5.6, CY - 4.2], [-5.6, CY - 2.2], 10, P), { tone: "lo", free: true });
  },
};

const potentiometer: Piece = {
  draw(art, term, component) {
    const position = Number(component.getProperties().position);
    const cy = -15;
    const from = (-150 * Math.PI) / 180;
    const span = (300 * Math.PI) / 180;
    art.solid(k.slabOf({ x: -10, y: -25, w: 20, d: 19, r: 1.2 }, 0, 1.4, P, 3, 0.3), { tone: "hi", crease: "lo" });
    [-6, 0, 6].forEach((x, index) =>
      term(index, (art) => {
        art.solid(k.slabOf({ x: x - 1.1, y: -7.8, w: 2.2, d: 4.4, r: 0.4 }, 0, 2.2, P, 2), { tone: "hi", crease: "none" });
        art.dots([at([x, -5, 2.2])], { size: 0.6, tone: "lo" });
      }),
    );
    art.solid(k.cylinder(0, cy, 8.6, 1.4, 6, P, 56, 0.5), { tone: "mid" });
    art.line(k.ring(0, cy, 8, 7.4, P, 48), { tone: "lo" });
    const ticks = k.radialTicks(0, cy, 8, 10, 5, 7.4, [1, 1.8], P, from, span);
    art.line(ticks.minor, { tone: "lo" }).line(ticks.major, { tone: "mid" });
    art.solid(k.extrude(hexagon(0, cy, 4.6), 7.4, 1.8, P), { tone: "hi" });
    art.solid(k.cylinder(0, cy, 3.4, 9.2, 3.8, P, 28), {
      tone: "hi",
      inner: <path className="iso-line" data-tone="lo" d={[10.2, 11.2, 12.2].map((z) => k.sideArc(0, cy, 3.4, z, P, 20)).join("")} />,
    });
    art.solid(k.cylinder(0, cy, 2.4, 13, 8, P, 28), {
      tone: "hi",
      inner: <path className="iso-line" data-tone="lo" d={k.knurl(0, cy, 2.4, 15, 21, 20, P, 0) + k.sideArc(0, cy, 2.4, 15, P, 20)} />,
    });
    const angle = from + span * position;
    art.line(k.lineOnTop([0, cy], [2.4 * Math.sin(angle), cy - 2.4 * Math.cos(angle)], 21, P), { tone: "lit" });
    art.dots([at([0, cy, 21])], { size: 0.6, tone: "hi" });
  },
};

const pushButton: Piece = {
  draw(art, term) {
    term(0, (art) => lead(art, [[-7, -12, 2], [-9.6, -12, 2], [-11, -10, 0]], 1));
    art.solid(k.slabOf({ x: -7, y: -21, w: 14, d: 14, r: 1 }, 0, 4, P, 3, 0.4), { tone: "lo" });
    const cover: Plan = { x: -7.2, y: -21.2, w: 14.4, d: 14.4, r: 0.8 };
    art.solid(k.slabOf(cover, 4, 0.7, P, 3), { tone: "hi", crease: "none" });
    art.dots(k.corners(cover, 1.6).map(([x, y]) => at([x, y, 4.7])), { size: 0.6, tone: "mid" });
    art.line(k.ring(0, -14, 4.6, 4.7, P, 32), { tone: "lo" });
    art.solid(k.cylinder(0, -14, 3.4, 4.7, 1.5, P, 28), { tone: "mid", crease: "none" });
    art.solid(k.cylinder(0, -14, 4.8, 6.2, 3.8, P, 36, 0.6), { tone: "hi", crease: "lo" });
    art.line(k.ring(0, -14, 3.2, 10, P, 28), { tone: "lo" });
    term(1, (art) => lead(art, [[7, -12, 2], [9.6, -12, 2], [11, -10, 0]], 1));
  },
};

const toggle: Piece = {
  draw(art, term, component) {
    const closed = Boolean(component.getProperties().closed);
    const cy = -15.5;
    const body: Plan = { x: -7, y: -22, w: 14, d: 13, r: 1 };
    art.solid(k.slabOf(body, 0, 9, P, 3, 0.5), { tone: "mid", inner: <path className="iso-line" data-tone="faint" d={k.sideSeam(body, 2.4, P, 3)} /> });
    [-4.5, 4.5].forEach((x, index) =>
      term(index, (art) => {
        art.solid(k.slabOf({ x: x - 1.2, y: -9, w: 2.4, d: 3.4, r: 0.3 }, 0, 1, P, 2), { tone: "hi", crease: "none" });
        art.dots([at([x, -7.3, 1])], { size: 0.6, tone: "lo" });
      }),
    );
    art.solid(k.extrude(hexagon(0, cy, 4.6), 9, 1.8, P), { tone: "hi" });
    art.solid(k.cylinder(0, cy, 3.2, 10.8, 4.2, P, 28), {
      tone: "hi",
      inner: <path className="iso-line" data-tone="lo" d={[12, 13, 14].map((z) => k.sideArc(0, cy, 3.2, z, P, 20)).join("")} />,
    });
    const tilt = closed ? 0.42 : -0.42;
    const axis = G.unit3([tilt, 0, 1]);
    const lever = G.frameAlong([0, cy, 15], axis);
    const profile = [[0, 1.6], [1.2, 1.6], [1.2, 1.1], [9, 0.8], [9.4, 1.05, 1], [10.2, 1.3, 1], [11, 1.05, 1], [11.4, 0]];
    art.solid(turned(G.solidOf(profile, lever, P)), { tone: "hi" });
  },
};

const resistor: Piece = {
  draw(art, term, component) {
    const { resistance, tolerance } = component.getProperties() as { resistance: number; tolerance: number };
    const F = along([0, CY, 4.6]);
    term(0, (art) => lead(art, [[-10, CY, 4.6], [-17, CY, 4.6], [-17, CY, 0]], 1.6));
    const profile = [[-10, 2.2], [-9.6, 3, 1], [-8.6, 3.6, 1], [-7.2, 3.5, 1], [-5.8, 3.05, 1], [5.8, 3.05, 1], [7.2, 3.5, 1], [8.6, 3.6, 1], [9.6, 3, 1], [10, 2.2]];
    const colours = colourCode(resistance, tolerance);
    art.solid(turned(G.solidOf(profile, F, P)), { tone: "mid", inner: [-4.4, -2.4, -0.4, 4.2].map((s, index) => band(F, s, 3.06, colours[index])) });
    term(1, (art) => lead(art, [[10, CY, 4.6], [17, CY, 4.6], [17, CY, 0]], 1.6));
  },
};

const capacitor: Piece = {
  draw(art, _term, component) {
    const polarized = Boolean(component.getProperties().polarized);
    const r = 6.4;
    art.solid(k.cylinder(0, CY, 6, 0, 1.4, P, 40), { tone: "lo" });
    const stripe: ReactNode[] = [];
    if (polarized) {
      const arc = (z: number) => Array.from({ length: 9 }, (_, index) => ((-4 + index * 4.5) * Math.PI) / 180).map((a) => at([r * Math.cos(a), CY + r * Math.sin(a), z]));
      stripe.push(<path key="stripe" className="sim-stripe" d={k.pathOf([...arc(3), ...arc(14).reverse()], true)} />);
      for (const z of [6, 8.6, 11.2]) {
        const mid = (14 * Math.PI) / 180;
        const half = (5 * Math.PI) / 180;
        stripe.push(<path key={`minus-${z}`} className="iso-line" data-tone="mid" data-free="" d={k.pathOf([at([r * Math.cos(mid - half), CY + r * Math.sin(mid - half), z]), at([r * Math.cos(mid + half), CY + r * Math.sin(mid + half), z])])} />);
      }
    }
    art.solid(k.cylinder(0, CY, r, 1.4, 14.6, P, 56), {
      tone: "mid",
      inner: [...stripe, <path key="seams" className="iso-line" data-tone="lo" d={k.sideArc(0, CY, r, 14, P, 32) + k.sideArc(0, CY, r, 3, P, 32)} />],
    });
    art.solid(k.cylinder(0, CY, 5.7, 16, 0.4, P, 48), { tone: "hi", crease: "none" });
    art.line(k.ring(0, CY, 3.6, 16.4, P, 32), { tone: "lo" });
    const vent = [0, 1, 2].map((index) => {
      const a = (index / 3) * Math.PI * 2 + Math.PI / 6;
      return k.lineOnTop([0, CY], [3.6 * Math.cos(a), CY + 3.6 * Math.sin(a)], 16.4, P);
    });
    art.line(vent.join(""), { tone: "lo" });
    art.dots([at([0, CY, 16.4])], { size: 0.6, tone: "mid" });
  },
};

const inductor: Piece = {
  draw(art, term) {
    const F = along([0, CY, 7]);
    term(0, (art) => lead(art, [[-11, CY, 7], [-17, CY, 7], [-17, CY, 0]], 1.8));
    art.solid(turned(G.disc(-11, -9.6, 6.2, F, P)), { tone: "mid" });
    // the wire lies on the winding's surface, so it turns away exactly at the outline; a solder dot ends it at each flange
    const coil = k.coil(-9.6, 9.6, [CY, 7], 3.2, 13, "x", P);
    art.solid(turned(G.disc(-9.6, 9.6, 3.2, F, P)), { tone: "hi", inner: <path className="iso-line" data-tone="mid" d={coil.front} /> });
    art.dots([at([-9.6, CY + 3.2, 7]), at([9.6, CY + 3.2, 7])], { size: 0.8, tone: "hi" });
    art.solid(turned(G.disc(9.6, 11, 6.2, F, P)), { tone: "mid" });
    term(1, (art) => lead(art, [[11, CY, 7], [17, CY, 7], [17, CY, 0]], 1.8));
  },
};

const diode: Piece = {
  draw(art, term) {
    const F = along([0, CY, 3.4]);
    term(0, (art) => lead(art, [[-6.5, CY, 3.4], [-14, CY, 3.4], [-14, CY, 0]], 1.4));
    const profile = [[-6.5, 1.6], [-6.1, 2.4, 1], [-5, 2.7, 1], [5, 2.7, 1], [6.1, 2.4, 1], [6.5, 1.6]];
    art.solid(turned(G.solidOf(profile, F, P)), { tone: "mid", inner: band(F, 4, 2.72, "cathode") });
    term(1, (art) => lead(art, [[6.5, CY, 3.4], [14, CY, 3.4], [14, CY, 0]], 1.4));
  },
};

const led: Piece = {
  draw(art, term, component) {
    const colour = String(component.getProperties().color);
    [-1, 1].forEach((side, index) =>
      term(index, (art) => {
        const d = polyline([[2.6 * side, CY, 0], [2.6 * side, CY, 1.2], [1.27 * side, CY, 2.6], [1.27 * side, CY, 3.4]]);
        art.line(d, { tone: "hi" });
        art.path(d, "sim-hit");
      }),
    );
    const profile = [[0, 3.6], [1.1, 3.6], [1.1, 3], [5.6, 3], [6.4, 2.9, 1], [7.4, 2.55, 1], [8.3, 1.95, 1], [9, 1.15, 1], [9.35, 0]];
    art.group({ className: "sim-tinted", "data-color": colour }, (art) => art.solid(turned(G.solidOf(profile, upright([0, CY, 3.4]), P)), { tone: "hi" }));
  },
};

const transistor: Piece = {
  draw(art, term) {
    const low = (-20.4 * Math.PI) / 180;
    const high = (200.4 * Math.PI) / 180;
    const ring: Plane[] = Array.from({ length: 25 }, (_, index) => low + ((high - low) * index) / 24).map((a) => [4.6 * Math.cos(a), -13.2 - 4.6 * Math.sin(a)]);
    [-2.54, 0, 2.54].forEach((x, index) => {
      const pad = [-5, 0, 5][index];
      term(index, (art) => {
        const d = polyline(fillet([[x, -12.6, 4], [x, -12.6, 2.2], [pad, -7.4, 0.6], [pad, -6, 0]], 0.8));
        art.line(d, { tone: "hi" });
        art.path(d, "sim-hit");
      });
    });
    art.solid(k.extrude(ring, 4, 10, P, { bevel: 0.4 }), { tone: "mid" });
    for (const z of [11.6, 10, 8.4]) art.line(k.segment([-2.6, -11.6, z], [2.6, -11.6, z], P), { tone: "lo", free: true });
  },
};

const ldr: Piece = {
  draw(art, term) {
    [-1, 1].forEach((side, index) =>
      term(index, (art) => {
        const d = polyline([[2.6 * side, -11, 0], [2.6 * side, -11, 2.4], [2.2 * side, -12.6, 4]]);
        art.line(d, { tone: "hi" });
        art.path(d, "sim-hit");
      }),
    );
    const r = 5.4;
    art.solid(k.cylinder(0, CY, r, 4, 2, P, 48, 0.4), { tone: "hi", crease: "lo" });
    const edge = 3.2;
    const reach = Math.sqrt(r * r - edge * edge);
    art.line(k.lineOnTop([-reach, CY - edge], [reach, CY - edge], 6, P) + k.lineOnTop([-reach, CY + edge], [reach, CY + edge], 6, P), { tone: "mid" });
    const track: Plane[] = Array.from({ length: 9 }, (_, index) => [-3.2 + index * 0.8, CY + (index % 2 ? edge : -edge)]);
    art.line(k.onTop(track, 6, P), { tone: "lo" });
  },
};

const ultrasonic: Piece = {
  draw(art, term) {
    const pcb: Plan = { x: -22, y: -31, w: 44, d: 21, r: 1 };
    for (const x of [-19, 19]) art.solid(k.cylinder(x, -28, 1.6, 0, 2.6, P, 16), { tone: "lo" });
    art.solid(k.slabOf({ x: -6.5, y: -12.2, w: 13, d: 2.6, r: 0.3 }, 0, 2.6, P, 2, 0.3), { tone: "lo" });
    art.solid(k.slabOf(pcb, 2.6, 1.4, P, 3, 0.4), { tone: "mid" });
    for (const [x, y] of k.corners(pcb, 2.4)) {
      art.line(k.ring(x, y, 1.2, 4, P, 16), { tone: "lo" });
      art.dots([at([x, y, 4])], { size: 0.5, tone: "lo" });
    }
    art.solid(k.slabOf({ x: -4, y: -29.6, w: 8, d: 3.2, r: 1.6 }, 4, 3, P, 6, 0.3), { tone: "hi" });
    for (const x of [-11, 11]) {
      art.solid(k.cylinder(x, -19.5, 8, 4, 11.5, P, 56, 0.5), { tone: "hi", crease: "lo" });
      art.line(k.ring(x, -19.5, 6.6, 15.5, P, 48), { tone: "lo" });
      const mesh: Point3[] = [];
      for (let gx = -6; gx <= 6; gx += 1.5) for (let gy = -6; gy <= 6; gy += 1.5) if (Math.hypot(gx, gy) < 5.6) mesh.push([x + gx, -19.5 + gy, 15.5]);
      art.dots(mesh.map(at), { size: 0.45, tone: "lo" });
    }
    [-4.5, -1.5, 1.5, 4.5].forEach((x, index) => term(index, (art) => lead(art, [[x, -9.6, 1.3], [x, -7.2, 1.3], [x, -6, 0]], 0.8)));
  },
};

export const PIECES: Record<string, Piece> = {
  "dc-voltage-source": battery,
  "dc-motor": motor,
  "active-buzzer": buzzer,
  potentiometer,
  "push-button": pushButton,
  switch: toggle,
  resistor,
  capacitor,
  inductor,
  diode,
  led,
  "transistor-bjt": transistor,
  ldr,
  ultrasonic,
};
