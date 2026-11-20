import * as THREE from "three";
import { BB_COLUMNS, BB_H, BB_HOLES, BB_HOLE, BB_LABEL_X, BB_LETTERS, BB_NUMBER_Y, BB_PITCH, BB_RAIL_LINES, BB_STRIPS, BB_W, bbX, bbY } from "@/components/breadboard";
import type { Built, Palette } from "./model";

// The body's thickness and the holes' size, in model units.
const HEIGHT = 10;
const HOLE = 3.2;
const HOLE_DEPTH = 1.6;
// Printing on the top face, in texture pixels per canvas unit.
const PRINT = 5;
const INK = "#5d6066";
const RED = "#d8433f";
const BLUE = "#2c6fd1";

// The playground's protoboard: a white plastic block, its face printed like the 2D card's, one hole per terminal.
// It keeps buildModel's conventions (x and y on the board, z up, mirrored root) so the table can place it like any part;
// `scale` turns the shared canvas layout into model units.
export function buildBreadboard(palette: Palette, scale: number): Built {
  const root = new THREE.Group();
  root.scale.y = -1;
  root.rotation.x = -Math.PI / 2;
  const disposables: Array<{ dispose(): void }> = [];
  const own = <T extends { dispose(): void }>(item: T) => (disposables.push(item), item);
  const w = BB_W * scale;
  const d = BB_H * scale;

  // The block, its corners rounded and its edges eased.
  const bevel = 0.8;
  const r = 4 - bevel;
  const [x, y, bw, bd] = [-w / 2 + bevel, -d / 2 + bevel, w - 2 * bevel, d - 2 * bevel];
  const outline = new THREE.Shape();
  outline.moveTo(x + r, y);
  outline.lineTo(x + bw - r, y);
  outline.quadraticCurveTo(x + bw, y, x + bw, y + r);
  outline.lineTo(x + bw, y + bd - r);
  outline.quadraticCurveTo(x + bw, y + bd, x + bw - r, y + bd);
  outline.lineTo(x + r, y + bd);
  outline.quadraticCurveTo(x, y + bd, x, y + bd - r);
  outline.lineTo(x, y + r);
  outline.quadraticCurveTo(x, y, x + r, y);
  const shell = own(new THREE.ExtrudeGeometry(outline, { depth: HEIGHT - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 }));
  shell.translate(0, 0, bevel);
  // White plastic in every theme, like the real one.
  const body = new THREE.Mesh(shell, own(new THREE.MeshStandardMaterial({ color: "#f2f1ec", roughness: 0.6 })));
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // The face: channel, rail lines, numbers and letters, drawn once onto a texture laid over the top.
  const canvas = document.createElement("canvas");
  canvas.width = BB_W * PRINT;
  canvas.height = BB_H * PRINT;
  const context = canvas.getContext("2d")!;
  context.scale(PRINT, PRINT);
  context.translate(BB_W / 2, BB_H / 2);
  const channel = context.createLinearGradient(0, -4, 0, 4);
  channel.addColorStop(0, "rgb(0 0 0 / 30%)");
  channel.addColorStop(0.5, "rgb(0 0 0 / 12%)");
  channel.addColorStop(1, "rgb(255 255 255 / 0%)");
  context.fillStyle = channel;
  context.fillRect(-BB_W / 2, -4, BB_W, 8);
  const span = [bbX(1) - BB_PITCH * 0.6, bbX(BB_COLUMNS) + BB_PITCH * 0.6];
  context.lineWidth = 1.3;
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (const line of BB_RAIL_LINES) {
    context.strokeStyle = context.fillStyle = line.sign === "+" ? RED : BLUE;
    context.beginPath();
    context.moveTo(span[0], line.y);
    context.lineTo(span[1], line.y);
    context.stroke();
    context.font = "700 9px Arial, sans-serif";
    for (const side of [-1, 1]) context.fillText(line.sign === "+" ? "+" : "−", side * BB_LABEL_X, line.y);
  }
  context.fillStyle = INK;
  context.font = "600 6.5px ui-monospace, Menlo, Consolas, monospace";
  for (let column = 1; column <= BB_COLUMNS; column++) {
    if (column !== 1 && column % 5) continue;
    for (const side of [-1, 1]) context.fillText(String(column), bbX(column), side * BB_NUMBER_Y);
  }
  for (const letter of BB_LETTERS) for (const side of [-1, 1]) context.fillText(letter, side * BB_LABEL_X, bbY(letter));
  const texture = own(new THREE.CanvasTexture(canvas));
  // the root's mirror flips the plane's v axis, so the canvas goes in unflipped
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const face = own(new THREE.PlaneGeometry(w, d));
  face.translate(0, 0, HEIGHT + 0.01);
  const print = new THREE.Mesh(face, own(new THREE.MeshStandardMaterial({ map: texture, transparent: true, depthWrite: false, roughness: 0.62 })));
  print.receiveShadow = true;
  print.raycast = () => {};
  root.add(print);

  // The holes, one instance each, so a hole and its strip can light up on their own.
  const pocket = own(new THREE.BoxGeometry(HOLE, HOLE, HOLE_DEPTH));
  pocket.translate(0, 0, HEIGHT - HOLE_DEPTH / 2 + 0.02);
  const holes = new THREE.InstancedMesh(pocket, own(new THREE.MeshBasicMaterial({ color: "#ffffff" })), BB_HOLES.length);
  holes.raycast = () => {};
  // Wide invisible targets over every hole, for the pointer.
  const cell = own(new THREE.BoxGeometry(BB_PITCH * scale * 0.94, BB_PITCH * scale * 0.94, 1.2));
  cell.translate(0, 0, HEIGHT + 0.6);
  const targets = new THREE.InstancedMesh(cell, own(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })), BB_HOLES.length);
  targets.userData.instances = BB_HOLES.map(hole => hole.id);
  const place = new THREE.Matrix4();
  const base = new THREE.Color("#1b1c20");
  const ends = new Map<string, THREE.Vector3>();
  for (const hole of BB_HOLES) {
    place.makeTranslation(hole.x * scale, hole.y * scale, 0);
    holes.setMatrixAt(hole.index, place);
    targets.setMatrixAt(hole.index, place);
    holes.setColorAt(hole.index, base);
    // A jumper goes down into the hole.
    ends.set(hole.id, new THREE.Vector3(hole.x * scale, hole.y * scale, HEIGHT - 1.4));
  }
  root.add(holes, targets);

  const accent = new THREE.Color(palette.accent);
  const bright = accent.clone().lerp(new THREE.Color("#ffffff"), 0.35);
  const colour = new THREE.Color();
  shell.computeBoundingBox();

  return {
    root,
    terminals: new Map(),
    ends,
    exit: new THREE.Vector3(0, 0, 9),
    extent: shell.boundingBox!.clone(),
    // The marked holes in the accent, and every hole joined to them a little less.
    tint(marks) {
      for (const hole of BB_HOLES) holes.setColorAt(hole.index, base);
      for (const [id, strength] of marks) {
        const hole = BB_HOLE.get(id);
        if (!hole) continue;
        for (const mate of BB_STRIPS[hole.strip]) holes.setColorAt(BB_HOLE.get(mate)!.index, colour.copy(base).lerp(accent, strength));
      }
      for (const [id] of marks) {
        const hole = BB_HOLE.get(id);
        if (hole) holes.setColorAt(hole.index, bright);
      }
      holes.instanceColor!.needsUpdate = true;
    },
    dispose() {
      holes.dispose();
      targets.dispose();
      for (const item of disposables) item.dispose();
    },
  };
}
