"use client";

import * as React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BOARD, BOARD_T, CY, STANDOFF_H } from "@/components/simulador/layout";
import { buildBreadboard } from "./breadboard";
import { buildModel, type Built, type ModelSpec, type Mount, type Palette } from "./model";

// The playground canvas is 960 × 560; its centre is the table's origin and its units shrink to board units.
const CANVAS_W = 960;
const CANVAS_H = 560;
const SCALE = 0.75;
const FLOOR = -BOARD_T - STANDOFF_H;
const TOP = 45;
const AZIMUTH = (76 * Math.PI) / 180;
const ELEVATION = (48 * Math.PI) / 180;
const PALETTE: Palette = { dark: true, ink: "#c9d3e6", faint: "#3a4a66", accent: "#1f8fff" };
// Jumper colours that read on a dark table; no black.
const WIRE_COLOURS = ["#e5484d", "#1f8fff", "#e8ecf4", "#f2c230", "#33c27a", "#ff8a3d"];

export interface TerminalRef {
  componentId: string;
  terminalId: string;
}

// One part of the playground: its model, where it sits on the 2D canvas, and whether it is lit.
export interface Placed {
  spec: ModelSpec;
  x: number;
  y: number;
  glow: boolean;
}

export interface Jumper {
  id: string;
  from: TerminalRef;
  to: TerminalRef;
  live: boolean;
  color?: string;
}

export interface Circuit3DProps {
  parts: Placed[];
  wires: Jumper[];
  mount: Mount;
  selectedIds: readonly string[];
  pending: TerminalRef | null;
  onSelect(id: string, extend: boolean): void;
  onTerminal(ref: TerminalRef): void;
  onRemoveWire(id: string): void;
  // hands over a way to turn a screen point into playground canvas units, or null when the view goes
  onLocator?(locate: Locate | null): void;
}

// A screen point to playground canvas units, through the table; null off the view.
export type Locate = (clientX: number, clientY: number) => [number, number] | null;

interface Slot {
  key: string;
  group: THREE.Group;
  built: Built;
  // how far the model rises or sinks so that what it stands on rests on the table
  lift: number;
  mark: THREE.Mesh;
  epoxy: THREE.MeshStandardMaterial[];
  light: THREE.PointLight | null;
}

const toTable = (x: number, y: number) => new THREE.Vector3((x - CANVAS_W / 2) * SCALE, 0, (y - CANVAS_H / 2) * SCALE);

function roundedRect(w: number, d: number, r: number) {
  const shape = new THREE.Shape();
  const [x, y] = [-w / 2, -d / 2];
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
}

