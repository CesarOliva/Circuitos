from pathlib import Path
from typing import Sequence

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

MODEL_NAME = "dinov2_vits14"
IMAGE_SIZE = 224
SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def pad_to_square(img: Image.Image, fill: tuple = (128, 128, 128)) -> Image.Image:
    """Centra la imagen en un cuadrado gris, sin deformarla ni recortarla.
    Debe ser IDÉNTICA a la función del mismo nombre en crops.py."""
    img = img.convert("RGB")
    side = max(img.size)
    out = Image.new("RGB", (side, side), fill)
    out.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return out


def create_transform() -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Lambda(pad_to_square),
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=(0.485, 0.456, 0.406),
                std=(0.229, 0.224, 0.225),
            ),
        ]
    )


def load_backbone(device: torch.device) -> torch.nn.Module:
    model = torch.hub.load("facebookresearch/dinov2", MODEL_NAME)
    model.eval()
    model.to(device)
    return model


def image_files(directory: Path) -> list[Path]:
    return sorted(
        path
        for path in directory.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
    )


def embed_images(
    images: Sequence[Image.Image],
    model: torch.nn.Module,
    transform: transforms.Compose,
    device: torch.device,
    batch_size: int = 16,
) -> np.ndarray:
    """Igual que extract_embeddings, pero recibe imágenes PIL ya cargadas (para usarlo
    desde el pipeline de SAM 3 sin pasar por archivos)."""
    if batch_size < 1:
        raise ValueError("El tamaño del lote debe ser mayor que cero.")

    batches: list[np.ndarray] = []
    for start in range(0, len(images), batch_size):
        tensors = [transform(im.convert("RGB")) for im in images[start : start + batch_size]]
        batch = torch.stack(tensors).to(device)
        with torch.inference_mode():
            embeddings = model(batch)
            embeddings = torch.nn.functional.normalize(embeddings, dim=1)
        batches.append(embeddings.cpu().numpy())

    if not batches:
        return np.empty((0, 0), dtype=np.float32)
    return np.concatenate(batches, axis=0)


def extract_embeddings(
    image_paths: Sequence[Path],
    model: torch.nn.Module,
    transform: transforms.Compose,
    device: torch.device,
    batch_size: int = 16,
) -> np.ndarray:
    if batch_size < 1:
        raise ValueError("El tamaño del lote debe ser mayor que cero.")

    batches: list[np.ndarray] = []
    for start in range(0, len(image_paths), batch_size):
        batch_paths = image_paths[start : start + batch_size]
        tensors = []
        for image_path in batch_paths:
            with Image.open(image_path) as source:
                tensors.append(transform(source.convert("RGB")))

        batch = torch.stack(tensors).to(device)
        with torch.inference_mode():
            embeddings = model(batch)
            embeddings = torch.nn.functional.normalize(embeddings, dim=1)
        batches.append(embeddings.cpu().numpy())

    if not batches:
        return np.empty((0, 0), dtype=np.float32)
    return np.concatenate(batches, axis=0)