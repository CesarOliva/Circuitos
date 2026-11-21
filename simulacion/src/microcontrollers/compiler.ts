import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { BOARD_PROFILES, MAX_SKETCH_BYTES, type BoardId, type CompileDiagnostic } from "./types.ts";
import { runProcess } from "./process.ts";

export interface CompiledSketch {
    board: BoardId;
    directory: string;
    buildDirectory: string;
    artifactDirectory: string;
    artifactName: string;
    diagnostics: CompileDiagnostic[];
    output: string;
    cleanup(): Promise<void>;
}

export async function compileSketch(board: BoardId, source: string, signal?: AbortSignal): Promise<CompiledSketch> {
    const profile = BOARD_PROFILES[board];
    if (!profile) throw new Error(`Unsupported board: ${String(board)}`);
    if (Buffer.byteLength(source, "utf8") > MAX_SKETCH_BYTES) throw new Error(`Sketch exceeds ${MAX_SKETCH_BYTES} bytes`);
    if (signal?.aborted) throw abortError();

    const root = await mkdtemp(join(tmpdir(), "circuitos-mcu-"));
    const sketchDirectory = join(root, "sketch");
    const artifactDirectory = join(root, "artifacts");
    const buildDirectory = join(root, "build");
    await Promise.all([mkdir(sketchDirectory), mkdir(artifactDirectory), mkdir(buildDirectory)]);
    await writeFile(join(sketchDirectory, "sketch.ino"), source, { encoding: "utf8", flag: "wx" });

    try {
        const args = [
            ...(process.env.ARDUINO_CLI_CONFIG_FILE ? ["--config-file", process.env.ARDUINO_CLI_CONFIG_FILE] : []),
            "compile", "--fqbn", profile.fqbn, "--output-dir", artifactDirectory,
            "--build-path", buildDirectory, sketchDirectory,
        ];
        const result = await runProcess(process.env.ARDUINO_CLI_PATH || "arduino-cli", args, {
            cwd: root, signal, timeoutMs: 120_000, outputLimit: 1024 * 1024,
        });
        const output = `${result.stdout}${result.stderr}`.trim();
        if (result.code !== 0) {
            await rm(root, { recursive: true, force: true });
            return {
                board, directory: root, buildDirectory, artifactDirectory, artifactName: "", diagnostics: parseDiagnostics(output), output,
                cleanup: async () => undefined,
            };
        }
        const artifactName = board === "arduino-uno-r3" ? "sketch.ino.hex" : "sketch.ino.bin";
        await readFile(join(artifactDirectory, artifactName));
        return {
            board, directory: root, buildDirectory, artifactDirectory, artifactName,
            diagnostics: parseDiagnostics(output), output,
            cleanup: () => rm(root, { recursive: true, force: true }),
        };
    } catch (error) {
        await rm(root, { recursive: true, force: true });
        if (isMissingExecutable(error)) {
            throw new Error("Arduino CLI is not installed. Install Arduino CLI and the selected board core, then retry.");
        }
        throw error;
    }
}

export async function readCompiledArtifact(compiled: CompiledSketch): Promise<Uint8Array> {
    return await readFile(join(compiled.artifactDirectory, basename(compiled.artifactName)));
}

function parseDiagnostics(output: string): CompileDiagnostic[] {
    return output.split(/\r?\n/).flatMap(line => {
        const match = line.match(/^(.*?)(?::(\d+)(?::(\d+))?)?:\s*(warning|error):\s*(.*)$/i);
        if (!match) return [];
        const severity = match[4]!.toLowerCase() as CompileDiagnostic["severity"];
        return [{
            severity,
            message: match[5]!,
            ...(match[1] ? { file: match[1] } : {}),
            ...(match[2] ? { line: Number(match[2]) } : {}),
            ...(match[3] ? { column: Number(match[3]) } : {}),
        }];
    });
}

function isMissingExecutable(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error &&
        ((error as { code?: string }).code === "ENOENT" || (error as { code?: string }).code === "EACCES");
}

function abortError() {
    const error = new Error("Simulation was cancelled");
    error.name = "AbortError";
    return error;
}
