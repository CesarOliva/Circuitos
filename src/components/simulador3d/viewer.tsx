"use client";

import * as React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Spec } from "@/components/simulador/catalog";
import { useReadout } from "@/components/iso/react/live";
import { buildModel, type Mount, type Palette } from "./model";
import { isDarkTheme, watchTheme } from "./theme";
import type { Cues } from "@/components/simulador/faults";

const ASPECT = 300 / 420;
const AZIMUTH = (40 * Math.PI) / 180;
const ELEVATION = (32 * Math.PI) / 180;
const IDLE_MS = 4000;

function paletteOf(element: Element): Palette {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    dark: isDarkTheme(),
    ink: read("--anatomy-hi", "#c9d3e6"),
    faint: read("--anatomy-lo", "#283650"),
    accent: "#1f8fff",
  };
}

// One WebGL view of one component: built when the card nears the screen, released when it leaves.
class View {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1 / ASPECT, 1, 2000);
  private controls: OrbitControls;
  private model: ReturnType<typeof buildModel>;
  private accent: THREE.Color;
  private originals = new Map<THREE.MeshStandardMaterial, [THREE.Color, THREE.Color, number]>();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private frame = 0;
  private idle = 0;
  private dirty = 1;
  private lit: string | null = null;
  private still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(
    private host: HTMLElement,
    spec: Spec,
    mount: Mount,
    palette: Palette,
    private onHover: (id: string | null) => void,
    cues: Cues | undefined,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = palette.dark ? 1.05 : 1.15;
    this.renderer.domElement.className = "sim-canvas";
    host.appendChild(this.renderer.domElement);

    this.model = buildModel(spec, palette, mount, cues);
    this.scene.add(this.model.root);
    this.accent = new THREE.Color(palette.accent);

    this.scene.add(new THREE.HemisphereLight("#ffffff", palette.dark ? "#1a1a1c" : "#b9b7b0", palette.dark ? 1.1 : 1.4));
    const sun = new THREE.DirectionalLight("#ffffff", palette.dark ? 2.2 : 2.4);
    sun.position.set(-60, 140, 70);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -90;
    sun.shadow.camera.right = 90;
    sun.shadow.camera.top = 90;
    sun.shadow.camera.bottom = -90;
    sun.shadow.camera.far = 400;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight("#ffffff", 0.5);
    fill.position.set(80, 40, 60);
    this.scene.add(fill);

    // Frame the board the way the card frames it: azimuth 40°, a little above 30°. The shadow catcher doesn't count.
    this.model.root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    for (const child of this.model.root.children) if (!child.userData.ground) box.expandByObject(child);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    // The card is wider than tall and the board is flat, so the width is what has to fit, at any turn.
    const across = Math.atan(Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) / ASPECT);
    const distance = (sphere.radius / Math.sin(across)) * 1.06;
    const direction = new THREE.Vector3(Math.cos(ELEVATION) * Math.cos(AZIMUTH), Math.sin(ELEVATION), Math.cos(ELEVATION) * Math.sin(AZIMUTH));
    this.camera.position.copy(sphere.center).addScaledVector(direction, distance);
    this.camera.lookAt(sphere.center);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(sphere.center);
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.minDistance = distance * 0.35;
    this.controls.maxDistance = distance * 1.4;
    this.controls.enableDamping = !this.still;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
    this.controls.autoRotate = !this.still;
    this.controls.autoRotateSpeed = 0.9;
    this.controls.addEventListener("change", () => (this.dirty = Math.max(this.dirty, 1)));
    this.controls.addEventListener("start", () => {
      this.controls.autoRotate = false;
      clearTimeout(this.idle);
    });
    this.controls.addEventListener("end", () => {
      clearTimeout(this.idle);
      if (!this.still) this.idle = window.setTimeout(() => ((this.controls.autoRotate = true), this.run()), IDLE_MS);
    });
    this.controls.update();

    this.renderer.domElement.addEventListener("pointermove", this.hover);
    this.renderer.domElement.addEventListener("pointerleave", this.leave);
    // The wheel scrolls the page; with Ctrl or ⌘ held it zooms. Capture runs before the controls' own listener.
    host.addEventListener("wheel", this.wheel, { capture: true, passive: true });
    this.resize();
  }

  private wheel = (event: WheelEvent) => {
    this.controls.enableZoom = event.ctrlKey || event.metaKey;
  };

  private hover = (event: PointerEvent) => {
    if (event.buttons) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.model.root, true).find((item) => item.object.type === "Mesh");
    this.onHover((hit?.object.userData.terminal as string | undefined) ?? null);
  };

  private leave = () => this.onHover(null);

  // Paints one terminal's pad, trace, leads and block cell in the accent; null restores them.
  // Only colour uniforms change (each terminal mesh owns its material), so the very next frame is right.
  light(id: string | null) {
    if (id === this.lit) return;
    for (const [material, [color, emissive, intensity]] of this.originals) {
      material.color.copy(color);
      material.emissive.copy(emissive);
      material.emissiveIntensity = intensity;
    }
    this.originals.clear();
    this.lit = id;
    for (const object of id ? this.model.terminals.get(id) ?? [] : []) {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) continue;
      const material = object.material;
      if (this.originals.has(material)) continue;
      this.originals.set(material, [material.color.clone(), material.emissive.clone(), material.emissiveIntensity]);
      material.color.copy(this.accent);
      material.emissive.copy(this.accent);
      material.emissiveIntensity = 0.45;
    }
    this.invalidate();
  }

  resize() {
    const width = this.host.clientWidth;
    if (!width) return;
    this.renderer.setSize(width, Math.round(width * ASPECT), false);
    this.invalidate();
  }

  private invalidate() {
    this.dirty = 1;
    this.run();
  }

  run() {
    if (this.frame) return;
    const step = () => {
      const moving = this.controls.update();
      if (moving || this.dirty > 0) {
        this.renderer.render(this.scene, this.camera);
        this.dirty = Math.max(0, this.dirty - 1);
      }
      this.frame = this.controls.autoRotate || moving || this.dirty > 0 ? requestAnimationFrame(step) : 0;
    };
    this.frame = requestAnimationFrame(step);
  }

  pause() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  destroy() {
    this.pause();
    clearTimeout(this.idle);
    this.controls.dispose();
    this.renderer.domElement.removeEventListener("pointermove", this.hover);
    this.renderer.domElement.removeEventListener("pointerleave", this.leave);
    this.host.removeEventListener("wheel", this.wheel, { capture: true });
    this.model.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}

