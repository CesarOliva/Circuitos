import { spawn } from "node:child_process";

export interface ProcessResult {
    code: number;
    stdout: string;
    stderr: string;
}

export async function runProcess(
    command: string,
    args: readonly string[],
    options: { cwd?: string; signal?: AbortSignal; timeoutMs: number; outputLimit?: number },
): Promise<ProcessResult> {
    const outputLimit = options.outputLimit ?? 1024 * 1024;
    return await new Promise((resolve, reject) => {
        if (options.signal?.aborted) return reject(abortError());

        const child = spawn(command, [...args], { cwd: options.cwd, windowsHide: true, shell: false });
        let stdout = "";
        let stderr = "";
        let bytes = 0;
        let settled = false;
        const finish = (error?: Error, result?: ProcessResult) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            options.signal?.removeEventListener("abort", onAbort);
            if (error) reject(error);
            else resolve(result!);
        };
        const kill = () => child.kill("SIGKILL");
        const onAbort = () => { kill(); finish(abortError()); };
        const timer = setTimeout(() => { kill(); finish(new Error(`Process timed out after ${options.timeoutMs} ms`)); }, options.timeoutMs);

        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");
        child.stdout.on("data", (chunk: string) => {
            bytes += Buffer.byteLength(chunk);
            if (bytes > outputLimit) { kill(); finish(new Error("Process output exceeded the configured limit")); return; }
            stdout += chunk;
        });
        child.stderr.on("data", (chunk: string) => {
            bytes += Buffer.byteLength(chunk);
            if (bytes > outputLimit) { kill(); finish(new Error("Process output exceeded the configured limit")); return; }
            stderr += chunk;
        });
        child.once("error", error => finish(error));
        child.once("close", code => finish(undefined, { code: code ?? -1, stdout, stderr }));
        options.signal?.addEventListener("abort", onAbort, { once: true });
    });
}

function abortError() {
    const error = new Error("Simulation was cancelled");
    error.name = "AbortError";
    return error;
}
