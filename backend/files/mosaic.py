import numpy as np, torch, torchvision, matplotlib.pyplot as plt
from PIL import Image, ImageOps

# =====================  CONFIGURACIÓN  =====================
PROMPT_GROUPS = {
    "resistor": [
        "resistor",
        "axial resistor with colored bands and two metal leads",
    ],
    "led": [
        "light emitting diode",
        "LED with a round translucent plastic dome and two metal legs",
    ],
    "capacitor": [
        "ceramic capacitor",
        "electrolytic capacitor",
    ],
    "wire": [
        "jumper wire",
        "solid core jumper wire with bent ends",   # el que mejor funcionó en las pruebas
        "colored insulated wire",
    ],
    "ic": [
        "integrated circuit chip",
        "black DIP chip with pins",
    ],
    # ---- componentes extra: DESACTIVADOS por defecto (ver EXTRA) ----
    "potentiometer": [
        "potentiometer",
        "rotary potentiometer with three pins",
    ],
    "button": [
        "push button",
        "small black tactile push button switch",
    ],
    "transistor": [
        "transistor",
        "black TO-92 transistor with three legs",
    ],
    "diode": [
        "rectifier diode",
        "black diode with a silver stripe and two leads",
    ],
    "buzzer": [
        "buzzer",
        "round black piezo buzzer",
    ],
    "display": [
        "seven segment display",
    ],
}
# Tipos que SAM busca. Los cables se buscan para que SAM los "reclame" (así no se cuelan como
# capacitores/resistencias), pero NO se muestran: HIDE_TYPES los quita del resultado final.
# Para mostrarlos, usa HIDE_TYPES = ().
ENABLED = ("resistor", "led", "capacitor", "wire", "ic")
# Extras probados con SAM 3 y descartados por ahora (muchos falsos positivos: buzzers
# inexistentes, ICs como transistores...). Para volver a probarlos, suma esta tupla a ENABLED
# (cada tipo extra añade pasadas y tarda más):
EXTRA = ("potentiometer", "button", "transistor", "diode", "buzzer", "display")
HIDE_TYPES = ("wire",)
WIRE_ABSORB = 0.7      # una detección cuya máscara esté >=70% dentro de un cable ES parte del cable
                       # (se descarta). None = desactivado
PROMPTS = [p for t in ENABLED for p in PROMPT_GROUPS[t]]
LABELS = {p: t for t, g in PROMPT_GROUPS.items() for p in g}

# Peso al resolver solapes ENTRE tipos distintos (sube un tipo si siempre pierde, ej. "wire": 1.15)
CROSS_WEIGHT = {"resistor": 1.0, "led": 1.0, "capacitor": 1.0, "wire": 1.0, "ic": 1.0,
                "potentiometer": 1.0, "button": 1.0, "transistor": 1.0, "diode": 1.0, "buzzer": 1.0, "display": 1.0}

MAX_SIDE = 2000        # reduce fotos grandes a este lado largo (None = no reducir)
TILE_FRAC = 0.5        # tamaño del mosaico como fracción de la foto
OVERLAP = 0.3          # solapamiento entre mosaicos
MAX_BOX_FRAC = 0.35    # descarta cajas que ocupen más de este % de la foto
NMS_IOU = 0.5          # une duplicados del mismo tipo
CONTAIN = 0.8          # dos cajas del mismo tipo con >=80% de la menor dentro de la otra = duplicado
CONTAIN_MIN_RATIO = 0.08   # ...siempre que la menor tenga al menos 8% del área de la mayor
MOSAIC_VERSION = 7         # para comprobar en el notebook que se cargó el archivo nuevo
CROSS_IOU = 0.6        # solapes entre tipos distintos: gana el de mayor score (con peso)
EDGE_MARGIN = 3        # px: objetos pegados al borde de un mosaico se descartan
# ===========================================================


def load_image(path):
    """Abre la foto respetando la rotación EXIF y la reduce si es muy grande."""
    image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    if MAX_SIDE and max(image.size) > MAX_SIDE:
        k = MAX_SIDE / max(image.size)
        image = image.resize((round(image.width * k), round(image.height * k)), Image.LANCZOS)
    return image


