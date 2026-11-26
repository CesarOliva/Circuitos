import argparse
import json
import platform
from collections import Counter
from pathlib import Path

import joblib
import numpy as np
import sklearn
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)

from dino_utils import (
    MODEL_NAME,
    create_transform,
    extract_embeddings,
    image_files,
    load_backbone,
)

REGULARIZATION_VALUES = (0.01, 0.1, 1.0, 10.0, 100.0)
MIN_TRAIN_PER_CLASS = 20
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET = SCRIPT_DIR / "dataset"
DEFAULT_OUTPUT = SCRIPT_DIR / "models" / "classifier.joblib"


def discover_classes(dataset_dir: Path) -> tuple[str, ...]:
    """Las clases son las subcarpetas de train/. validation/ y test/ deben tener las mismas."""
    train_dir = dataset_dir / "train"
    if not train_dir.is_dir():
        raise FileNotFoundError(f"No se encontró la carpeta: {train_dir}")
    classes = tuple(sorted(p.name for p in train_dir.iterdir() if p.is_dir()))
    if len(classes) < 2:
        raise ValueError(f"Se necesitan al menos 2 clases en {train_dir}; hay {len(classes)}.")
    for split in ("validation", "test"):
        split_dir = dataset_dir / split
        found = (
            tuple(sorted(p.name for p in split_dir.iterdir() if p.is_dir()))
            if split_dir.is_dir()
            else ()
        )
        if found != classes:
            missing = sorted(set(classes) - set(found))
            extra = sorted(set(found) - set(classes))
            raise ValueError(
                f"Las clases de {split}/ no coinciden con las de train/. "
                f"Faltan: {missing or 'ninguna'}. Sobran: {extra or 'ninguna'}."
            )
    return classes


def collect_split(
    dataset_dir: Path,
    split: str,
    classes: tuple[str, ...],
) -> tuple[list[Path], np.ndarray]:
    image_paths: list[Path] = []
    labels: list[str] = []

    for label in classes:
        class_dir = dataset_dir / split / label
        if not class_dir.is_dir():
            raise FileNotFoundError(f"No se encontró la carpeta: {class_dir}")

        files = image_files(class_dir)
        if not files:
            raise ValueError(f"No hay imágenes en la carpeta: {class_dir}")

        image_paths.extend(files)
        labels.extend([label] * len(files))
        print(f"{split}/{label}: {len(files)} imágenes")
        if split == "train" and len(files) < MIN_TRAIN_PER_CLASS:
            print(f"  AVISO: '{label}' tiene pocos ejemplos de entrenamiento (<{MIN_TRAIN_PER_CLASS}).")

    return image_paths, np.asarray(labels)