// The whole circuit on one table: every part on its own board, jumper wires between terminal blocks.
class Table {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 12 / 7, 1, 6000);
  private controls: OrbitControls;
  private slots = new Map<string, Slot>();
  private wires = new THREE.Group();
  private accent = new THREE.Color(PALETTE.accent);
  private originals = new Map<THREE.MeshStandardMaterial, [THREE.Color, THREE.Color, number]>();
  private markMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.22, depthWrite: false });
  private disposables: Array<{ dispose(): void }> = [this.markMaterial];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private raf = 0;
  private dirty = 1;
  private down: [number, number] | null = null;
  private wireKey = "";
  private hovered: TerminalRef | null = null;
  private pending: TerminalRef | null = null;
  private framed = "";
  private still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(
    private host: HTMLElement,
    private props: () => Circuit3DProps,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    host.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.HemisphereLight("#dfe9ff", "#10141c", 1.3));
    const sun = new THREE.DirectionalLight("#ffffff", 2.4);
    sun.position.set(-160, 380, 190);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -460;
    sun.shadow.camera.right = 460;
    sun.shadow.camera.top = 460;
    sun.shadow.camera.bottom = -460;
    sun.shadow.camera.far = 1200;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight("#ffffff", 0.5);
    fill.position.set(220, 110, 160);
    this.scene.add(fill);

    // The table: the 2D dot grid becomes a faint line grid, with one shadow catcher for every board.
    const grid = new THREE.GridHelper(CANVAS_W * SCALE * 1.5, 60, "#1f3358", "#152033");
    grid.position.y = FLOOR - 0.05;
    this.disposables.push(grid.geometry, grid.material as THREE.Material);
    this.scene.add(grid);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.5 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = FLOOR - 0.01;
    ground.receiveShadow = true;
    this.disposables.push(ground.geometry, ground.material);
    this.scene.add(ground, this.wires);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.screenSpacePanning = false;
    this.controls.enableZoom = false;
    this.controls.enableDamping = !this.still;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 60;
    this.controls.maxDistance = 2400;
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
    this.controls.addEventListener("change", () => this.invalidate());
    const direction = new THREE.Vector3(Math.cos(ELEVATION) * Math.cos(AZIMUTH), Math.sin(ELEVATION), Math.cos(ELEVATION) * Math.sin(AZIMUTH));
    this.camera.position.copy(direction);

    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointerdown", this.press, true);
    canvas.addEventListener("pointerup", this.release);
    canvas.addEventListener("pointermove", this.hover);
    canvas.addEventListener("pointerleave", this.leave);
    // The wheel scrolls the page; with Ctrl or ⌘ held it zooms. Capture runs before the controls' own listener.
    host.addEventListener("wheel", this.wheel, { capture: true, passive: true });
    this.resize();
    this.fit();
  }

  update({ parts, wires, mount, selectedIds, pending }: Circuit3DProps) {
    this.restore();
    const seen = new Set<string>();
    for (const part of parts) {
      const id = part.spec.id;
      seen.add(id);
      const key = JSON.stringify([mount, part.spec.type, part.spec.terminals.map((terminal) => terminal.id), part.spec.properties]);
      let slot = this.slots.get(id);
      if (slot && slot.key !== key) {
        this.drop(id);
        slot = undefined;
      }
      slot ??= this.place(part.spec, mount, key);
      slot.group.position.copy(toTable(part.x, part.y)).setY(slot.lift);
      slot.mark.visible = selectedIds.includes(id);
      for (const material of slot.epoxy) material.emissiveIntensity = part.glow ? 2.6 : 0.35;
      // Dimmed, never hidden: toggling a light's visibility would recompile every material.
      if (slot.light) slot.light.intensity = part.glow ? 70 : 0;
    }
    for (const id of [...this.slots.keys()]) if (!seen.has(id)) this.drop(id);
    const wireKey = JSON.stringify(wires.map(wire => [
      wire.id, wire.from, wire.to, wire.live,
      this.slots.get(wire.from.componentId)?.group.position.toArray(),
      this.slots.get(wire.to.componentId)?.group.position.toArray(),
    ]));
    if (wireKey !== this.wireKey) {
      this.wireKey = wireKey;
      this.lay(wires);
    }
    this.pending = pending;
    this.paint();
    // Reframe when parts come or go or change mount, keeping the turn the user gave the table.
    const framed = [mount, ...[...seen].sort()].join(" ");
    if (framed !== this.framed) {
      this.framed = framed;
      this.fit();
    }
    this.invalidate();
  }

  private place(spec: ModelSpec, mount: Mount, key: string): Slot {
    // The protoboard is what the parts get wired through, the same however they are mounted.
    const built = spec.type === "breadboard" ? buildBreadboard(PALETTE, SCALE) : buildModel(spec, PALETTE, mount);
    // Each model brings its own shadow catcher; the table has one for all of them.
    for (const child of built.root.children) if (child.userData.ground) child.visible = false;
    const group = new THREE.Group();
    group.userData.part = spec.id;
    group.add(built.root);
    // The model's z is the scene's y and its y the scene's z; whatever it stands on rests on the table.
    const { min, max } = built.extent;
    const w = max.x - min.x + 10;
    const d = max.y - min.y + 10;
    const mark = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(w, d, Math.min(7, w / 4, d / 4))), this.markMaterial);
    mark.rotation.x = -Math.PI / 2;
    mark.position.set((min.x + max.x) / 2, min.z + 0.05, (min.y + max.y) / 2);
    mark.raycast = () => {};
    group.add(mark);

    const epoxy: THREE.MeshStandardMaterial[] = [];
    let light: THREE.PointLight | null = null;
    if (spec.type === "led") {
      built.root.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial && object.material.transparent) epoxy.push(object.material);
      });
      light = new THREE.PointLight(epoxy[0]?.color ?? "#e5484d", 0, 80, 1);
      light.position.set(0, CY, 12);
      built.root.add(light);
    }

    this.scene.add(group);
    const slot = { key, group, built, lift: FLOOR - min.z, mark, epoxy, light };
    this.slots.set(spec.id, slot);
    return slot;
  }

  private drop(id: string) {
    const slot = this.slots.get(id);
    if (!slot) return;
    this.scene.remove(slot.group);
    slot.built.dispose();
    slot.mark.geometry.dispose();
    slot.light?.dispose();
    this.slots.delete(id);
  }

  // Where a jumper takes hold of a terminal (a terminal block's opening, a loose lead's tip, a protoboard hole)
  // and which way it leaves: out of the front and up, unless the model says otherwise.
  private socket({ componentId, terminalId }: TerminalRef) {
    const slot = this.slots.get(componentId);
    const end = slot?.built.ends.get(terminalId);
    if (!slot || !end) return null;
    const exit = slot.built.exit;
    return {
      at: new THREE.Vector3(end.x, end.z, end.y).add(slot.group.position),
      out: exit ? new THREE.Vector3(exit.x, exit.z, exit.y) : new THREE.Vector3(0, 4, 7),
      upright: Boolean(exit),
    };
  }

  private lay(wires: Jumper[]) {
    for (const child of [...this.wires.children]) {
      if (!(child instanceof THREE.Mesh)) continue;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      this.wires.remove(child);
    }
    for (const wire of wires) {
      const from = this.socket(wire.from);
      const to = this.socket(wire.to);
      if (!from || !to) continue;
      const [a, b] = [from.at, to.at];
      // Out of each end, then one arch over whatever stands between them; hole to hole, a low bridge like a jumper on a real board.
      const lift = from.upright && to.upright ? new THREE.Vector3(0, 2 + a.distanceTo(b) * 0.12, 0) : new THREE.Vector3(0, 26 + a.distanceTo(b) * 0.22, 12);
      const a1 = a.clone().add(from.out);
      const b1 = b.clone().add(to.out);
      const path = new THREE.CurvePath<THREE.Vector3>();
      path.add(new THREE.LineCurve3(a, a1));
      path.add(new THREE.CubicBezierCurve3(a1, a1.clone().add(lift), b1.clone().add(lift), b1));
      path.add(new THREE.LineCurve3(b1, b));
      const colour = wire.color ?? WIRE_COLOURS[(Number(wire.id.replace(/\D/g, "")) || 0) % WIRE_COLOURS.length];
      const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.5, emissive: colour, emissiveIntensity: wire.live ? 0.55 : 0 });
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 32, 1.05, 6, false), material);
      mesh.castShadow = true;
      mesh.userData.wire = wire.id;
      this.wires.add(mesh);
    }
  }

  private restore() {
    for (const [material, [color, emissive, intensity]] of this.originals) {
      material.color.copy(color);
      material.emissive.copy(emissive);
      material.emissiveIntensity = intensity;
    }
    this.originals.clear();
  }

  // The pending terminal and the one under the pointer, painted in the accent.
  private paint() {
    this.restore();
    const marks: Array<[TerminalRef, number]> = [];
    if (this.pending) marks.push([this.pending, 0.6]);
    if (this.hovered) marks.push([this.hovered, 0.35]);
    for (const [id, slot] of this.slots) slot.built.tint?.(marks.filter(([ref]) => ref.componentId === id).map(([ref, strength]) => [ref.terminalId, strength]));
    for (const [ref, strength] of marks) {
      for (const object of this.slots.get(ref.componentId)?.built.terminals.get(ref.terminalId) ?? []) {
        if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) continue;
        const material = object.material;
        if (!this.originals.has(material)) this.originals.set(material, [material.color.clone(), material.emissive.clone(), material.emissiveIntensity]);
        material.color.copy(this.accent);
        material.emissive.copy(this.accent);
        material.emissiveIntensity = strength;
      }
    }
  }

  // Frames every part (or the whole canvas when it is empty) from the current direction.
  private fit() {
    const box = new THREE.Box3();
    for (const slot of this.slots.values()) {
      const { x, z } = slot.group.position;
      const { min, max } = slot.built.extent;
      box.expandByPoint(new THREE.Vector3(x + min.x, FLOOR, z + min.y));
      box.expandByPoint(new THREE.Vector3(x + max.x, FLOOR + max.z - min.z, z + max.y));
    }
    if (box.isEmpty()) {
      box.expandByPoint(toTable(80, 90).add(new THREE.Vector3(BOARD.x, FLOOR, BOARD.y)));
      box.expandByPoint(toTable(880, 470).add(new THREE.Vector3(BOARD.x + BOARD.w, TOP, BOARD.y + BOARD.d)));
    }
    const center = box.getCenter(new THREE.Vector3());
    // A lone part shouldn't fill the whole view.
    box.expandByVector(new THREE.Vector3(Math.max(0, 110 - box.max.x + center.x), 0, Math.max(0, 80 - box.max.z + center.z)));
    const corners = [box.min, box.max].flatMap((p) => [box.min.x, box.max.x].flatMap((x) => [box.min.z, box.max.z].map((z) => new THREE.Vector3(x, p.y, z))));
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    let distance = 80;
    for (let step = 0; step < 120; step++) {
      this.camera.position.copy(center).addScaledVector(direction, distance);
      this.camera.lookAt(center);
      this.camera.updateMatrixWorld();
      const fits = corners.every((corner) => {
        const p = corner.clone().project(this.camera);
        return Math.abs(p.x) < 0.9 && Math.abs(p.y) < 0.86 && p.z < 1;
      });
      if (fits) break;
      distance *= 1.05;
    }
    this.controls.target.copy(center);
    this.controls.update();
    this.invalidate();
  }

  locate: Locate = (clientX, clientY) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR), new THREE.Vector3());
    return hit ? [hit.x / SCALE + CANVAS_W / 2, hit.z / SCALE + CANVAS_H / 2] : null;
  };

  private pick(event: PointerEvent): { wire: string } | { part: string; terminal?: string } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = [this.wires, ...[...this.slots.values()].map((slot) => slot.group)];
    const hit = this.raycaster.intersectObjects(targets, true).find((item) => item.object.type === "Mesh" && item.object.visible);
    if (!hit) return null;
    if (hit.object.userData.wire) return { wire: hit.object.userData.wire as string };
    let object: THREE.Object3D | null = hit.object;
    while (object && !object.userData.part) object = object.parent;
    if (!object) return null;
    // An instanced target (the protoboard's holes) names its terminal per instance.
    const instances = hit.object.userData.instances as string[] | undefined;
    const terminal = (hit.object.userData.terminal ?? (hit.instanceId === undefined ? undefined : instances?.[hit.instanceId])) as string | undefined;
    return { part: object.userData.part as string, terminal };
  }

  private wheel = (event: WheelEvent) => {
    this.controls.enableZoom = event.ctrlKey || event.metaKey;
  };

  private press = (event: PointerEvent) => {
    this.down = [event.clientX, event.clientY];
  };

  // A click is a press and release that barely moved; anything longer was a turn of the table.
  private release = (event: PointerEvent) => {
    const down = this.down;
    this.down = null;
    if (!down || event.button !== 0 || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return;
    const hit = this.pick(event);
    if (!hit) return;
    const props = this.props();
    if ("wire" in hit) props.onRemoveWire(hit.wire);
    else if (hit.terminal) props.onTerminal({ componentId: hit.part, terminalId: hit.terminal });
    else props.onSelect(hit.part, event.shiftKey);
  };

  private hover = (event: PointerEvent) => {
    if (event.buttons) return;
    const hit = this.pick(event);
    const terminal = hit && "part" in hit && hit.terminal ? { componentId: hit.part, terminalId: hit.terminal } : null;
    this.renderer.domElement.style.cursor = terminal ? "crosshair" : hit ? "pointer" : "";
    if (terminal?.componentId === this.hovered?.componentId && terminal?.terminalId === this.hovered?.terminalId) return;
    this.hovered = terminal;
    this.paint();
    this.invalidate();
  };

  private leave = () => {
    if (!this.hovered) return;
    this.hovered = null;
    this.paint();
    this.invalidate();
  };

  resize() {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  private invalidate() {
    this.dirty = 1;
    this.run();
  }

  private run() {
    if (this.raf) return;
    const step = () => {
      const moving = this.controls.update();
      if (moving || this.dirty > 0) {
        this.renderer.render(this.scene, this.camera);
        this.dirty = Math.max(0, this.dirty - 1);
      }
      this.raf = moving || this.dirty > 0 ? requestAnimationFrame(step) : 0;
    };
    this.raf = requestAnimationFrame(step);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.controls.dispose();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.press, true);
    canvas.removeEventListener("pointerup", this.release);
    canvas.removeEventListener("pointermove", this.hover);
    canvas.removeEventListener("pointerleave", this.leave);
    this.host.removeEventListener("wheel", this.wheel, { capture: true });
    for (const id of [...this.slots.keys()]) this.drop(id);
    this.lay([]);
    for (const item of this.disposables) item.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }
}

