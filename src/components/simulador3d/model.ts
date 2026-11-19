import * as THREE from "three";
import type { Spec } from "@/components/simulador/catalog";
import {
  BAND_COLOURS,
  BLOCK_D,
  BLOCK_Y,
  BOARD,
  BOARD_T,
  CY,
  LAYOUT,
  PITCH,
  STANDOFF_H,
  STEP_Z,
  TOWER_D,
  TOWER_Z,
  cellX,
  colourCode,
  traces,
  type Plan,
} from "@/components/simulador/layout";

type V3 = [number, number, number];

export interface Palette {
  dark: boolean;
  ink: string;
  faint: string;
  accent: string;
}

export interface Built {
  root: THREE.Group;
  // every mesh and line that belongs to a terminal, by terminal id
  terminals: Map<string, THREE.Object3D[]>;
  dispose(): void;
}

// Materials for one scene; dark pages get lighter plastics so the parts still read.
function materials(palette: Palette) {
  const { dark } = palette;
  const standard = (color: string, roughness = 0.6, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  return {
    board: standard(dark ? "#2c2d30" : "#efeeea", 0.85),
    plastic: standard(dark ? "#4a4d52" : "#dfe2e4", 0.7),
    black: standard(dark ? "#3a3b3f" : "#2b2b2f", 0.55),
    steel: standard("#c4c8ce", 0.32, 0.85),
    darkSteel: standard("#8d9198", 0.4, 0.8),
    brass: standard("#c9a24a", 0.35, 0.8),
    copper: standard("#c07a45", 0.38, 0.75),
    solder: standard("#d9dde2", 0.25, 0.9),
    hole: standard("#0d0d0f", 0.9),
    white: standard(dark ? "#d7d7d2" : "#f7f7f4", 0.6),
    print: standard(dark ? "#e6e6e6" : "#3b3b40", 0.6),
    label: standard("#c99a2e", 0.5),
    sleeve: standard("#2f4579", 0.45),
    beige: standard("#d8c49b", 0.6),
    ceramic: standard("#e7ddc6", 0.7),
    track: standard("#c2562b", 0.6),
    ferrite: standard("#4a4a4e", 0.75),
    pcb: standard("#2f62a6", 0.6),
    wireRed: standard("#c9352f", 0.5),
    wireBlack: standard("#26262a", 0.5),
    cap: standard(dark ? "#5b5e64" : "#4a4b50", 0.5),
    hit: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    shadow: new THREE.ShadowMaterial({ opacity: dark ? 0.45 : 0.16 }),
    edge: new THREE.LineBasicMaterial({ color: palette.ink, transparent: true, opacity: dark ? 0.32 : 0.42 }),
    silk: new THREE.LineBasicMaterial({ color: palette.faint }),
  };
}

// The winding of a coil along x: `turns` turns of radius r round (y, z), from x0 to x1.
class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(
    private x0: number,
    private x1: number,
    private y: number,
    private z: number,
    private r: number,
    private turns: number,
  ) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    return target.set(this.x0 + (this.x1 - this.x0) * t, this.y + this.r * Math.cos(a), this.z + this.r * Math.sin(a));
  }
}

const LED_COLOURS: Record<string, string> = { red: "#e5484d", green: "#30a46c", blue: "#3e63dd", yellow: "#e6c23a", white: "#f2f2f2" };

