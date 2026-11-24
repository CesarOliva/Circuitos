from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import AutoModelForZeroShotObjectDetection, AutoProcessor


ROOT = Path(__file__).resolve().parent
INPUT_DIR = ROOT / "input"
OUTPUT_DIR = ROOT / "output"
MODEL_DIR = ROOT / "models"
MODEL_ID = "IDEA-Research/grounding-dino-tiny"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
BOARD_LABEL = "breadboard"
PROMPTS = [
    "a solderless breadboard",
    "a resistor",
    "an LED",
    "a capacitor",
    "an integrated circuit chip",
    "a transistor",
    "a buzzer",
    "a diode",
    "a switch",
    "a potentiometer",
    "a push button",
]
LABELS = {
    "solderless breadboard": BOARD_LABEL,
    "breadboard": BOARD_LABEL,
    "resistor": "resistor",
    "led": "led",
    "capacitor": "capacitor",
    "integrated circuit chip": "integrated circuit",
    "integrated circuit": "integrated circuit",
    "transistor": "transistor",
    "buzzer": "buzzer",
    "diode": "diode",
    "switch": "switch",
    "potentiometer": "potentiometer",
    "push button": "push button",
}


@dataclass(frozen=True)
class Detection:
    label: str
    score: float
    box: tuple[float, float, float, float]


def canonical_label(label: str) -> str | None:
    normalized = label.lower().strip().removesuffix(".")
    normalized = normalized.removeprefix("a ").removeprefix("an ")
    return LABELS.get(normalized)


def order_corners(points: np.ndarray) -> np.ndarray:
    points = np.asarray(points, dtype=np.float32).reshape(4, 2)
    sums = points.sum(axis=1)
    differences = np.diff(points, axis=1).ravel()
    ordered = np.array(
        [
            points[np.argmin(sums)],
            points[np.argmin(differences)],
            points[np.argmax(sums)],
            points[np.argmax(differences)],
        ],
        dtype=np.float32,
    )
    if len(np.unique(ordered, axis=0)) != 4:
        raise ValueError("No se pudieron ordenar las cuatro esquinas del protoboard.")
    return ordered