def make_tiles(W, H, frac, overlap):
    tw, th = max(1, int(W * frac)), max(1, int(H * frac))
    sx, sy = max(1, int(tw * (1 - overlap))), max(1, int(th * (1 - overlap)))

    def starts(total, size, step):
        s = list(range(0, max(total - size, 0) + 1, step))
        if s[-1] + size < total:
            s.append(total - size)
        return s

    tiles = [(0, 0, W, H)]  # primero, la foto completa
    for y in starts(H, th, sy):
        for x in starts(W, tw, sx):
            tiles.append((x, y, min(x + tw, W), min(y + th, H)))
    return tiles


def detect_tile(image, tile, prompts, margin=EDGE_MARGIN):
    W, H = image.size
    tx1, ty1, tx2, ty2 = tile
    sub = image.crop(tile)
    dets = []
    with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
        state = processor.set_image(sub)
        for p in prompts:
            processor.reset_all_prompts(state)
            out = processor.set_text_prompt(state=state, prompt=p)
            if len(out["scores"]) == 0:
                continue
            boxes = out["boxes"].float().cpu().numpy()
            scores = out["scores"].float().cpu().numpy()
            masks = (out["masks"] > 0.5).cpu().numpy()      # booleanas, ahorran RAM
            for b, s, m in zip(boxes, scores, masks):
                x1, y1, x2, y2 = [float(v) for v in b]
                # descarta objetos cortados por el borde del mosaico (no por el de la foto)
                touches = ((tx1 > 0 and x1 <= margin) or (ty1 > 0 and y1 <= margin) or
                           (tx2 < W and x2 >= sub.width - margin) or
                           (ty2 < H and y2 >= sub.height - margin))
                if touches:
                    continue
                # guarda la máscara solo dentro de su caja
                mm = np.squeeze(m)
                bx1, by1 = max(int(x1), 0), max(int(y1), 0)
                bx2, by2 = int(np.ceil(x2)), int(np.ceil(y2))
                crop = mm[by1:by2, bx1:bx2]
                if crop.size == 0:
                    continue
                dets.append({"prompt": p, "score": float(s),
                             "box": [x1 + tx1, y1 + ty1, x2 + tx1, y2 + ty1],
                             "mask": crop, "origin": (tx1 + bx1, ty1 + by1)})
    return dets


def _area(b):
    return max(b[2] - b[0], 0) * max(b[3] - b[1], 0)


def suppress_contained(dets, contain=None, min_ratio=None):
    """Quita duplicados del mismo tipo que NMS por IoU no atrapa: una caja casi dentro de otra
    (p. ej. el cuerpo de una resistencia vs. cuerpo + patas). Se queda la de mayor score."""
    contain = CONTAIN if contain is None else contain          # se leen al ejecutar: se pueden
    min_ratio = CONTAIN_MIN_RATIO if min_ratio is None else min_ratio   # cambiar desde el notebook
    kept = []
    for d in sorted(dets, key=lambda d: -d["score"]):
        b, a = d["box"], _area(d["box"])
        dup = False
        for k in kept:
            kb, ka = k["box"], _area(k["box"])
            inter = _area([max(b[0], kb[0]), max(b[1], kb[1]), min(b[2], kb[2]), min(b[3], kb[3])])
            small, big = min(a, ka), max(a, ka)
            if small > 0 and inter / small >= contain and small / big >= min_ratio:
                dup = True
                break
        if not dup:
            kept.append(d)
    return kept


def _mask_overlap(a, b):
    """Fracción de la máscara de `a` que cae dentro de la máscara de `b` (coords globales)."""
    ax, ay = a["origin"]; ah, aw = a["mask"].shape
    bx, by = b["origin"]; bh, bw = b["mask"].shape
    x1, y1, x2, y2 = max(ax, bx), max(ay, by), min(ax + aw, bx + bw), min(ay + ah, by + bh)
    if x2 <= x1 or y2 <= y1:
        return 0.0
    sa = a["mask"][y1 - ay:y2 - ay, x1 - ax:x2 - ax]
    sb = b["mask"][y1 - by:y2 - by, x1 - bx:x2 - bx]
    return float((sa & sb).sum()) / max(int(a["mask"].sum()), 1)


def absorb_into_wires(dets, thr=None):
    """Quita detecciones (de otro tipo) que en realidad son un trozo de cable ya detectado."""
    thr = WIRE_ABSORB if thr is None else thr
    wires = [d for d in dets if LABELS[d["prompt"]] == "wire"]
    if not thr or not wires:
        return dets
    return [d for d in dets
            if LABELS[d["prompt"]] == "wire" or not any(_mask_overlap(d, w) >= thr for w in wires)]


