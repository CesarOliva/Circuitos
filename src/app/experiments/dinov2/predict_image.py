import argparse
from pathlib import Path

import joblib
import torch

from dino_utils import (
    MODEL_NAME,
    create_transform,
    extract_embeddings,
    load_backbone,
)

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL = SCRIPT_DIR / "models" / "led_classifier.joblib"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Clasifica una imagen como led o no_led."
    )
    parser.add_argument("image", type=Path, help="Ruta a la imagen")
    parser.add_argument(
        "--model",
        type=Path,
        default=DEFAULT_MODEL,
        help="Ruta al clasificador creado por train_classifier.py",
    )
    args = parser.parse_args()

    if not args.image.is_file():
        raise FileNotFoundError(f"No se encontró la imagen: {args.image}")
    if not args.model.is_file():
        raise FileNotFoundError(
            f"No se encontró el clasificador: {args.model}. "
            "Ejecuta primero train_classifier.py."
        )

    artifact = joblib.load(args.model)
    if artifact.get("model_name") != MODEL_NAME:
        raise ValueError(
            f"El clasificador requiere {artifact.get('model_name')}, "
            f"pero este script usa {MODEL_NAME}."
        )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    backbone = load_backbone(device)
    embeddings = extract_embeddings(
        [args.image], backbone, create_transform(), device, batch_size=1
    )

    classifier = artifact["classifier"]
    prediction = classifier.predict(embeddings)[0]
    probabilities = classifier.predict_proba(embeddings)[0]
    predicted_index = list(classifier.classes_).index(prediction)

    print(f"Imagen: {args.image}")
    print(f"Predicción: {prediction}")
    print(
        "Puntuación del clasificador para esta clase: "
        f"{probabilities[predicted_index]:.3f}"
    )
    print("La puntuación no es una garantía de que la predicción sea correcta.")


if __name__ == "__main__":
    main()