export function Viewer3D({ spec, idle, mount = "board", cues }: { spec: Spec; idle: string; mount?: Mount; cues?: Cues }) {
  const { anchor, say } = useReadout<HTMLDivElement>();
  const host = React.useRef<HTMLDivElement>(null);
  const view = React.useRef<View | null>(null);
  const [lit, setLit] = React.useState<number | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const element = host.current;
    if (!element) return;
    let visible = false;
    const release = () => {
      view.current?.destroy();
      view.current = null;
    };
    const create = () => {
      if (view.current) return;
      try {
        view.current = new View(element, spec, mount, paletteOf(element), (id) => setLit(id === null ? null : spec.terminals.findIndex((terminal) => terminal.id === id)), cues);
        view.current.run();
      } catch {
        setFailed(true);
      }
    };
    // Build while near the screen, render only while on it, release WebGL contexts far away.
    const near = new IntersectionObserver(([entry]) => (entry.isIntersecting ? create() : release()), { rootMargin: "600px 0px" });
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) view.current?.run();
      else view.current?.pause();
    });
    near.observe(element);
    onScreen.observe(element);
    const resize = new ResizeObserver(() => view.current?.resize());
    resize.observe(element);
    const rebuild = () => {
      release();
      create();
    };
    const unwatch = watchTheme(rebuild);
    return () => {
      near.disconnect();
      onScreen.disconnect();
      resize.disconnect();
      unwatch();
      release();
    };
  }, [spec, mount, cues]);

  React.useEffect(() => {
    view.current?.light(lit === null ? null : spec.terminals[lit].id);
    say(lit === null ? idle : spec.terminals[lit].text);
  }, [lit, spec, idle, say]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const count = spec.terminals.length;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") setLit((current) => (current === null ? 0 : (current + 1) % count));
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") setLit((current) => (current === null ? count - 1 : (current + count - 1) % count));
    else if (event.key === "Escape") setLit(null);
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={anchor}
      className="iso-stage sim-stage sim-3d"
      tabIndex={0}
      role="group"
      aria-label={`${spec.title} en 3D: arrastra para girarlo; las flechas recorren sus ${spec.terminals.length} terminales`}
      onKeyDown={onKeyDown}
      onBlur={() => setLit(null)}
    >
      <div ref={host} className="sim-canvas-host">
        {failed ? <p className="sim-fallback">Este navegador no pudo crear un contexto WebGL.</p> : null}
      </div>
    </div>
  );
}
