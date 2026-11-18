import { fromPairs } from "ramda";
import { createLoadError, toIoLoadError } from "./errors.js";
import { createFsDeps } from "./io/fs.js";
import { createHttpDeps, fetchResource, isBinaryFormat } from "./io/http.js";
import { createProcDeps } from "./io/proc.js";
import { resolveOptions } from "./options.js";
import { formatFromPath } from "./path/format.js";
import { childPath, resolveInput } from "./path/resolve.js";
import { createParserRegistry } from "./parsers/registry.js";
import type {
  Format,
  LoadDeps,
  LoadInput,
  LoadOptions,
  ParseContent,
  ResolvedDirectory,
  ResolvedFile,
  ResolvedOptions,
  ResolvedUrl,
} from "./types.js";
import { LoadError } from "./errors.js";
import { createStringify } from "./stringify.js";

export const parse = async (content: ParseContent, format: Format, options?: LoadOptions): Promise<unknown> => {
  const deps = createDefaultDeps();
  const resolvedOptions = resolveOptions(options, deps.cwd());
  return parseContent(content, format, "<string>", resolvedOptions, deps);
};

export const createDefaultDeps = (): LoadDeps => ({
  fs: createFsDeps(),
  http: createHttpDeps(),
  proc: createProcDeps(),
  cwd: () => process.cwd(),
});

const isFormatAllowed = (format: Format | null, options: ResolvedOptions): format is Format =>
  format !== null && options.formats.includes(format);

const ensureFormatEnabled = (format: Format, options: ResolvedOptions): void => {
  if (format === "dhall" && !options.dhall.enabled) {
    throw createLoadError({
      code: "DISABLED_FORMAT",
      message:
        "Dhall support is disabled by default. Enable it with { dhall: { enabled: true } } or use loadDhall/parseDhall, and ensure dhall-to-json is installed.",
      format,
    });
  }
};

const readLocalContent = async (
  deps: LoadDeps,
  resolved: ResolvedFile,
  format: Format
): Promise<ParseContent> => {
  try {
    if (isBinaryFormat(format)) {
      return await deps.fs.readFile(resolved.path);
    }
    return await deps.fs.readTextFile(resolved.path);
  } catch (error) {
    throw toIoLoadError(error, resolved.path);
  }
};

