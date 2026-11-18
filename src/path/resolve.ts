import { isAbsolute, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import type { LoadInput, ResolvedInput } from "../types.js";
import { formatFromPath, formatFromUrl } from "./format.js";

const isUrlLike = (value: string): boolean => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);

export const toFilePathFromUrl = (url: URL): string => fileURLToPath(url);

export const resolveLocalPath = (input: string, base: string): string => {
  // If base is a URL string (non-file context) it's unexpected for local path resolution; fall back to cwd-like resolution.
  if (isAbsolute(input)) return resolvePath(input);
  // base may be a file URL string
  if (isUrlLike(base)) {
    try {
      const baseUrl = new URL(base);
      if (baseUrl.protocol === "file:") {
        return resolvePath(toFilePathFromUrl(baseUrl), input);
      }
    } catch {
      // fall through
    }
  }
  return resolvePath(base, input);
};

export const resolveInput = (input: LoadInput, base: string): ResolvedInput => {
  if (input instanceof URL) {
    if (input.protocol === "file:") {
      const path = resolvePath(toFilePathFromUrl(input));
      return { kind: "file", path, format: formatFromPath(path), source: input };
    }
    return { kind: "url", url: new URL(input.toString()), format: formatFromUrl(input), source: input };
  }

  const str = String(input);

  if (isUrlLike(str)) {
    let url: URL;
    try {
      url = new URL(str);
    } catch {
      // Treat as local path if URL parsing fails but matched scheme-like pattern oddly
      const path = resolveLocalPath(str, base);
      return { kind: "file", path, format: formatFromPath(path), source: str };
    }
    if (url.protocol === "file:") {
      const path = resolvePath(toFilePathFromUrl(url));
      return { kind: "file", path, format: formatFromPath(path), source: str };
    }
    return { kind: "url", url, format: formatFromUrl(url), source: str };
  }

  const path = resolveLocalPath(str, base);
  return { kind: "file", path, format: formatFromPath(path), source: str };
};

export const childPath = (dir: string, entry: string): string => join(dir, entry);