def print_metrics(
    split: str,
    expected: np.ndarray,
    predicted: np.ndarray,
    classes: tuple[str, ...],
) -> dict:
    accuracy = accuracy_score(expected, predicted)
    balanced = balanced_accuracy_score(expected, predicted)
    print(f"\nEvaluación {split}:")
    print(f"Accuracy: {accuracy:.3f}")
    print(f"Balanced accuracy: {balanced:.3f}")
    print(
        classification_report(
            expected,
            predicted,
            labels=classes,
            target_names=classes,
            zero_division=0,
            digits=3,
        )
    )

    matrix = confusion_matrix(expected, predicted, labels=classes)
    width = max(len(name) for name in classes) + 2
    print("Matriz de confusión (filas=real, columnas=predicción):")
    print(" " * width + "".join(f"{name:>{width}}" for name in classes))
    for name, row in zip(classes, matrix):
        print(f"{name:<{width}}" + "".join(f"{value:>{width}}" for value in row))

    precision, recall, f1, support = precision_recall_fscore_support(
        expected, predicted, labels=classes, zero_division=0
    )
    return {
        "accuracy": float(accuracy),
        "balanced_accuracy": float(balanced),
        "per_class": {
            name: {
                "precision": float(p),
                "recall": float(r),
                "f1": float(f),
                "support": int(s),
            }
            for name, p, r, f, s in zip(classes, precision, recall, f1, support)
        },
        "confusion_matrix": matrix.tolist(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Entrena un clasificador sobre embeddings de DINOv2 (clases = subcarpetas de "
            "train/) y lo evalúa con el conjunto de prueba."
        )
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET,
        help="Carpeta que contiene train, validation y test",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Ruta donde guardar el clasificador entrenado (.joblib)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=16,
        help="Cantidad de imágenes procesadas juntas por DINOv2",
    )
    args = parser.parse_args()

    classes = discover_classes(args.dataset)
    print(f"Clases: {', '.join(classes)}\n")

    train_paths, train_labels = collect_split(args.dataset, "train", classes)
    validation_paths, validation_labels = collect_split(args.dataset, "validation", classes)
    test_paths, test_labels = collect_split(args.dataset, "test", classes)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\nDispositivo: {device}")
    print(f"Cargando DINOv2 ({MODEL_NAME})...")
    backbone = load_backbone(device)
    transform = create_transform()

    train_embeddings = extract_embeddings(
        train_paths, backbone, transform, device, args.batch_size
    )
    validation_embeddings = extract_embeddings(
        validation_paths, backbone, transform, device, args.batch_size
    )
    test_embeddings = extract_embeddings(
        test_paths, backbone, transform, device, args.batch_size
    )

    best_c = REGULARIZATION_VALUES[0]
    best_score = -1.0
    validation_scores: dict[str, float] = {}
    for regularization in REGULARIZATION_VALUES:
        candidate = LogisticRegression(
            C=regularization,
            class_weight="balanced",
            max_iter=2000,
            random_state=42,
        )
        candidate.fit(train_embeddings, train_labels)
        score = balanced_accuracy_score(
            validation_labels, candidate.predict(validation_embeddings)
        )
        validation_scores[f"{regularization:g}"] = float(score)
        print(f"Validación con C={regularization:g}: balanced accuracy={score:.3f}")
        if score > best_score:
            best_c = regularization
            best_score = score

    final_classifier = LogisticRegression(
        C=best_c,
        class_weight="balanced",
        max_iter=2000,
        random_state=42,
    )
    final_classifier.fit(
        np.concatenate((train_embeddings, validation_embeddings), axis=0),
        np.concatenate((train_labels, validation_labels), axis=0),
    )
    assert tuple(final_classifier.classes_) == classes

    test_predictions = final_classifier.predict(test_embeddings)
    print(f"\nC elegido usando validation: {best_c:g}")
    test_metrics = print_metrics("test", test_labels, test_predictions, classes)

    versions = {
        "python": platform.python_version(),
        "numpy": np.__version__,
        "scikit-learn": sklearn.__version__,
        "torch": torch.__version__,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "classifier": final_classifier,
            "model_name": MODEL_NAME,
            "classes": classes,
            "preprocessing": "pad_to_square(gris) + Resize(224x224) + normalización ImageNet",
            "versions": versions,
        },
        args.output,
    )
    print(f"Clasificador guardado en: {args.output}")

    # Copia portable (sin pickle): sirve aunque las versiones de scikit-learn/numpy cambien.
    #   binario  (2 clases): p(clases[1]) = sigmoide(emb @ coef[0] + intercept[0])
    #   multiclase:          softmax(emb @ coef.T + intercept)
    portable_path = args.output.with_suffix(".npz")
    np.savez(
        portable_path,
        coef=final_classifier.coef_,
        intercept=final_classifier.intercept_,
        classes=np.asarray(classes),
        model_name=np.asarray(MODEL_NAME),
    )
    print(f"Copia portable guardada en: {portable_path}")

    report_path = args.output.with_name(args.output.stem + "_report.json")
    report = {
        "classes": list(classes),
        "images": {
            "train": dict(Counter(map(str, train_labels))),
            "validation": dict(Counter(map(str, validation_labels))),
            "test": dict(Counter(map(str, test_labels))),
        },
        "chosen_C": best_c,
        "validation_balanced_accuracy_by_C": validation_scores,
        "test": test_metrics,
        "versions": versions,
    }
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Reporte guardado en: {report_path}")


if __name__ == "__main__":
    main()