def dedup_final(dets):
    """Mismo filtro de duplicados, pero por el tipo FINAL (tras el clasificador): dos cajas que
    SAM etiquetó distinto pueden terminar siendo ambas 'resistor' y hay que unirlas."""
    groups = {}
    for d in dets:
        groups.setdefault(d.get("type") or LABELS[d["prompt"]], []).append(d)
    return [d for g in groups.values() for d in suppress_contained(g)]


def nms(dets, iou, by_class=True):
    if not dets:
        return []
    groups = {}
    for d in dets:
        groups.setdefault(LABELS[d["prompt"]] if by_class else "all", []).append(d)
    keep = []
    for g in groups.values():
        b = torch.tensor([d["box"] for d in g], dtype=torch.float32)
        if by_class:
            s = torch.tensor([d["score"] for d in g], dtype=torch.float32)
        else:
            s = torch.tensor([d["score"] * CROSS_WEIGHT.get(LABELS[d["prompt"]], 1.0) for d in g],
                             dtype=torch.float32)
        idx = torchvision.ops.nms(b, s, iou).tolist()
        kept = [g[i] for i in idx]
        keep += suppress_contained(kept) if by_class else kept
    return keep


def analyze(path, progress=None):
    """Devuelve (imagen PIL, detecciones). progress(i, n) se llama tras cada pasada."""
    if "processor" not in globals():
        raise RuntimeError("SAM 3 no está cargado: ejecuta la celda que crea 'processor'")
    image = load_image(path)
    W, H = image.size
    tiles = make_tiles(W, H, TILE_FRAC, OVERLAP)
    print(f"Foto {W}x{H} -> {len(tiles)} pasadas (1 completa + {len(tiles) - 1} mosaicos)")
    dets = []
    for i, t in enumerate(tiles):
        dets += detect_tile(image, t, PROMPTS)
        torch.cuda.empty_cache()
        if progress:
            progress(i + 1, len(tiles))
    dets = [d for d in dets
            if (d["box"][2] - d["box"][0]) * (d["box"][3] - d["box"][1]) <= MAX_BOX_FRAC * W * H]
    dets = nms(dets, NMS_IOU, by_class=True)
    dets = nms(dets, CROSS_IOU, by_class=False)
    dets = absorb_into_wires(dets)
    for d in dets:
        d["sam_type"] = LABELS[d["prompt"]]      # lo que dijo SAM (el clasificador lo necesita)
    clf = globals().get("clf")          # clasificador DINOv2 (ver dino_classifier.py), opcional
    if clf is not None:
        dets = clf.classify(image, dets)
    dets = dedup_final(dets)
    dets = [d for d in dets if type_of(d) not in HIDE_TYPES]
    return image, dets


def type_of(d):
    """Tipo final de una detección: el del clasificador si existe, si no el de SAM."""
    return d.get("type") or LABELS[d["prompt"]]


def summary(dets):
    return {t: sum(type_of(d) == t for d in dets) for t in ENABLED if t not in HIDE_TYPES}


def render(image, dets):
    arr = np.array(image).copy()
    types = sorted({type_of(d) for d in dets})
    rng = np.random.default_rng(3)
    colors = {t: rng.integers(60, 255, 3) for t in types}
    for d in dets:
        ox, oy = d["origin"]
        m = d["mask"]
        h = min(m.shape[0], arr.shape[0] - oy)
        w = min(m.shape[1], arr.shape[1] - ox)
        region = arr[oy:oy + h, ox:ox + w]
        mk = m[:h, :w]
        region[mk] = (0.5 * region[mk] + 0.5 * colors[type_of(d)]).astype(np.uint8)
    plt.figure(figsize=(14, 10))
    plt.imshow(arr)
    ax = plt.gca()
    for d in dets:
        t = type_of(d)
        x1, y1, x2, y2 = d["box"]
        c = tuple(colors[t] / 255)
        ax.add_patch(plt.Rectangle((x1, y1), x2 - x1, y2 - y1, fill=False, color=c, lw=2))
        ax.text(x1, y1 - 3, f'{t} {d["score"]:.2f}', color="white",
                fontsize=8, backgroundcolor="black")
    plt.axis("off")
    plt.show()


def run_debug(path):
    """Para probar en el notebook: analiza, imprime el conteo y dibuja."""
    image, dets = analyze(path)
    print(summary(dets))
    render(image, dets)
    return image, dets