const parseContent = async (
  content: ParseContent,
  format: Format,
  source: string,
  options: ResolvedOptions,
  deps: LoadDeps
): Promise<unknown> => {
  ensureFormatEnabled(format, options);
  const registry = createParserRegistry(options, deps.proc);
  const parser = registry[format];
  if (!parser) {
    throw createLoadError({
      code: "UNSUPPORTED_FORMAT",
      message: `No parser available for format: ${format}`,
      source,
      format,
    });
  }
  try {
    return await parser(content, { format, source });
  } catch (error) {
    if (error instanceof LoadError) {
      if (!error.source) {
        throw new LoadError({ code: error.code, message: error.message, source, format: error.format ?? format, cause: error.cause });
      }
      throw error;
    }
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse ${format} from ${source}: ${error instanceof Error ? error.message : String(error)}`,
      source,
      format,
      cause: error,
    });
  }
};

const loadFileResolved = async (
  deps: LoadDeps,
  resolved: ResolvedFile,
  options: ResolvedOptions
): Promise<unknown> => {
  const { format } = resolved;
  if (!isFormatAllowed(format, options)) {
    throw createLoadError({
      code: "UNSUPPORTED_FORMAT",
      message: `Unsupported or undetected format for: ${resolved.path}`,
      source: resolved.path,
      format: format ?? undefined,
    });
  }
  const content = await readLocalContent(deps, resolved, format);
  return parseContent(content, format, resolved.path, options, deps);
};

const loadUrlResolved = async (
  deps: LoadDeps,
  resolved: ResolvedUrl,
  options: ResolvedOptions
): Promise<unknown> => {
  const { format } = resolved;
  if (!isFormatAllowed(format, options)) {
    throw createLoadError({
      code: "UNSUPPORTED_FORMAT",
      message: `Unsupported or undetected format for URL: ${resolved.url.toString()}`,
      source: resolved.url.toString(),
      format: format ?? undefined,
    });
  }
  const content = await fetchResource(deps.http, resolved.url, format, options.http);
  return parseContent(content, format, resolved.url.toString(), options, deps);
};

const loadDirectoryResolved = async (
  deps: LoadDeps,
  resolved: ResolvedDirectory,
  options: ResolvedOptions,
  loadFn: (input: LoadInput, options?: LoadOptions) => Promise<unknown>
): Promise<Record<string, unknown>> => {
  let entries: readonly string[];
  try {
    entries = await deps.fs.readdir(resolved.path);
  } catch (error) {
    throw toIoLoadError(error, resolved.path);
  }

  const sorted = [...entries].sort();
  const pairs = await Promise.all(
    sorted.map(async (entry) => {
      const fullPath = childPath(resolved.path, entry);
      try {
        const st = await deps.fs.stat(fullPath);
        if (st.isDirectory()) {
          if (!options.directory.recursive) return null;
          const value = await loadDirectoryResolved(
            deps,
            { kind: "directory", path: fullPath, source: fullPath },
            options,
            loadFn
          );
          return [entry, value] as const;
        }
        if (!st.isFile()) return null;

        // Determine if we should attempt to load this file based on format/allowance
        const childResolved = resolveInput(fullPath, options.base);
        if (childResolved.kind !== "file") return null;
        const fmt = childResolved.format;
        const knownAllowed = isFormatAllowed(fmt, options);
        const dhallDisabled = fmt === "dhall" && !options.dhall.enabled;
        if (!knownAllowed || dhallDisabled) {
          // skip unknown/unsupported/disabled formats by default
          return null;
        }

        const value = await loadFileResolved(deps, childResolved, options);
        return [entry, value] as const;
      } catch (error) {
        if (options.directory.includeUnknown) {
          // includeUnknown does not mean swallow real errors from known loads except unsupported; but for safety skip problematic entries? 
        }
        // For known load failures, propagate to be explicit and secure-by-default
        if (error instanceof LoadError && error.code === "UNSUPPORTED_FORMAT") {
          return null;
        }
        throw error;
      }
    })
  );

  const filtered = pairs.filter((p): p is readonly [string, unknown] => p !== null);
  return fromPairs(filtered as Array<[string, unknown]>);
};

export interface Loader {
  (input: LoadInput, options?: LoadOptions): Promise<unknown>;
  load: (input: LoadInput, options?: LoadOptions) => Promise<unknown>;
  loadDhall: (input: LoadInput, options?: Omit<LoadOptions, "dhall"> & { dhall?: Omit<NonNullable<LoadOptions["dhall"]>, "enabled"> }) => Promise<unknown>;
  parse: (content: ParseContent, format: Format, options?: LoadOptions) => Promise<unknown>;
  parseDhall: (content: ParseContent, options?: Omit<LoadOptions, "dhall"> & { dhall?: Omit<NonNullable<LoadOptions["dhall"]>, "enabled"> }) => Promise<unknown>;
  stringify: (value: unknown, format: Format, options?: LoadOptions) => Promise<string | Uint8Array>;
  stringifyDhall: (value: unknown) => Promise<string>;
}

export const createLoader = (depsInput?: Partial<LoadDeps>): Loader => {
  const defaults = createDefaultDeps();
  const deps: LoadDeps = {
    fs: depsInput?.fs ?? defaults.fs,
    http: depsInput?.http ?? defaults.http,
    proc: depsInput?.proc ?? defaults.proc,
    cwd: depsInput?.cwd ?? defaults.cwd,
  };

  const load = async (input: LoadInput, options?: LoadOptions): Promise<unknown> => {
    const resolvedOptions = resolveOptions(options, deps.cwd());
    const resolved = resolveInput(input, resolvedOptions.base);

    if (resolved.kind === "url") {
      return loadUrlResolved(deps, resolved, resolvedOptions);
    }

    // local path: determine file vs directory via fs stat
    let st: { isFile(): boolean; isDirectory(): boolean };
    try {
      st = await deps.fs.stat(resolved.path);
    } catch (error) {
      throw toIoLoadError(error, resolved.path);
    }

    if (st.isDirectory()) {
      const dirResolved: ResolvedDirectory = { kind: "directory", path: resolved.path, source: resolved.source };
      return loadDirectoryResolved(deps, dirResolved, resolvedOptions, load);
    }

    if (st.isFile()) {
      const fileResolved: ResolvedFile = {
        kind: "file",
        path: resolved.path,
        format: formatFromPath(resolved.path),
        source: resolved.source,
      };
      return loadFileResolved(deps, fileResolved, resolvedOptions);
    }

    throw createLoadError({
      code: "RESOLVE_ERROR",
      message: `Path is neither a regular file nor a directory: ${resolved.path}`,
      source: resolved.path,
    });
  };

  const parseFn = async (content: ParseContent, format: Format, options?: LoadOptions): Promise<unknown> => {
    const resolvedOptions = resolveOptions(options, deps.cwd());
    return parseContent(content, format, "<string>", resolvedOptions, deps);
  };

  const loadDhall = async (
    input: LoadInput,
    options?: Omit<LoadOptions, "dhall"> & { dhall?: Omit<NonNullable<LoadOptions["dhall"]>, "enabled"> }
  ): Promise<unknown> =>
    load(input, { ...(options ?? {}), dhall: { enabled: true } });

  const parseDhall = async (
    content: ParseContent,
    _options?: Omit<LoadOptions, "dhall"> & { dhall?: Omit<NonNullable<LoadOptions["dhall"]>, "enabled"> }
  ): Promise<unknown> => {
    const resolvedOptions = resolveOptions({ dhall: { enabled: true } }, deps.cwd());
    return parseContent(content, "dhall", "<dhall>", resolvedOptions, deps);
  };

  const { stringify, stringifyDhall } = createStringify(deps.proc);

  const fn = load as Loader;
  fn.load = load;
  fn.loadDhall = loadDhall;
  fn.parse = parseFn;
  fn.parseDhall = parseDhall;
  fn.stringify = stringify;
  fn.stringifyDhall = stringifyDhall;
  return fn;
};
