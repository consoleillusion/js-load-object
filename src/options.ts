import { mergeDeepRight } from "ramda";
import type { Format, HttpOptions, LoadOptions, ResolvedOptions } from "./types.js";

export const DEFAULT_FORMATS: readonly Format[] = [
  "json",
  "yaml",
  "yml",
  "toml",
  "xml",
  "html",
  "md",
  "cbor",
  "dhall",
];

export const DEFAULT_HTTP: Required<Omit<HttpOptions, "headers">> & { readonly headers: Readonly<Record<string, string>> } = {
  timeoutMs: 30_000,
  maxBytes: 10 * 1024 * 1024,
  allowedProtocols: ["http:", "https:"],
  followRedirects: true,
  headers: {},
};

export const defaultOptions = (cwd: string): ResolvedOptions => ({
  base: cwd,
  formats: DEFAULT_FORMATS,
  http: DEFAULT_HTTP,
  directory: {
    recursive: false,
    includeUnknown: false,
  },
  parsers: {},
});

const normalizeBase = (base: string | URL | undefined, cwd: string): string => {
  if (base === undefined) return cwd;
  if (base instanceof URL) {
    if (base.protocol !== "file:") {
      // Non-file base URL: use its string form as base context for relative URL resolution where applicable.
      return base.toString();
    }
    return base.pathname ? decodeURIComponent(base.pathname) : cwd;
  }
  return base;
};

export const resolveOptions = (options: LoadOptions | undefined, cwd: string): ResolvedOptions => {
  const baseDefaults = defaultOptions(cwd);
  if (!options) return baseDefaults;

  const merged = mergeDeepRight(baseDefaults as unknown as Record<string, unknown>, options as unknown as Record<string, unknown>) as unknown as ResolvedOptions;
  const base = normalizeBase(options.base, cwd);
  const formats = options.formats ?? baseDefaults.formats;
  const allowedProtocols = (options.http?.allowedProtocols ?? baseDefaults.http.allowedProtocols).map((p) =>
    p.endsWith(":") ? p : `${p}:`
  );

  return {
    ...merged,
    base,
    formats,
    http: {
      ...baseDefaults.http,
      ...(options.http ?? {}),
      allowedProtocols,
      headers: options.http?.headers ?? baseDefaults.http.headers,
    },
    directory: {
      ...baseDefaults.directory,
      ...(options.directory ?? {}),
    },
    parsers: options.parsers ?? {},
  };
};
