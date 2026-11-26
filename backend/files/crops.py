"""Recortes de detecciones para entrenar y usar el clasificador (DINOv2).

REGLA DE ORO: `prepare_crop` es la ÚNICA forma de preparar un recorte, tanto para
armar el dataset como para clasificar en producción. Si cambia, hay que reentrenar.

Uso en el notebook (después de cargar SAM 3 y correr mosaic.py):
    import sys; sys.path.append("/content/drive/MyDrive/circuit-vision")
    from crops import export_crops
    export_crops(["fotos/a.jpg", "fotos/b.jpg"], "recortes", analyze, LABELS)
"""
import csv
from pathlib import Path

import numpy as np
from PIL import Image

GRAY = (128, 128, 128)


def pad_to_square(img, fill=GRAY):
    """Centra la imagen en un cuadrado (sin deformar ni recortar)."""
    img = img.convert("RGB")
    side = max(img.size)
    out = Image.new("RGB", (side, side), fill)
    out.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return out


def prepare_crop(image, det, pad_frac=0.10, fill=GRAY, mask_background=True):
    """Recorte de una detección: caja de la máscara + margen, fondo gris fuera de la
    máscara, y relleno gris hasta que sea cuadrado. `det` es un elemento de analyze()."""
    ox, oy = det["origin"]
    m = det["mask"]
    h, w = m.shape
    p = max(4, int(pad_frac * max(h, w)))
    x0, y0 = max(ox - p, 0), max(oy - p, 0)
    x1, y1 = min(ox + w + p, image.width), min(oy + h + p, image.height)
    region = np.array(image.convert("RGB").crop((x0, y0, x1, y1)))
    if mask_background:
        keep = np.zeros(region.shape[:2], dtype=bool)
        mx0, my0 = ox - x0, oy - y0
        keep[my0:my0 + h, mx0:mx0 + w] = m
        region[~keep] = fill
    return pad_to_square(Image.fromarray(region), fill)


def export_crops(photos, out_dir, analyze_fn, labels):
    """Corre el pipeline sobre cada foto y guarda los recortes.

    Estructura:  out_dir/por_sugerencia/<tipo_que_dijo_SAM>/<foto>__<id>__<score>.png
                 out_dir/index.csv
    Las carpetas son SOLO la sugerencia de SAM 3: hay que REVISAR cada recorte y moverlo
    a su clase real (resistor, led, capacitor, wire, ic, background, ...).
    El nombre conserva la foto de origen para poder separar train/validation/test POR FOTO.

    Es REANUDABLE: el índice se actualiza foto por foto, y las fotos que ya aparecen en
    index.csv se saltan. Si se corta la sesión, vuelve a ejecutarlo con la misma lista.
    """
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    index = out / "index.csv"
    header = ["archivo", "foto", "id", "sugerencia_sam", "score", "x1", "y1", "x2", "y2"]
    done = set()
    if index.exists():
        with open(index, newline="") as f:
            done = {r["foto"] for r in csv.DictReader(f)}
    else:
        with open(index, "w", newline="") as f:
            csv.writer(f).writerow(header)

    photos = [Path(p) for p in photos]
    new_rows = []
    for n, photo in enumerate(photos, 1):
        if photo.name in done:
            print(f"[{n}/{len(photos)}] {photo.name}: ya exportada, se salta")
            continue
        print(f"[{n}/{len(photos)}] {photo.name}")
        image, dets = analyze_fn(str(photo))
        rows = []
        for i, d in enumerate(dets):
            guess = labels[d["prompt"]]
            folder = out / "por_sugerencia" / guess
            folder.mkdir(parents=True, exist_ok=True)
            name = f"{photo.stem}__{i:03d}__{d['score']:.2f}.png"
            prepare_crop(image, d).save(folder / name)
            x1, y1, x2, y2 = d["box"]
            rows.append([f"por_sugerencia/{guess}/{name}", photo.name, i, guess,
                         round(d["score"], 3), round(x1), round(y1), round(x2), round(y2)])
        with open(index, "a", newline="") as f:      # se guarda foto por foto
            csv.writer(f).writerows(rows)
        new_rows += rows
        print(f"    {len(rows)} recortes")
    print(f"Listo: {len(new_rows)} recortes nuevos en {out}")
    return new_rows
