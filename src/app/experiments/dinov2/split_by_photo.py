"""Reparte recortes ya etiquetados en train / validation / test POR FOTO.

Entrada:  labeled/<clase>/<foto>__<id>__<score>.png   (nombres que genera crops.py)
Salida:   out/{train,validation,test}/<clase>/...     + out/split_por_foto.csv

Todos los recortes de una misma foto van al MISMO conjunto. Si vuelves a ejecutarlo con
fotos nuevas, las fotos que ya tenían conjunto lo conservan (usa el CSV).
"""
from __future__ import annotations

import argparse
import csv
import random
import shutil
from collections import Counter
from pathlib import Path

SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
SPLITS = ("train", "validation", "test")


def photo_of(filename: str, group_sep: str | None = None) -> str:
    stem = filename.rsplit("__", 2)[0]
    return stem.split(group_sep)[0] if group_sep else stem


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("labeled", type=Path, help="carpeta con una subcarpeta por clase")
    ap.add_argument("out", type=Path, help="carpeta de salida (por ejemplo dataset/)")
    ap.add_argument("--val", type=float, default=0.2, help="fracción de FOTOS para validation")
    ap.add_argument("--test", type=float, default=0.2, help="fracción de FOTOS para test")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--group-sep", default=None,
                    help="agrupa fotos del mismo circuito: con '@', 'circuitoA@1' y 'circuitoA@2'\n"
                         "cuentan como UN grupo y van siempre juntas al mismo conjunto")
    ap.add_argument("--exclude", nargs="+", default=[], metavar="CLASE",
                    help="clases que se ignoran (por ejemplo: --exclude ic); no se borran de labeled")
    ap.add_argument("--reset-split", action="store_true",
                    help="ignora la asignación guardada de fotos y repite el reparto desde cero\n"
                         "(sin esto, las fotos conservan su conjunto de la vez anterior)")
    ap.add_argument("--overwrite", action="store_true",
                    help="borra train/validation/test de la salida antes de copiar")
    args = ap.parse_args()

    files = [(c.name, p) for c in sorted(args.labeled.iterdir()) if c.is_dir()
             for p in sorted(c.rglob("*")) if p.suffix.lower() in SUFFIXES
             and c.name not in args.exclude]
    if not files:
        raise SystemExit(f"No hay imágenes en subcarpetas de {args.labeled}")
    sin_formato = [p.name for _, p in files if "__" not in p.name]
    if sin_formato:
        print(f"AVISO: {len(sin_formato)} archivos no siguen <foto>__<id>__<score>.png; "
              "cada uno cuenta como una 'foto' distinta y el reparto NO será por foto real.")

    photos = sorted({photo_of(p.name, args.group_sep) for _, p in files})
    csv_path = args.out / "split_por_foto.csv"
    assign: dict[str, str] = {}
    if csv_path.exists() and not args.reset_split:
        with open(csv_path, newline="") as f:
            assign = {r["foto"]: r["conjunto"] for r in csv.DictReader(f)}
    new = [ph for ph in photos if ph not in assign]
    rng = random.Random(args.seed)
    if new and not assign:                       # primer reparto: cantidades exactas
        if len(new) < 3:
            raise SystemExit(f"Se necesitan al menos 3 fotos distintas; hay {len(new)}.")
        rng.shuffle(new)
        n_test = max(1, round(args.test * len(new)))
        n_val = max(1, round(args.val * len(new)))
        for i, ph in enumerate(new):
            assign[ph] = "test" if i < n_test else "validation" if i < n_test + n_val else "train"
    else:                                        # fotos nuevas después: azar con las mismas proporciones
        for ph in new:
            assign[ph] = rng.choices(SPLITS, weights=[1 - args.val - args.test, args.val, args.test])[0]

    args.out.mkdir(parents=True, exist_ok=True)
    for s in SPLITS:
        if (args.out / s).exists():
            if not args.overwrite:
                raise SystemExit(f"{args.out / s} ya existe. Usa --overwrite para regenerarlo.")
            shutil.rmtree(args.out / s)
    counts: Counter = Counter()
    for cls, p in files:
        split = assign[photo_of(p.name, args.group_sep)]
        dest = args.out / split / cls
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, dest / p.name)
        counts[(cls, split)] += 1
    with open(csv_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["foto", "conjunto"])
        w.writerows(sorted(assign.items()))

    classes = sorted({c for c, _ in files})
    print(f"\n{len(photos)} {'grupos' if args.group_sep else 'fotos'} -> " + ", ".join(
        f"{s}: {sum(1 for ph in photos if assign[ph] == s)}" for s in SPLITS))
    print(f"\n{'clase':<14}" + "".join(f"{s:>12}" for s in SPLITS))
    for c in classes:
        print(f"{c:<14}" + "".join(f"{counts[(c, s)]:>12}" for s in SPLITS))
        for s in SPLITS:
            if counts[(c, s)] == 0:
                print(f"  AVISO: '{c}' no tiene ejemplos en {s}")
        if counts[(c, 'train')] < 20:
            print(f"  AVISO: '{c}' tiene pocos ejemplos de entrenamiento (<20)")
    print(f"\nAsignación guardada en {csv_path}")


if __name__ == "__main__":
    main()