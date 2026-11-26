"""Corrige el tipo de cada detección de SAM 3 con el clasificador DINOv2.

Archivos que necesita en la misma carpeta (circuit-vision/):
    dino_utils.py, crops.py, y classifier.npz  (o classifier.joblib)

Uso en el notebook (después de cargar SAM 3 y correr mosaic.py):
    import sys; sys.path.append("/content/drive/MyDrive/circuit-vision")
    from dino_classifier import DinoClassifier
    clf = DinoClassifier("/content/drive/MyDrive/circuit-vision")
`analyze()` de mosaic.py usa la variable global `clf` si existe (si no, todo sigue como antes).

Reglas por detección:
  - Si el tipo de SAM no está entre las clases del clasificador (p. ej. 'ic' si se entrenó
    sin esa clase), se respeta el de SAM.
  - Si la probabilidad del clasificador es >= MIN_PROB, se usa su tipo.
  - Si es menor, se conserva el tipo de SAM.
  - Si el clasificador elige una clase de `drop` ('background' o 'wire' por defecto) con
    p >= DROP_PROB, la detección se descarta; con menos confianza, se conserva el tipo de SAM.
"""
import numpy as np
from pathlib import Path

MIN_PROB = 0.55
DROP_PROB = 0.65
DROP_CLASSES = ("background", "wire")   # si el clasificador elige una de estas, se descarta


class DinoClassifier:
    def __init__(self, folder, labels=None, min_prob=MIN_PROB, drop_prob=DROP_PROB,
                 drop=DROP_CLASSES, device=None):
        import torch
        import dino_utils
        from crops import prepare_crop
        self._torch, self._du, self._prepare = torch, dino_utils, prepare_crop
        self.labels = labels
        self.min_prob, self.drop_prob, self.drop = min_prob, drop_prob, set(drop)
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))

        folder = Path(folder)
        npz, jl = folder / "classifier.npz", folder / "classifier.joblib"
        if npz.exists():
            z = np.load(npz, allow_pickle=False)
            self.coef, self.intercept = z["coef"].astype(np.float64), z["intercept"].astype(np.float64)
            self.classes = [str(c) for c in z["classes"]]
            src = npz
        elif jl.exists():
            import joblib
            d = joblib.load(jl)
            self.coef, self.intercept = d["classifier"].coef_, d["classifier"].intercept_
            self.classes = [str(c) for c in d["classes"]]
            src = jl
        else:
            raise FileNotFoundError(f"No hay classifier.npz ni classifier.joblib en {folder}")
        self.backbone = dino_utils.load_backbone(self.device)
        self.transform = dino_utils.create_transform()
        print(f"Clasificador cargado ({src.name}): clases = {self.classes}")

    def probs(self, embeddings):
        z = embeddings @ self.coef.T + self.intercept
        if len(self.classes) == 2:                      # binario: sigmoide de classes[1]
            p1 = 1.0 / (1.0 + np.exp(-z[:, 0]))
            return np.stack([1 - p1, p1], axis=1)
        z = z - z.max(axis=1, keepdims=True)
        e = np.exp(z)
        return e / e.sum(axis=1, keepdims=True)

    def classify(self, image, dets):
        """Añade a cada detección: 'sam_type', 'type', 'type_prob'. Devuelve la lista filtrada."""
        if not dets:
            return dets
        labels = self.labels or globals().get("LABELS")
        crops = [self._prepare(image, d) for d in dets]
        emb = self._du.embed_images(crops, self.backbone, self.transform, self.device)
        pr = self.probs(emb)
        out = []
        for d, p in zip(dets, pr):
            k = int(np.argmax(p))
            pred, prob = self.classes[k], float(p[k])
            sam = d.get("sam_type") or (labels[d["prompt"]] if labels else None)
            if sam is None:
                raise RuntimeError("La detección no trae 'sam_type': usa mosaic.py versión 7 o superior")
            d["sam_type"], d["type_prob"] = sam, round(prob, 3)
            if pred in self.drop and prob >= self.drop_prob:
                continue
            if sam not in self.classes or prob < self.min_prob or pred in self.drop:
                d["type"] = sam
            else:
                d["type"] = pred
            out.append(d)
        return out
