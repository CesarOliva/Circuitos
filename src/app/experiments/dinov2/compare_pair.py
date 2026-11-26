import argparse
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms


def extract_features(
    image_path: Path,
    model: torch.nn.Module,
    transform: transforms.Compose,
    device: torch.device,
) -> tuple[torch.Tensor, torch.Tensor]:
    with Image.open(image_path) as source:
        image = source.convert("RGB")

    tensor = transform(image).unsqueeze(0).to(device)

    with torch.inference_mode():
        global_features = F.normalize(model(tensor), dim=1)
        outputs = model.forward_features(tensor)
        patch_features = F.normalize(outputs["x_norm_patchtokens"], dim=2)

    return global_features, patch_features


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compara dos imágenes usando embeddings de DINOv2."
    )
    parser.add_argument("image1", type=Path, help="Ruta a la primera imagen")
    parser.add_argument("image2", type=Path, help="Ruta a la segunda imagen")
    args = parser.parse_args()

    for image_path in (args.image1, args.image2):
        if not image_path.is_file():
            raise FileNotFoundError(f"No se encontró la imagen: {image_path}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Dispositivo: {device}")
    print("Cargando DINOv2 ViT-S/14...")
    model = torch.hub.load("facebookresearch/dinov2", "dinov2_vits14")
    model.eval()
    model.to(device)

    transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=(0.485, 0.456, 0.406),
                std=(0.229, 0.224, 0.225),
            ),
        ]
    )

    global1, patches1 = extract_features(args.image1, model, transform, device)
    global2, patches2 = extract_features(args.image2, model, transform, device)

    if patches1.shape != patches2.shape:
        raise ValueError("Las imágenes produjeron cantidades distintas de regiones.")

    global_similarity = torch.sum(global1 * global2, dim=1).item()
    patch_similarity = torch.sum(patches1 * patches2, dim=2).mean().item()

    print(f"\nImagen 1: {args.image1.name}")
    print(f"Imagen 2: {args.image2.name}")
    print(f"Similitud global (coseno): {global_similarity:.4f}")
    print(f"Similitud promedio por parches: {patch_similarity:.4f}")
    print(
        "\nEstos valores son índices de similitud, no porcentajes ni "
        "probabilidades de que las imágenes sean iguales."
    )
    print(
        "La comparación por parches depende de que las imágenes tengan "
        "un encuadre parecido."
    )


if __name__ == "__main__":
    main()
