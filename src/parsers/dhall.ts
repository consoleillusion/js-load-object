import { createLoadError } from "../errors.js";
import { DHALL_TOOL_DEFAULTS } from "../options.js";
import type { ParseContent, ProcDeps } from "../types.js";

const isLoadErrorLike = (error: any): boolean =>
  error?.name === "LoadError" || (error?.code && typeof error.code === "string" && ["TIMEOUT", "EXTERNAL_TOOL_ERROR", "PARSE_ERROR", "SERIALIZE_ERROR", "LIMIT_EXCEEDED"].includes(error.code));

export const createDhallParser = (proc: ProcDeps) => {
  const { parseCommand, args, timeoutMs, maxBytes } = DHALL_TOOL_DEFAULTS;
  return async (content: ParseContent): Promise<unknown> => {
    const input = typeof content === "string" ? content : new TextDecoder().decode(content);
    try {
      const result = await proc.execFile(parseCommand, args, {
        input,
        timeoutMs,
        maxBytes,
      });

      if (result.timedOut) {
        throw createLoadError({
          code: "TIMEOUT",
          message: `Dhall conversion timed out after ${timeoutMs}ms`,
          format: "dhall",
        });
      }

      if (result.exitCode !== 0) {
        const stderr = (result.stderr || "").trim().slice(0, 2000);
        throw createLoadError({
          code: "EXTERNAL_TOOL_ERROR",
          message: `dhall-to-json failed (exit ${result.exitCode})${stderr ? `: ${stderr}` : ""}`,
          format: "dhall",
        });
      }

      try {
        return JSON.parse(result.stdout) as unknown;
      } catch (error) {
        throw createLoadError({
          code: "PARSE_ERROR",
          message: `Failed to parse dhall-to-json output as JSON: ${error instanceof Error ? error.message : String(error)}`,
          format: "dhall",
          cause: error,
        });
      }
    } catch (error: any) {
      if (isLoadErrorLike(error)) throw error;
      if (error?.code === "ENOENT") {
        throw createLoadError({
          code: "EXTERNAL_TOOL_ERROR",
          message: `Dhall tool not found: '${parseCommand}'. Install dhall-to-json and ensure it is on PATH.`,
          format: "dhall",
          cause: error,
        });
      }
      if (error?.code === "LIMIT_EXCEEDED") {
        throw createLoadError({
          code: "LIMIT_EXCEEDED",
          message: `Dhall conversion output exceeded maxBytes (${maxBytes})`,
          format: "dhall",
          cause: error,
        });
      }
      throw createLoadError({
        code: "EXTERNAL_TOOL_ERROR",
        message: `Failed to execute Dhall conversion: ${error instanceof Error ? error.message : String(error)}`,
        format: "dhall",
        cause: error,
      });
    }
  };
};

export const createDhallStringifier = (proc: ProcDeps) => {
  const { stringifyCommand, stringifyArgs, timeoutMs, maxBytes } = DHALL_TOOL_DEFAULTS;
  return async (value: unknown): Promise<string> => {
    let input: string;
    try {
      input = JSON.stringify(value);
    } catch (error) {
      throw createLoadError({
        code: "SERIALIZE_ERROR",
        message: `Failed to encode value as JSON for json-to-dhall: ${error instanceof Error ? error.message : String(error)}`,
        format: "dhall",
        cause: error,
      });
    }
    try {
      const result = await proc.execFile(stringifyCommand, stringifyArgs, {
        input,
        timeoutMs,
        maxBytes,
      });

      if (result.timedOut) {
        throw createLoadError({
          code: "TIMEOUT",
          message: `Dhall stringify timed out after ${timeoutMs}ms`,
          format: "dhall",
        });
      }

      if (result.exitCode !== 0) {
        const stderr = (result.stderr || "").trim().slice(0, 2000);
        throw createLoadError({
          code: "EXTERNAL_TOOL_ERROR",
          message: `json-to-dhall failed (exit ${result.exitCode})${stderr ? `: ${stderr}` : ""}`,
          format: "dhall",
        });
      }

      return result.stdout;
    } catch (error: any) {
      if (isLoadErrorLike(error)) throw error;
      if (error?.code === "ENOENT") {
        throw createLoadError({
          code: "EXTERNAL_TOOL_ERROR",
          message: `Dhall tool not found: '${stringifyCommand}'. Install dhall-json (json-to-dhall) and ensure it is on PATH.`,
          format: "dhall",
          cause: error,
        });
      }
      if (error?.code === "LIMIT_EXCEEDED") {
        throw createLoadError({
          code: "LIMIT_EXCEEDED",
          message: `Dhall stringify output exceeded maxBytes (${maxBytes})`,
          format: "dhall",
          cause: error,
        });
      }
      throw createLoadError({
        code: "EXTERNAL_TOOL_ERROR",
        message: `Failed to execute Dhall stringify: ${error instanceof Error ? error.message : String(error)}`,
        format: "dhall",
        cause: error,
      });
    }
  };
};
