import argparse
from pathlib import Path

import joblib
import numpy as np
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
)

from dino_utils import (
    MODEL_NAME,
    create_transform,
    extract_embeddings,
    image_files,
    load_backbone,
)

CLASSES = ("led", "no_led")
REGULARIZATION_VALUES = (0.01, 0.1, 1.0, 10.0, 100.0)
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET = SCRIPT_DIR / "dataset"
DEFAULT_OUTPUT = SCRIPT_DIR / "models" / "led_classifier.joblib"


def collect_split(
    dataset_dir: Path,
    split: str,
) -> tuple[list[Path], np.ndarray]:
    image_paths: list[Path] = []
    labels: list[str] = []

    for label in CLASSES:
        class_dir = dataset_dir / split / label
        if not class_dir.is_dir():
            raise FileNotFoundError(f"No se encontró la carpeta: {class_dir}")

        files = image_files(class_dir)
        if not files:
            raise ValueError(f"No hay imágenes en la carpeta: {class_dir}")

        image_paths.extend(files)
        labels.extend([label] * len(files))
        print(f"{split}/{label}: {len(files)} imágenes")

    return image_paths, np.asarray(labels)


def print_metrics(
    split: str,
    expected: np.ndarray,
    predicted: np.ndarray,
) -> None:
    print(f"\nEvaluación {split}:")
    print(f"Accuracy: {accuracy_score(expected, predicted):.3f}")
    print(f"Balanced accuracy: {balanced_accuracy_score(expected, predicted):.3f}")
    print(
        classification_report(
            expected,
            predicted,
            labels=CLASSES,
            target_names=CLASSES,
            zero_division=0,
            digits=3,
        )
    )
    print(f"Matriz de confusión (filas=real, columnas=predicción; {CLASSES}):")
    print(confusion_matrix(expected, predicted, labels=CLASSES))


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Entrena un clasificador LED/no_LED sobre embeddings de DINOv2 "
            "y lo evalúa con el conjunto de prueba."
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
        help="Ruta donde guardar el clasificador entrenado",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=16,
        help="Cantidad de imágenes procesadas juntas por DINOv2",
    )
    args = parser.parse_args()

    train_paths, train_labels = collect_split(args.dataset, "train")
    validation_paths, validation_labels = collect_split(args.dataset, "validation")
    test_paths, test_labels = collect_split(args.dataset, "test")

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

    test_predictions = final_classifier.predict(test_embeddings)
    print(f"\nC elegido usando validation: {best_c:g}")
    print_metrics("test", test_labels, test_predictions)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "classifier": final_classifier,
            "model_name": MODEL_NAME,
            "classes": CLASSES,
        },
        args.output,
    )
    print(f"Clasificador guardado en: {args.output}")


if __name__ == "__main__":
    main()
