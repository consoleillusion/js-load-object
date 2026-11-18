import { createLoadError } from "../errors.js";
import type { Format, HttpDeps, HttpOptions, HttpResponseLike } from "../types.js";

export const isBinaryFormat = (format: Format | null): boolean => format === "cbor";

export const readResponseBody = async (
  response: HttpResponseLike,
  format: Format | null,
  maxBytes: number,
  source: string
): Promise<string | Uint8Array> => {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const len = Number(contentLength);
    if (Number.isFinite(len) && len > maxBytes) {
      throw createLoadError({
        code: "LIMIT_EXCEEDED",
        message: `Remote resource exceeds maxBytes (${maxBytes}): ${source}`,
        source,
      });
    }
  }

  if (isBinaryFormat(format)) {
    const buf = new Uint8Array(await response.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      throw createLoadError({
        code: "LIMIT_EXCEEDED",
        message: `Remote resource exceeds maxBytes (${maxBytes}): ${source}`,
        source,
      });
    }
    return buf;
  }

  const text = await response.text();
  const size = new TextEncoder().encode(text).byteLength;
  if (size > maxBytes) {
    throw createLoadError({
      code: "LIMIT_EXCEEDED",
      message: `Remote resource exceeds maxBytes (${maxBytes}): ${source}`,
      source,
    });
  }
  return text;
};

export const fetchResource = async (
  deps: HttpDeps,
  url: URL,
  format: Format | null,
  options: Required<Omit<HttpOptions, "headers">> & { readonly headers: Readonly<Record<string, string>> }
): Promise<string | Uint8Array> => {
  const source = url.toString();
  const allowed = options.allowedProtocols.map((p) => (p.endsWith(":") ? p : `${p}:`));
  if (!allowed.includes(url.protocol)) {
    throw createLoadError({
      code: "HTTP_ERROR",
      message: `Protocol not allowed: ${url.protocol}`,
      source,
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await deps.fetch(url, {
      method: "GET",
      redirect: options.followRedirects ? "follow" : "manual",
      headers: { ...(options.headers ?? {}) },
      signal: controller.signal,
    } as RequestInit);

    if (!response.ok) {
      throw createLoadError({
        code: "HTTP_ERROR",
        message: `HTTP ${response.status} ${response.statusText} for ${source}`,
        source,
      });
    }

    return await readResponseBody(response, format, options.maxBytes, source);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createLoadError({
        code: "TIMEOUT",
        message: `Request timed out after ${options.timeoutMs}ms: ${source}`,
        source,
        cause: error,
      });
    }
    if ((error as { code?: string })?.code === "LIMIT_EXCEEDED") throw error;
    if (error && typeof error === "object" && "code" in (error as any)) {
      const e = error as any;
      if (typeof e.code === "string" && ["HTTP_ERROR", "TIMEOUT", "LIMIT_EXCEEDED"].includes(e.code)) {
        throw error;
      }
    }
    throw createLoadError({
      code: "HTTP_ERROR",
      message: `Failed to fetch ${source}: ${error instanceof Error ? error.message : String(error)}`,
      source,
      cause: error,
    });
  } finally {
    clearTimeout(timer);
  }
};

export const createHttpDeps = (): HttpDeps => ({
  fetch: (url, init) => fetch(url as any, init) as unknown as Promise<HttpResponseLike>,
});
