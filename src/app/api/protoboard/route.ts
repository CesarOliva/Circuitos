import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

export const runtime = "nodejs";

const run = promisify(execFile);
const maxImageBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")) > maxImageBytes + 65536) {
    return Response.json({ error: "La foto debe pesar 8 MB o menos." }, { status: 413 });
  }

  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return Response.json({ error: "Selecciona una foto del protoboard." }, { status: 400 });
  }
  if (photo.size > maxImageBytes) {
    return Response.json({ error: "La foto debe pesar 8 MB o menos." }, { status: 413 });
  }

  const mapper = join(process.cwd(), "protoboard_mapper");
  const localPython = process.platform === "win32"
    ? join(mapper, ".venv", "Scripts", "python.exe")
    : join(mapper, ".venv", "bin", "python");
  const python = process.env.PROTOBOARD_PYTHON
    ?? (existsSync(localPython) ? localPython : process.platform === "win32" ? "python" : "python3");

  let directory: string | undefined;
  try {
    directory = await mkdtemp(join(tmpdir(), "circuitos-photo-"));
    const image = join(directory, "upload");
    await writeFile(image, Buffer.from(await photo.arrayBuffer()));
    const { stdout } = await run(python, [join(mapper, "analyze.py"), "--import-image", image], {
      timeout: 180_000,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });
    const result = JSON.parse(stdout);
    return Response.json(result, { status: result.error ? 422 : 200 });
  } catch (error) {
    console.error("Error al ejecutar el analizador de protoboard", error);
    return Response.json(
      { error: "No se pudo analizar la foto. Revisa que el entorno de protoboard_mapper y su modelo estén disponibles." },
      { status: 503 },
    );
  } finally {
    if (directory) {
      await rm(directory, { recursive: true, force: true }).catch(error => {
        console.error("No se pudo borrar la carpeta temporal de la foto", error);
      });
    }
  }
}