// Builds the scene for one component in world units: x and y on the board, z up.
// The isometric kit draws +x to the right of a viewer at +x +y, which is the mirror image of a right-handed world,
// so the root maps (x, y, z) to three's (x, z, y): a mirror, so the default view matches the 2D card.
export function buildModel(spec: Spec, palette: Palette): Built {
  const layout = LAYOUT[spec.type];
  if (!layout) throw new Error(`No model for component type "${spec.type}"`);
  const M = materials(palette);
  const root = new THREE.Group();
  root.scale.y = -1;
  root.rotation.x = -Math.PI / 2;
  const terminals = new Map<string, THREE.Object3D[]>();
  const disposables: Array<{ dispose(): void }> = Object.values(M);
  let owner: string | null = null;

  const keep = <T extends THREE.Object3D>(object: T) => {
    if (owner !== null) {
      const list = terminals.get(owner) ?? [];
      list.push(object);
      terminals.set(owner, list);
      object.userData.terminal = owner;
    }
    root.add(object);
    return object;
  };

  // A mesh with its crease lines, cast and received shadows, filed under the current terminal.
  // A terminal's meshes get their own copy of the material, so lighting one only changes uniforms, never a program.
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, { edges = true }: { edges?: boolean } = {}) => {
    disposables.push(geometry);
    const own = owner !== null && material instanceof THREE.MeshStandardMaterial ? material.clone() : material;
    if (own !== material) disposables.push(own);
    const mesh = new THREE.Mesh(geometry, own);
    mesh.castShadow = material !== M.hit;
    mesh.receiveShadow = true;
    keep(mesh);
    if (edges) {
      const lines = new THREE.EdgesGeometry(geometry, 28);
      disposables.push(lines);
      const outline = new THREE.LineSegments(lines, M.edge);
      outline.raycast = () => {};
      keep(outline);
    }
    return mesh;
  };

  const within = (id: string | null, build: () => void) => {
    const previous = owner;
    owner = id;
    build();
    owner = previous;
  };

  // Shapes and solids --------------------------------------------------------------

  const roundedShape = (plan: Plan, inset = 0) => {
    const x = plan.x + inset;
    const y = plan.y + inset;
    const w = plan.w - 2 * inset;
    const d = plan.d - 2 * inset;
    const r = Math.max(0, Math.min(plan.r - inset, w / 2, d / 2));
    const shape = new THREE.Shape();
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + d - r);
    shape.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    shape.lineTo(x + r, y + d);
    shape.quadraticCurveTo(x, y + d, x, y + d - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  };

  const prism = (shape: THREE.Shape, z: number, h: number, material: THREE.Material, bevel = 0) => {
    const b = Math.min(bevel, h / 3);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: h - 2 * b,
      bevelEnabled: b > 0,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 2,
      curveSegments: 8,
    });
    geometry.translate(0, 0, z + b);
    return add(geometry, material);
  };

  const slab = (plan: Plan, z: number, h: number, material: THREE.Material, bevel = 0.4) =>
    prism(roundedShape(plan, Math.min(bevel, h / 3)), z, h, material, bevel);

  const polygon = (points: Array<[number, number]>) => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], index) => (index ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    return shape;
  };

  const hexagon = (cx: number, cy: number, r: number) =>
    polygon(Array.from({ length: 6 }, (_, index) => {
      const a = (index / 6) * Math.PI * 2 + Math.PI / 6;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }));

  // A cylinder standing on the board.
  const cylinder = (cx: number, cy: number, r: number, z: number, h: number, material: THREE.Material, segments = 40, edges = true) => {
    const geometry = new THREE.CylinderGeometry(r, r, h, segments);
    geometry.rotateX(Math.PI / 2);
    geometry.translate(cx, cy, z + h / 2);
    return add(geometry, material, { edges });
  };

  // A cylinder lying along x, centred on (y, z).
  const cylinderX = (s0: number, s1: number, r: number, y: number, z: number, material: THREE.Material, segments = 40) => {
    const geometry = new THREE.CylinderGeometry(r, r, s1 - s0, segments);
    geometry.rotateZ(-Math.PI / 2);
    geometry.translate((s0 + s1) / 2, y, z);
    return add(geometry, material);
  };

  // A turned body from an [s, r] profile, closed to the axis, along a unit axis through an origin.
  const lathe = (profile: Array<[number, number]>, origin: V3, axis: V3, material: THREE.Material, segments = 48) => {
    const first = profile[0];
    const last = profile[profile.length - 1];
    const points = [[first[0], 0], ...profile, [last[0], 0]].map(([s, r]) => new THREE.Vector2(Math.max(r, 0.0001), s));
    const geometry = new THREE.LatheGeometry(points, segments);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...axis).normalize()));
    geometry.translate(...origin);
    return add(geometry, material, { edges: false });
  };

  // A wire or lead through 3D points, its corners rounded with the given radius.
  const tube = (points: V3[], r: number, material: THREE.Material, bend = 1.6) => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    const v = points.map((p) => new THREE.Vector3(...p));
    let from = v[0];
    for (let index = 1; index < v.length - 1; index++) {
      const corner = v[index];
      const before = corner.clone().sub(v[index - 1]);
      const after = v[index + 1].clone().sub(corner);
      const cut = Math.min(bend, before.length() / 2, after.length() / 2);
      const entry = corner.clone().addScaledVector(before.normalize(), -cut);
      const exit = corner.clone().addScaledVector(after.normalize(), cut);
      path.add(new THREE.LineCurve3(from, entry));
      path.add(new THREE.QuadraticBezierCurve3(entry, corner, exit));
      from = exit;
    }
    path.add(new THREE.LineCurve3(from, v[v.length - 1]));
    const geometry = new THREE.TubeGeometry(path, Math.max(16, v.length * 12), r, 10, false);
    return add(geometry, material, { edges: false });
  };

  const ball = (at: V3, r: number, material: THREE.Material) => {
    const geometry = new THREE.SphereGeometry(r, 16, 12);
    geometry.translate(...at);
    return add(geometry, material, { edges: false });
  };

  // A solder joint: a low dome where a lead meets its pad.
  const joint = (x: number, y: number) => {
    const geometry = new THREE.SphereGeometry(1.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    geometry.rotateX(Math.PI / 2);
    geometry.scale(1, 1, 0.55);
    geometry.translate(x, y, 0.1);
    return add(geometry, M.solder, { edges: false });
  };

  // A flat bar on the board between two points: copper traces, printed marks.
  const strip = (a: [number, number], b: [number, number], width: number, z: number, h: number, material: THREE.Material) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const geometry = new THREE.BoxGeometry(length + width, width, h);
    geometry.rotateZ(Math.atan2(b[1] - a[1], b[0] - a[0]));
    geometry.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z + h / 2);
    return add(geometry, material, { edges: false });
  };

  // Text printed flat on a top face, reading along +x.
  const label = (text: string, x: number, y: number, z: number, size: number, anchor: "start" | "middle" = "middle") => {
    const canvas = document.createElement("canvas");
    const scale = 64;
    const context = canvas.getContext("2d")!;
    context.font = `600 ${scale}px ui-monospace, Menlo, Consolas, monospace`;
    const width = Math.ceil(context.measureText(text).width) + 16;
    canvas.width = width;
    canvas.height = scale + 16;
    context.font = `600 ${scale}px ui-monospace, Menlo, Consolas, monospace`;
    context.fillStyle = palette.ink;
    context.textBaseline = "middle";
    context.fillText(text, 8, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    // the root's mirror flips the plane's v axis, so the canvas goes in unflipped
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    const w = (size * canvas.width) / canvas.height;
    const geometry = new THREE.PlaneGeometry(w, size);
    geometry.translate(anchor === "middle" ? x : x + w / 2, y, z + 0.03);
    disposables.push(texture, material);
    const mesh = add(geometry, material, { edges: false });
    mesh.castShadow = false;
    return mesh;
  };

  // A line drawn on a face: silkscreen outlines.
  const outlineOn = (plan: Plan, z: number) => {
    const points = roundedShape(plan).getPoints(6).map((p) => new THREE.Vector3(p.x, p.y, z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    disposables.push(geometry);
    const line = new THREE.LineLoop(geometry, M.silk);
    line.raycast = () => {};
    return keep(line);
  };

  // The board ------------------------------------------------------------------------

  const floor = -BOARD_T - STANDOFF_H;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.shadow);
  ground.position.z = floor - 0.01;
  ground.receiveShadow = true;
  ground.raycast = () => {};
  ground.userData.ground = true;
  disposables.push(ground.geometry);
  root.add(ground);

  const corners: Array<[number, number]> = [
    [BOARD.x + 7, BOARD.y + 7],
    [BOARD.x + BOARD.w - 7, BOARD.y + 7],
    [BOARD.x + 7, BOARD.y + BOARD.d - 7],
    [BOARD.x + BOARD.w - 7, BOARD.y + BOARD.d - 7],
  ];
  for (const [x, y] of corners) {
    cylinder(x, y, 3.4, floor, 1.4, M.black, 28);
    prism(hexagon(x, y, 2.9), floor + 1.4, STANDOFF_H - 1.4, M.brass);
  }
  slab(BOARD, -BOARD_T, BOARD_T, M.board, 0.6);
  outlineOn({ ...BOARD, x: BOARD.x + 3.2, y: BOARD.y + 3.2, w: BOARD.w - 6.4, d: BOARD.d - 6.4, r: 1 }, 0.02);
  for (const [x, y] of corners) {
    cylinder(x, y, 2.5, 0, 0.9, M.steel, 28);
    strip([x - 1.9, y], [x + 1.9, y], 0.45, 0.9, 0.06, M.hole);
    strip([x, y - 1.9], [x, y + 1.9], 0.45, 0.9, 0.06, M.hole);
  }
  for (const [x, y] of [[BOARD.x + 16, BOARD.y + 7], [BOARD.x + BOARD.w - 7, BOARD.y + BOARD.d - 18]] as Array<[number, number]>) {
    cylinder(x, y, 1.6, 0, 0.06, M.copper, 24, false);
  }
  outlineOn(layout.footprint, 0.02);
  label(spec.id, layout.footprint.x + 1, layout.footprint.y - 2.4, 0, 3.2, "start");

  const ids = spec.terminals.map((terminal) => terminal.id);
  if (layout.pads.length !== ids.length) throw new Error(`${spec.className}: ${layout.pads.length} pads for ${ids.length} terminals`);

  traces(layout.pads, ids.length).forEach((route, index) =>
    within(ids[index], () => {
      for (let step = 1; step < route.length; step++) strip(route[step - 1], route[step], 1.1, 0, 0.08, M.copper);
      const [x, y] = layout.pads[index];
      cylinder(x, y, 1.9, 0, 0.1, M.copper, 24, false);
      joint(x, y);
    }),
  );

  // The component --------------------------------------------------------------------

  const term = (index: number, build: () => void) => within(ids[index], build);
  const lead = (points: V3[], material = M.steel, r = 0.42, bend = 1.6) => tube(points, r, material, bend);
  const props = spec.properties;

  switch (spec.type) {
    case "dc-voltage-source": {
      slab({ x: -13, y: -27, w: 26, d: 22, r: 2 }, 0, 3, M.black, 0.5);
      slab({ x: -13, y: -22, w: 2.2, d: 12, r: 0.6 }, 3, 11, M.black, 0.3);
      slab({ x: 10.8, y: -22, w: 2.2, d: 12, r: 0.6 }, 3, 11, M.black, 0.3);
      const body = { x: -10, y: -22.5, w: 20, d: 13, r: 1.8 };
      slab(body, 3, 30, M.black, 0.5);
      slab({ ...body, x: body.x - 0.08, y: body.y - 0.08, w: body.w + 0.16, d: body.d + 0.16 }, 9, 18, M.label, 0);
      slab({ x: -9.4, y: -21.9, w: 18.8, d: 11.8, r: 1.4 }, 33, 1.4, M.steel, 0.3);
      cylinder(-4.2, -16, 1.5, 34.4, 1, M.steel, 20);
      cylinder(-4.2, -16, 2.2, 35.4, 2, M.steel, 24);
      prism(hexagon(4.2, -16, 3), 34.4, 2.6, M.steel, 0.2);
      cylinder(4.2, -16, 1.7, 37, 0.06, M.hole, 20, false);
      term(0, () => {
        lead([[-4.2, -16, 37.4], [-4.2, -16, 41], [-17, -16, 41], [-22, -6, 10], [-22, -2, 0]], M.wireRed, 0.55, 4);
      });
      term(1, () => {
        lead([[4.2, -16, 37], [4.2, -16, 41], [17, -16, 41], [22, -6, 10], [22, -2, 0]], M.wireBlack, 0.55, 4);
      });
      break;
    }
    case "dc-motor": {
      const y = CY;
      const z = 12;
      for (const x of [-14, 6]) slab({ x, y: -22, w: 5, d: 16, r: 1 }, 0, 4, M.black, 0.4);
      cylinderX(-22, -19, 10, y, z, M.darkSteel, 56);
      cylinderX(-19, 14, 11, y, z, M.steel, 64);
      cylinderX(14, 17, 9.6, y, z, M.darkSteel, 56);
      cylinderX(17, 19.5, 3, y, z, M.brass, 32);
      cylinderX(19.5, 30.5, 1.1, y, z, M.steel, 20);
      cylinderX(24, 28, 4.4, y, z, M.white, 40);
      for (const a of [Math.PI / 2, -Math.PI / 2]) ball([17.05, y + 6.6 * Math.cos(a), z + 6.6 * Math.sin(a)], 0.7, M.hole);
      for (const [index, ty] of [[1, -18], [0, -10]] as const) {
        slab({ x: -21.2, y: ty - 1.4, w: 1.4, d: 2.8, r: 0.3 }, 21.6, 4, M.brass, 0.1);
        const x = index === 0 ? -34 : -28;
        term(index, () => lead([[-20.5, ty, 25.4], [x, ty, 25.4], [x, ty, 0]], index === 0 ? M.wireRed : M.wireBlack, 0.55, 3));
      }
      break;
    }
    case "active-buzzer": {
      cylinder(0, CY, 9.6, 0, 1, M.black, 56);
      cylinder(0, CY, 9, 1, 9, M.black, 64);
      cylinder(0, CY, 1.4, 10, 0.06, M.hole, 24, false);
      strip([-6.6, CY - 3.2], [-4.6, CY - 3.2], 0.35, 10, 0.05, M.white);
      strip([-5.6, CY - 4.2], [-5.6, CY - 2.2], 0.35, 10, 0.05, M.white);
      break;
    }
    case "potentiometer": {
      const cy = -15;
      slab({ x: -10, y: -25, w: 20, d: 19, r: 1.2 }, 0, 1.4, M.steel, 0.2);
      [-6, 0, 6].forEach((x, index) => term(index, () => slab({ x: x - 1.1, y: -7.8, w: 2.2, d: 4.4, r: 0.4 }, 0, 2.2, M.steel, 0.1)));
      cylinder(0, cy, 8.6, 1.4, 6, M.black, 64);
      const from = (-150 * Math.PI) / 180;
      const span = (300 * Math.PI) / 180;
      for (let tick = 0; tick <= 10; tick++) {
        const a = from + (span * tick) / 10;
        const inner = 8 - (tick % 5 === 0 ? 1.8 : 1);
        strip([inner * Math.sin(a), cy - inner * Math.cos(a)], [7.8 * Math.sin(a), cy - 7.8 * Math.cos(a)], 0.3, 7.4, 0.04, M.white);
      }
      prism(hexagon(0, cy, 4.6), 7.4, 1.8, M.steel, 0.2);
      cylinder(0, cy, 3.4, 9.2, 3.8, M.steel, 32);
      const knob = new THREE.CylinderGeometry(2.4, 2.4, 8, 20);
      const shaft = add(knob.rotateX(Math.PI / 2).translate(0, cy, 17), new THREE.MeshStandardMaterial({ color: "#c4c8ce", roughness: 0.35, metalness: 0.85, flatShading: true }));
      disposables.push(shaft.material as THREE.Material);
      const angle = from + span * Number(props.position);
      strip([0, cy], [2.2 * Math.sin(angle), cy - 2.2 * Math.cos(angle)], 0.4, 21, 0.06, M.hole);
      break;
    }
    case "push-button": {
      term(0, () => lead([[-7, -12, 2], [-9.6, -12, 2], [-11, -10, 0]], M.steel, 0.4, 1));
      slab({ x: -7, y: -21, w: 14, d: 14, r: 1 }, 0, 4, M.black, 0.4);
      slab({ x: -7.2, y: -21.2, w: 14.4, d: 14.4, r: 0.8 }, 4, 0.7, M.steel, 0.15);
      cylinder(0, -14, 3.4, 4.7, 1.5, M.black, 32);
      cylinder(0, -14, 4.8, 6.2, 3.8, M.cap, 40);
      term(1, () => lead([[7, -12, 2], [9.6, -12, 2], [11, -10, 0]], M.steel, 0.4, 1));
      break;
    }
    case "switch": {
      const cy = -15.5;
      slab({ x: -7, y: -22, w: 14, d: 13, r: 1 }, 0, 9, M.black, 0.5);
      [-4.5, 4.5].forEach((x, index) => term(index, () => slab({ x: x - 1.2, y: -9, w: 2.4, d: 3.4, r: 0.3 }, 0, 1, M.brass, 0.1)));
      prism(hexagon(0, cy, 4.6), 9, 1.8, M.steel, 0.2);
      cylinder(0, cy, 3.2, 10.8, 4.2, M.steel, 32);
      const tilt = props.closed ? 0.42 : -0.42;
      lathe([[0, 1.6], [1.2, 1.6], [1.2, 1.1], [9, 0.8], [9.4, 1.05], [10.2, 1.3], [11, 1.05], [11.4, 0.3]], [0, cy, 15], [tilt, 0, 1], M.steel, 32);
      break;
    }
    case "resistor": {
      term(0, () => lead([[-10, CY, 4.6], [-17, CY, 4.6], [-17, CY, 0]]));
      const profile: Array<[number, number]> = [[-10, 2.2], [-9.6, 3], [-8.6, 3.6], [-7.2, 3.5], [-5.8, 3.05], [5.8, 3.05], [7.2, 3.5], [8.6, 3.6], [9.6, 3], [10, 2.2]];
      lathe(profile, [0, CY, 4.6], [1, 0, 0], M.beige);
      const colours = colourCode(Number(props.resistance), Number(props.tolerance));
      [-4.4, -2.4, -0.4, 4.2].forEach((s, index) => {
        const colour = BAND_COLOURS[colours[index]];
        if (!colour) return;
        const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.5, metalness: colours[index] === "gold" || colours[index] === "silver" ? 0.7 : 0 });
        disposables.push(material);
        cylinderX(s - 0.55, s + 0.55, 3.12, CY, 4.6, material);
      });
      term(1, () => lead([[10, CY, 4.6], [17, CY, 4.6], [17, CY, 0]]));
      break;
    }
    case "capacitor": {
      const r = 6.4;
      cylinder(0, CY, 6, 0, 1.4, M.black, 48);
      cylinder(0, CY, r, 1.4, 14.6, M.sleeve, 64);
      if (props.polarized) {
        const phi = (-4 * Math.PI) / 180;
        const stripe = new THREE.CylinderGeometry(r + 0.05, r + 0.05, 11, 16, 1, true, phi + Math.PI / 2, (36 * Math.PI) / 180);
        stripe.rotateX(Math.PI / 2).translate(0, CY, 3 + 5.5);
        add(stripe, M.white, { edges: false });
      }
      cylinder(0, CY, 5.7, 16, 0.4, M.steel, 48);
      for (let index = 0; index < 3; index++) {
        const a = (index / 3) * Math.PI * 2 + Math.PI / 6;
        strip([0, CY], [3.6 * Math.cos(a), CY + 3.6 * Math.sin(a)], 0.3, 16.4, 0.05, M.hole);
      }
      break;
    }
    case "inductor": {
      term(0, () => lead([[-11, CY, 7], [-17, CY, 7], [-17, CY, 0]], M.copper, 0.42, 1.8));
      cylinderX(-11, -9.6, 6.2, CY, 7, M.ferrite, 48);
      cylinderX(-9.6, 9.6, 3, CY, 7, M.ferrite, 40);
      const turns = 13;
      add(new THREE.TubeGeometry(new Helix(-9.3, 9.3, CY, 7, 3.35, turns), turns * 24, 0.36, 8, false), M.copper, { edges: false });
      cylinderX(9.6, 11, 6.2, CY, 7, M.ferrite, 48);
      term(1, () => lead([[11, CY, 7], [17, CY, 7], [17, CY, 0]], M.copper, 0.42, 1.8));
      break;
    }
    case "diode": {
      term(0, () => lead([[-6.5, CY, 3.4], [-14, CY, 3.4], [-14, CY, 0]], M.steel, 0.4, 1.4));
      lathe([[-6.5, 1.6], [-6.1, 2.4], [-5, 2.7], [5, 2.7], [6.1, 2.4], [6.5, 1.6]], [0, CY, 3.4], [1, 0, 0], M.black);
      cylinderX(3.6, 4.8, 2.76, CY, 3.4, M.solder, 40);
      term(1, () => lead([[6.5, CY, 3.4], [14, CY, 3.4], [14, CY, 0]], M.steel, 0.4, 1.4));
      break;
    }
    case "led": {
      [-1, 1].forEach((side, index) =>
        term(index, () => lead([[2.6 * side, CY, 0], [2.6 * side, CY, 1.2], [1.27 * side, CY, 2.6], [1.27 * side, CY, 3.6]], M.steel, 0.3, 0.6)),
      );
      const colour = LED_COLOURS[String(props.color)] ?? LED_COLOURS.red;
      const epoxy = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.82, emissive: colour, emissiveIntensity: 0.35 });
      disposables.push(epoxy);
      const profile: Array<[number, number]> = [[0, 3.6], [1.1, 3.6], [1.1, 3]];
      for (let step = 0; step <= 12; step++) {
        const t = (step / 12) * (Math.PI / 2);
        profile.push([5.6 + 3.75 * Math.sin(t), 3 * Math.cos(t)]);
      }
      lathe(profile, [0, CY, 3.4], [0, 0, 1], epoxy, 48);
      break;
    }
    case "transistor-bjt": {
      [-2.54, 0, 2.54].forEach((x, index) => {
        const pad = [-5, 0, 5][index];
        term(index, () => lead([[x, -12.6, 4.2], [x, -12.6, 2.2], [pad, -7.4, 0.6], [pad, -6, 0]], M.steel, 0.32, 0.8));
      });
      const low = (-20.4 * Math.PI) / 180;
      const high = (200.4 * Math.PI) / 180;
      const ring = Array.from({ length: 33 }, (_, index) => low + ((high - low) * index) / 32).map((a) => [4.6 * Math.cos(a), -13.2 - 4.6 * Math.sin(a)] as [number, number]);
      prism(polygon(ring), 4, 10, M.black, 0.3);
      for (const z of [11.6, 10, 8.4]) {
        const mark = new THREE.BoxGeometry(5.2, 0.05, 0.35);
        mark.translate(0, -11.6 + 0.03, z);
        add(mark, M.white, { edges: false });
      }
      break;
    }
    case "ldr": {
      [-1, 1].forEach((side, index) => term(index, () => lead([[2.6 * side, -11, 0], [2.6 * side, -11, 2.4], [2.2 * side, -12.6, 4.1]], M.steel, 0.3, 0.8)));
      const r = 5.4;
      cylinder(0, CY, r, 4, 2, M.ceramic, 56);
      const edge = 3.2;
      const reach = Math.sqrt(r * r - edge * edge);
      strip([-reach + 0.3, CY - edge], [reach - 0.3, CY - edge], 0.7, 6, 0.06, M.solder);
      strip([-reach + 0.3, CY + edge], [reach - 0.3, CY + edge], 0.7, 6, 0.06, M.solder);
      const track = Array.from({ length: 9 }, (_, index) => [-3.2 + index * 0.8, CY + (index % 2 ? edge : -edge)] as [number, number]);
      for (let index = 1; index < track.length; index++) strip(track[index - 1], track[index], 0.42, 6, 0.05, M.track);
      break;
    }
    case "ultrasonic": {
      for (const x of [-19, 19]) cylinder(x, -28, 1.6, 0, 2.6, M.black, 20);
      slab({ x: -6.5, y: -12.2, w: 13, d: 2.6, r: 0.3 }, 0, 2.6, M.black, 0.2);
      const pcb = { x: -22, y: -31, w: 44, d: 21, r: 1 };
      slab(pcb, 2.6, 1.4, M.pcb, 0.3);
      for (const [x, y] of [[pcb.x + 2.4, pcb.y + 2.4], [pcb.x + pcb.w - 2.4, pcb.y + 2.4], [pcb.x + 2.4, pcb.y + pcb.d - 2.4], [pcb.x + pcb.w - 2.4, pcb.y + pcb.d - 2.4]] as Array<[number, number]>) {
        cylinder(x, y, 1.2, 4, 0.06, M.solder, 20, false);
        cylinder(x, y, 0.6, 4.06, 0.04, M.hole, 16, false);
      }
      slab({ x: -4, y: -29.6, w: 8, d: 3.2, r: 1.6 }, 4, 3, M.steel, 0.3);
      for (const x of [-11, 11]) {
        cylinder(x, -19.5, 8, 4, 11.5, M.steel, 64);
        cylinder(x, -19.5, 6.6, 15.5, 0.08, M.hole, 48, false);
        const mesh = new THREE.CircleGeometry(6.1, 48);
        mesh.translate(x, -19.5, 15.6);
        add(mesh, new THREE.MeshStandardMaterial({ color: "#6b6e74", roughness: 0.9, metalness: 0.3, wireframe: true }), { edges: false });
      }
      [-4.5, -1.5, 1.5, 4.5].forEach((x, index) => term(index, () => lead([[x, -9.6, 1.3], [x, -7.2, 1.3], [x, -6, 0]], M.solder, 0.32, 0.8)));
      break;
    }
    default:
      throw new Error(`No model for component type "${spec.type}"`);
  }

  // The terminal block ----------------------------------------------------------------

  const count = ids.length;
  const plan: Plan = { x: -(count * PITCH) / 2, y: BLOCK_Y, w: count * PITCH, d: BLOCK_D, r: 1 };
  slab(plan, 0, STEP_Z, M.plastic, 0.4);
  slab({ ...plan, d: TOWER_D }, STEP_Z, TOWER_Z - STEP_Z, M.plastic, 0.4);
  const front = BLOCK_Y + BLOCK_D;
  ids.forEach((id, index) =>
    within(id, () => {
      const cx = cellX(index, count);
      const sy = BLOCK_Y + TOWER_D / 2;
      const area = new THREE.BoxGeometry(PITCH, BLOCK_D, TOWER_Z);
      area.translate(cx, BLOCK_Y + BLOCK_D / 2, TOWER_Z / 2);
      add(area, M.hit, { edges: false });
      cylinder(cx, sy, 3.6, TOWER_Z, 0.05, M.hole, 32, false);
      cylinder(cx, sy, 2.7, TOWER_Z, 0.7, M.steel, 32);
      const slot = Math.PI / 4;
      strip([cx - 2.2 * Math.cos(slot), sy - 2.2 * Math.sin(slot)], [cx + 2.2 * Math.cos(slot), sy + 2.2 * Math.sin(slot)], 0.5, TOWER_Z + 0.7, 0.05, M.hole);
      const opening = new THREE.BoxGeometry(6.8, 0.6, 4);
      opening.translate(cx, front - 0.27, 3.4);
      add(opening, M.hole, { edges: false });
      label(id, cx, BLOCK_Y + TOWER_D + 3.6, STEP_Z, id.length > 2 ? 2.6 : 3.6);
    }),
  );

  return {
    root,
    terminals,
    dispose() {
      for (const item of disposables) item.dispose();
    },
  };
}
