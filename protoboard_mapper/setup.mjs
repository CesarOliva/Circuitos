import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const mapper = fileURLToPath(new URL(".", import.meta.url));
const windows = process.platform === "win32";
const python = join(mapper, ".venv", windows ? "Scripts" : "bin", windows ? "python.exe" : "python");

function run(command, args) {
  const result = spawnSync(command, args, { cwd: mapper, stdio: "inherit", windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} falló (${result.status ?? result.signal}).`);
}

try {
  const versionCheck = "import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)";
  const existing = spawnSync(python, ["-c", versionCheck], { windowsHide: true });
  if (existing.status !== 0) {
    const candidates = windows ? [["py", "-3"], ["python"]] : [["python3"], ["python"]];
    const interpreter = candidates.find(([command, ...args]) =>
      spawnSync(command, [...args, "-c", versionCheck], { windowsHide: true }).status === 0,
    );
    if (!interpreter) throw new Error("Instala Python 3.12 o posterior y agrégalo al PATH.");
    const [command, ...args] = interpreter;
    run(command, [...args, "-m", "venv", ".venv"]);
  }

  run(python, ["-m", "pip", "install", "--timeout", "60", "-r", "requirements.txt"]);
  console.log("Preparando Grounding DINO. La primera descarga puede tardar varios minutos.");
  run(python, ["-B", "-c", "from analyze import load_detector; load_detector()"]);
  console.log("Importación de fotos lista.");
} catch (error) {
  console.error(`No se pudo preparar el mapeador. ${error.message}`);
  process.exitCode = 1;
}