def detect_board_corners(
    image_rgb: np.ndarray,
    board_box: tuple[float, float, float, float],
) -> np.ndarray:
    image_height, image_width = image_rgb.shape[:2]
    x1, y1, x2, y2 = board_box
    box_width = max(1, x2 - x1)
    box_height = max(1, y2 - y1)
    pad_x = max(12, int(box_width * 0.12))
    pad_y = max(12, int(box_height * 0.12))
    left = max(0, int(x1) - pad_x)
    top = max(0, int(y1) - pad_y)
    right = min(image_width, int(x2) + pad_x)
    bottom = min(image_height, int(y2) + pad_y)
    crop = image_rgb[top:bottom, left:right]
    if crop.size == 0:
        raise ValueError("La detección del protoboard quedó fuera de la imagen.")

    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
    border = max(3, min(crop.shape[:2]) // 25)
    background = np.concatenate(
        [
            gray[:border, :].ravel(),
            gray[-border:, :].ravel(),
            gray[:, :border].ravel(),
            gray[:, -border:].ravel(),
        ]
    )
    threshold = max(145, int(np.median(background)) + 9)
    mask = ((gray >= threshold) & (hsv[:, :, 1] < 105)).astype(np.uint8) * 255

    close_size = max(7, (min(crop.shape[:2]) // 45) | 1)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close_size, close_size))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates = [contour for contour in contours if cv2.contourArea(contour) > crop.shape[0] * crop.shape[1] * 0.18]
    if not candidates:
        raise ValueError(
            "No pude encontrar el borde claro del protoboard. "
            "Usa una foto donde se vean sus cuatro esquinas y contraste con el fondo."
        )

    contour = max(candidates, key=cv2.contourArea)
    perimeter = cv2.arcLength(contour, True)
    polygon = cv2.approxPolyDP(contour, 0.035 * perimeter, True)
    if len(polygon) != 4:
        rectangle = cv2.minAreaRect(contour)
        polygon = cv2.boxPoints(rectangle)
    polygon = polygon.reshape(-1, 2).astype(np.float32)
    polygon[:, 0] += left
    polygon[:, 1] += top
    return order_corners(polygon)


def box_keypoints(box: tuple[float, float, float, float]) -> dict[str, list[float]]:
    x1, y1, x2, y2 = box
    return {
        "P1": [x1, y1],
        "P2": [x2, y1],
        "P3": [x2, y2],
        "P4": [x1, y2],
        "centro": [(x1 + x2) / 2, (y1 + y2) / 2],
    }


def project_points(
    board_corners: np.ndarray,
    points: dict[str, list[float]],
    board_width: float,
    board_height: float,
) -> dict[str, dict[str, float]]:
    destination = np.array(
        [
            [-board_width / 2, -board_height / 2],
            [board_width / 2, -board_height / 2],
            [board_width / 2, board_height / 2],
            [-board_width / 2, board_height / 2],
        ],
        dtype=np.float32,
    )
    transform = cv2.getPerspectiveTransform(board_corners, destination)
    names = list(points)
    source_points = np.array([points[name] for name in names], dtype=np.float32).reshape(-1, 1, 2)
    mapped = cv2.perspectiveTransform(source_points, transform).reshape(-1, 2)
    return {
        name: {"x": round(float(point[0]), 2), "y": round(float(point[1]), 2)}
        for name, point in zip(names, mapped)
    }


def intersection_over_union(
    first: tuple[float, float, float, float],
    second: tuple[float, float, float, float],
) -> float:
    left = max(first[0], second[0])
    top = max(first[1], second[1])
    right = min(first[2], second[2])
    bottom = min(first[3], second[3])
    intersection = max(0.0, right - left) * max(0.0, bottom - top)
    area_first = max(0.0, first[2] - first[0]) * max(0.0, first[3] - first[1])
    area_second = max(0.0, second[2] - second[0]) * max(0.0, second[3] - second[1])
    union = area_first + area_second - intersection
    return intersection / union if union else 0.0


def remove_duplicate_boxes(detections: list[Detection], overlap: float = 0.5) -> list[Detection]:
    kept: list[Detection] = []
    for label in sorted({item.label for item in detections}):
        candidates = sorted(
            (item for item in detections if item.label == label),
            key=lambda item: item.score,
            reverse=True,
        )
        selected: list[Detection] = []
        for candidate in candidates:
            if all(intersection_over_union(candidate.box, kept_item.box) <= overlap for kept_item in selected):
                selected.append(candidate)
        kept.extend(selected)
    return sorted(kept, key=lambda item: (item.box[1], item.box[0]))


def load_detector() -> tuple[Any, Any, torch.device]:
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    processor = AutoProcessor.from_pretrained(MODEL_ID, cache_dir=MODEL_DIR)
    model = AutoModelForZeroShotObjectDetection.from_pretrained(MODEL_ID, cache_dir=MODEL_DIR)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    return processor, model, device


def detect_objects(
    image: Image.Image,
    processor: Any,
    model: Any,
    device: torch.device,
    threshold: float,
) -> list[Detection]:
    inputs = processor(images=image, text=[PROMPTS], return_tensors="pt").to(device)
    with torch.inference_mode():
        outputs = model(**inputs)

    post_process = processor.post_process_grounded_object_detection
    import inspect

    parameters = inspect.signature(post_process).parameters
    threshold_name = "threshold" if "threshold" in parameters else "box_threshold"
    results = post_process(
        outputs,
        inputs.input_ids,
        **{
            threshold_name: threshold,
            "text_threshold": threshold,
            "target_sizes": [image.size[::-1]],
        },
    )[0]

    detections = []
    for box, score, label in zip(results["boxes"], results["scores"], results["labels"]):
        class_name = canonical_label(str(label))
        if class_name is None:
            continue
        coordinates = tuple(float(value) for value in box.tolist())
        if coordinates[2] - coordinates[0] < 4 or coordinates[3] - coordinates[1] < 4:
            continue
        detections.append(Detection(class_name, float(score), coordinates))
    return remove_duplicate_boxes(detections)


def save_outputs(
    image_path: Path,
    image_rgb: np.ndarray,
    board_corners: np.ndarray,
    board_detection: Detection,
    detections: list[Detection],
    board_width: float,
    board_height: float,
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    components = []
    for index, detection in enumerate(detections, start=1):
        pixel_points = box_keypoints(detection.box)
        board_points = project_points(board_corners, pixel_points, board_width, board_height)
        components.append(
            {
                "id": f"C{index:02d}",
                "class": detection.label,
                "confidence": round(detection.score, 4),
                "points": {
                    name: {
                        "pixel": {"x": round(point[0], 2), "y": round(point[1], 2)},
                        "board": board_points[name],
                    }
                    for name, point in pixel_points.items()
                },
            }
        )

    payload = {
        "image": image_path.name,
        "coordinate_system": {
            "origin": "center of the breadboard",
            "x_direction": "along the columns, left to right",
            "y_direction": "across the rows, top to bottom",
            "units": "model units; not calibrated millimeters",
            "width": board_width,
            "height": board_height,
        },
        "breadboard": {
            "confidence": round(board_detection.score, 4),
            "corners_pixel": {
                name: {"x": round(float(point[0]), 2), "y": round(float(point[1]), 2)}
                for name, point in zip(("P1", "P2", "P3", "P4"), board_corners)
            },
        },
        "components": components,
    }
    json_path = output_dir / f"{image_path.stem}.json"
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    annotated = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    cv2.polylines(annotated, [board_corners.astype(np.int32)], True, (60, 200, 80), 3)
    for name, point in zip(("P1", "P2", "P3", "P4"), board_corners.astype(int)):
        cv2.circle(annotated, tuple(point), 7, (60, 200, 80), -1)
        cv2.putText(annotated, name, tuple(point + [8, -8]), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (30, 120, 40), 2)
    for component, detection in zip(components, detections):
        x1, y1, x2, y2 = (int(round(value)) for value in detection.box)
        color = (40, 100, 235)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        cv2.putText(
            annotated,
            f"{component['id']} {detection.label} {detection.score:.2f}",
            (x1, max(20, y1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            color,
            2,
        )
        for name, point in component["points"].items():
            px, py = (int(round(point["pixel"][axis])) for axis in ("x", "y"))
            cv2.circle(annotated, (px, py), 4 if name == "centro" else 3, (20, 20, 235), -1)
            cv2.putText(annotated, name, (px + 4, py - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (20, 20, 180), 1)
    image_path_out = output_dir / f"{image_path.stem}_annotated.jpg"
    if not cv2.imwrite(str(image_path_out), annotated):
        raise OSError(f"No se pudo guardar la imagen anotada: {image_path_out}")

    print(f"\n{image_path.name}: {len(components)} componente(s)")
    for component in components:
        print(f"  {component['id']} {component['class']} ({component['confidence']:.2f})")
        for name, points in component["points"].items():
            board = points["board"]
            print(
                f"    {name}: imagen ({points['pixel']['x']:.1f}, {points['pixel']['y']:.1f})"
                f" -> tablero ({board['x']:.2f}, {board['y']:.2f})"
            )
    print(f"  JSON: {json_path}")
    print(f"  Imagen anotada: {image_path_out}")


def process_image(
    image_path: Path,
    processor: Any,
    model: Any,
    device: torch.device,
    threshold: float,
    board_width: float,
    board_height: float,
    output_dir: Path,
) -> None:
    with Image.open(image_path) as source:
        image = source.convert("RGB")
    image_rgb = np.asarray(image)
    detections = detect_objects(image, processor, model, device, threshold)
    boards = [item for item in detections if item.label == BOARD_LABEL]
    if not boards:
        raise ValueError(
            f"No detecté el protoboard en {image_path.name}. "
            "Asegúrate de que se vea completo y prueba una foto con mejor contraste."
        )
    board_detection = max(boards, key=lambda item: item.score)
    components = [item for item in detections if item.label != BOARD_LABEL]
    board_corners = detect_board_corners(image_rgb, board_detection.box)
    save_outputs(
        image_path,
        image_rgb,
        board_corners,
        board_detection,
        components,
        board_width,
        board_height,
        output_dir,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Detecta componentes y mapea sus puntos al plano del protoboard.")
    parser.add_argument("--input-dir", type=Path, default=INPUT_DIR, help="Carpeta con imágenes de entrada.")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR, help="Carpeta para JSON e imágenes anotadas.")
    parser.add_argument("--threshold", type=float, default=0.22, help="Umbral de confianza del detector.")
    parser.add_argument("--board-width", type=float, default=400.0, help="Ancho del tablero en unidades de modelo.")
    parser.add_argument("--board-height", type=float, default=230.0, help="Alto del tablero en unidades de modelo.")
    args = parser.parse_args()
    if not 0 < args.threshold < 1:
        parser.error("--threshold debe estar entre 0 y 1.")
    if args.board_width <= 0 or args.board_height <= 0:
        parser.error("--board-width y --board-height deben ser mayores que cero.")

    images = sorted(
        path for path in args.input_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
    ) if args.input_dir.is_dir() else []
    if not images:
        raise FileNotFoundError(f"No hay imágenes compatibles en {args.input_dir}. Copia una foto a esa carpeta.")

    print(f"Cargando {MODEL_ID}. La primera ejecución descarga el modelo; las fotos se procesan localmente.")
    processor, model, device = load_detector()
    print(f"Dispositivo: {device}")
    for image_path in images:
        process_image(
            image_path,
            processor,
            model,
            device,
            args.threshold,
            args.board_width,
            args.board_height,
            args.output_dir,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