export default function Circuit3D(props: Circuit3DProps) {
  const host = React.useRef<HTMLDivElement>(null);
  const note = React.useRef<HTMLParagraphElement>(null);
  const table = React.useRef<Table | null>(null);
  const latest = React.useRef(props);
  const { parts, wires, mount, selectedIds, pending } = props;

  // The table calls back through the latest props, so its handlers never see stale state.
  React.useEffect(() => {
    latest.current = props;
  });

  React.useEffect(() => {
    const element = host.current;
    if (!element) return;
    let instance: Table;
    try {
      instance = new Table(element, () => latest.current);
    } catch {
      if (note.current) note.current.hidden = false;
      return;
    }
    table.current = instance;
    instance.update(latest.current);
    latest.current.onLocator?.(instance.locate);
    const resize = new ResizeObserver(() => instance.resize());
    resize.observe(element);
    return () => {
      latest.current.onLocator?.(null);
      resize.disconnect();
      instance.destroy();
      table.current = null;
    };
  }, []);

  React.useEffect(() => {
    table.current?.update({ ...latest.current, parts, wires, mount, selectedIds, pending });
  }, [parts, wires, mount, selectedIds, pending]);

  return (
    <div
      ref={host}
      className="circuit-3d"
      role="group"
      aria-label="Vista 3D del circuito: arrastra para girar, clic derecho para desplazar y Ctrl o ⌘ con la rueda para acercar. Haz clic en dos terminales para conectarlas."
    >
      <p ref={note} className="circuit-3d-note" hidden>Este navegador no pudo crear un contexto WebGL.</p>
    </div>
  );
}
