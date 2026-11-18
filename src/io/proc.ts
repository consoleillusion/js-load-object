import { spawn } from "node:child_process";
import type { ProcDeps, ProcResult, ProcRunOptions } from "../types.js";

export const execFileSafe = (
  command: string,
  args: readonly string[],
  options: ProcRunOptions = {}
): Promise<ProcResult> =>
  new Promise((resolve, reject) => {
    const maxBytes = options.maxBytes ?? 1_048_576;
    const timeoutMs = options.timeoutMs ?? 10_000;
    const child = spawn(command, [...args], {
      shell: false,
      cwd: options.cwd,
      env: options.env ? { ...process.env, ...options.env } : process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    let timedOut = false;
    let sizeExceeded = false;

    const finishResolve = (result: ProcResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const finishReject = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
    }, timeoutMs);

    const onData = (chunk: Buffer, which: "stdout" | "stderr") => {
      const len = chunk.byteLength;
      if (which === "stdout") {
        stdoutBytes += len;
        if (stdoutBytes + stderrBytes <= maxBytes) stdout += chunk.toString("utf8");
      } else {
        stderrBytes += len;
        if (stdoutBytes + stderrBytes <= maxBytes) stderr += chunk.toString("utf8");
      }
      if (!sizeExceeded && stdoutBytes + stderrBytes > maxBytes) {
        sizeExceeded = true;
        try {
          child.kill("SIGKILL");
        } catch {
          // ignore
        }
      }
    };

    child.stdout?.on("data", (chunk: Buffer) => onData(chunk, "stdout"));
    child.stderr?.on("data", (chunk: Buffer) => onData(chunk, "stderr"));

    child.on("error", (err) => {
      clearTimeout(timer);
      finishReject(err);
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (sizeExceeded) {
        const err = new Error(`Process output exceeded maxBytes (${maxBytes})`);
        (err as any).code = "LIMIT_EXCEEDED";
        finishReject(err);
        return;
      }
      finishResolve({
        stdout,
        stderr,
        exitCode: code ?? -1,
        signal: signal ?? null,
        timedOut,
      });
    });

    try {
      if (options.input !== undefined) {
        child.stdin?.end(options.input);
      } else {
        child.stdin?.end();
      }
    } catch (err) {
      // If stdin write fails, let close/error handlers report; but ensure we don't hang.
    }
  });

export const createProcDeps = (): ProcDeps => ({
  execFile: execFileSafe,
});
