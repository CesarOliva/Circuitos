"""Backend de circuit-vision en Modal: SAM 3 + clasificador DINOv2 (GPU T4) + API web (CPU).

    python -m modal run modal_app.py --path RUTA/FOTO.jpg     # prueba (la 1a vez baja los pesos)
    python -m modal deploy modal_app.py                       # publica la API con URL permanente
"""
from pathlib import Path

import modal

APP_NAME = "circuit-vision"
FILES = Path(__file__).parent / "files"
TORCH_PIN = ("torch==2.10.0", "torchvision")      # lo que indica el README de SAM 3 (CUDA 12.8)
TORCH_INDEX = "https://download.pytorch.org/whl/cu128"

app = modal.App(APP_NAME)

hf_secret = modal.Secret.from_name("huggingface-secret")   # debe traer HF_TOKEN
api_secret = modal.Secret.from_name("circuit-api-key")     # debe traer API_KEY
cache = modal.Volume.from_name("circuit-vision-cache", create_if_missing=True)

# ---------------------------------------------------------------- imágenes
gpu_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git", "libgl1", "libglib2.0-0")
    .pip_install(*TORCH_PIN, index_url=TORCH_INDEX)
    .run_commands(
        "git clone --depth 1 https://github.com/facebookresearch/sam3.git /opt/sam3_repo",
        "cd /opt/sam3_repo && pip install -e .",
    )
    # einops y compañía NO los instala el paquete de SAM 3 (están en sus extras de notebooks)
    .pip_install("numpy<2", "opencv-python-headless<4.12", "matplotlib", "pillow",
                 "einops", "transformers", "scikit-learn", "pycocotools", "psutil")
    # comprobación al construir la imagen (sin GPU): si falta una librería, falla aquí y no al arrancar
    .run_commands(
        "python -c \"from sam3.model_builder import build_sam3_image_model; "
        "from sam3.model.sam3_image_processor import Sam3Processor; print('sam3 import OK')\""
    )
    .env({"HF_HOME": "/cache/hf", "TORCH_HOME": "/cache/torch", "MPLBACKEND": "Agg"})
    .add_local_dir(FILES, "/app")
)

web_image = modal.Image.debian_slim(python_version="3.12").pip_install(
    "fastapi[standard]", "pillow"
)


# ---------------------------------------------------------------- GPU: detector
def _mask_polygon(d, eps=2.0):
    import cv2
    import numpy as np

    m = d["mask"].astype(np.uint8)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return []
    c = max(cnts, key=cv2.contourArea)
    c = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
    ox, oy = d["origin"]
    return [[int(x + ox), int(y + oy)] for x, y in c]


@app.cls(
    image=gpu_image,
    gpu="T4",
    secrets=[hf_secret],
    volumes={"/cache": cache},
    timeout=900,              # máximo por foto
    scaledown_window=300,     # segundos que se mantiene encendido tras la última foto
    max_containers=1,         # tope de gasto: una GPU a la vez
)
class Detector:
    @modal.enter()
    def load(self):
        import sys

        sys.path.insert(0, "/app")
        from sam3.model.sam3_image_processor import Sam3Processor
        from sam3.model_builder import build_sam3_image_model
        from dino_classifier import DinoClassifier

        processor = Sam3Processor(build_sam3_image_model())
        clf = DinoClassifier("/app")
        # mosaic.py es el mismo script del notebook: espera `processor` y (opcional) `clf`
        self.ns = {"__name__": "__main__", "processor": processor, "clf": clf}
        exec(compile((FILES_IN_CONTAINER / "mosaic.py").read_text(), "mosaic.py", "exec"), self.ns)
        try:
            cache.commit()    # guarda en el volumen los pesos descargados
        except Exception as e:
            print("aviso: no se pudo confirmar el volumen:", e)

    @modal.method()
    def analyze(self, jpeg_bytes: bytes) -> dict:
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".jpg") as f:
            f.write(jpeg_bytes)
            f.flush()
            image, dets = self.ns["analyze"](f.name)
        labels = self.ns["LABELS"]
        comps = []
        for i, d in enumerate(dets):
            x1, y1, x2, y2 = d["box"]
            comps.append({
                "id": i, "type": d.get("type") or labels[d["prompt"]], "value": None,
                "confidence": round(d["score"], 3),
                "sam_type": labels[d["prompt"]], "type_confidence": d.get("type_prob"),
                "bbox": [round(x1), round(y1), round(x2 - x1), round(y2 - y1)],
                "mask_polygon": _mask_polygon(d),
            })
        return {"image": {"width": image.width, "height": image.height}, "components": comps}


FILES_IN_CONTAINER = Path("/app")


# ---------------------------------------------------------------- CPU: API web
@app.function(image=web_image, secrets=[api_secret])
@modal.concurrent(max_inputs=20)
@modal.asgi_app()
def api():
    import hmac
    import io
    import os

    from fastapi import FastAPI, File, Header, HTTPException, UploadFile
    from PIL import Image, ImageOps

    MAX_UPLOAD = 15 * 1024 * 1024
    MAX_SIDE = 2000
    web = FastAPI()

    def check(key):
        expected = os.environ["API_KEY"]
        if not key or not hmac.compare_digest(key, expected):
            raise HTTPException(401, "API key inválida")

    @web.get("/health")
    def health():
        return {"ok": True}

    @web.post("/analyze")
    async def analyze(file: UploadFile = File(...), x_api_key: str = Header(None)):
        check(x_api_key)
        raw = await file.read()
        if len(raw) > MAX_UPLOAD:
            raise HTTPException(413, "La foto es demasiado grande (máximo 15 MB)")
        try:
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
        except Exception:
            raise HTTPException(400, "No se pudo leer la imagen")
        if max(img.size) > MAX_SIDE:
            img.thumbnail((MAX_SIDE, MAX_SIDE))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        detector = modal.Cls.from_name(APP_NAME, "Detector")
        call = await detector().analyze.spawn.aio(buf.getvalue())
        return {"job_id": call.object_id}

    @web.get("/jobs/{job_id}")
    async def job(job_id: str, x_api_key: str = Header(None)):
        check(x_api_key)
        call = modal.FunctionCall.from_id(job_id)
        try:
            result = await call.get.aio(timeout=0)
        except TimeoutError:
            return {"status": "running"}
        except modal.exception.OutputExpiredError:
            raise HTTPException(404, "job no encontrado o expirado")
        except Exception as e:                     # error dentro del detector
            return {"status": "error", "error": f"{type(e).__name__}: {e}"}
        return {"status": "done", "result": result}

    return web


# ---------------------------------------------------------------- prueba local
@app.local_entrypoint()
def main(path: str):
    """python -m modal run modal_app.py --path foto.jpg"""
    import time

    data = Path(path).read_bytes()
    t = time.time()
    res = Detector().analyze.remote(data)
    counts = {}
    for c in res["components"]:
        counts[c["type"]] = counts.get(c["type"], 0) + 1
    print(f"{len(res['components'])} componentes en {time.time() - t:.0f} s: {counts}")