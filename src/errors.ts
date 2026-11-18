import type { LoadErrorCode, LoadErrorDetails } from "./types.js";

export class LoadError extends Error {
  readonly code: LoadErrorCode;
  readonly source?: string;
  readonly format?: string;
  override readonly cause?: unknown;

  constructor(details: LoadErrorDetails) {
    super(details.message);
    this.name = "LoadError";
    this.code = details.code;
    this.source = details.source;
    this.format = details.format;
    this.cause = details.cause;
  }
}

export const createLoadError = (details: LoadErrorDetails): LoadError => new LoadError(details);

export const asLoadError = (error: unknown, fallback: LoadErrorDetails): LoadError => {
  if (error instanceof LoadError) return error;
  return createLoadError({ ...fallback, cause: error });
};

export const isNodeErrno = (error: unknown): error is NodeJS.ErrnoException =>
  typeof error === "object" && error !== null && "code" in error;

export const toIoLoadError = (error: unknown, source: string): LoadError => {
  if (error instanceof LoadError) return error;
  if (isNodeErrno(error) && error.code === "ENOENT") {
    return createLoadError({
      code: "NOT_FOUND",
      message: `Not found: ${source}`,
      source,
      cause: error,
    });
  }
  const message = error instanceof Error ? error.message : String(error);
  return createLoadError({
    code: "IO_ERROR",
    message: `I/O error for ${source}: ${message}`,
    source,
    cause: error,
  });
};
