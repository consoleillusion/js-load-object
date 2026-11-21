import { createRequire } from "node:module";
import { dirname, extname, isAbsolute, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  evaluate,
  formatDiagnostic,
  formatValue,
  initializeEngine,
} from "dhall-wasm/packages/core/src/index.ts";
import type { DhallEnvironment, ImportRequest } from "dhall-wasm/packages/core/src/index.ts";
import { createLoadError } from "../errors.js";
import { createFsDeps } from "../io/fs.js";
import { createHttpDeps, fetchResource } from "../io/http.js";
import { defaultOptions } from "../options.js";
import type {
  FsDeps,
  HttpDeps,
  ParseContent,
  ParseContext,
  ResolvedOptions,
} from "../types.js";

const hasScheme = (value: string): boolean => /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value);

const require = createRequire(import.meta.url);

const bundledWasmUrl = (): URL => {
  const packageJsonPath = require.resolve("dhall-wasm/package.json");
  return pathToFileURL(resolvePath(dirname(packageJsonPath), "packages/engine/wasm/engine.wasm"));
};

const configuredWasmUrl = (): URL | undefined => {
  const configured = process.env.DHALL_WASM_ENGINE;
  if (!configured) return undefined;
  if (hasScheme(configured)) return new URL(configured);
  return pathToFileURL(resolvePath(configured));
};

let engineInitialization: Promise<void> | undefined;

const ensureEngine = async (): Promise<void> => {
  engineInitialization ??= initializeEngine({ wasmUrl: configuredWasmUrl() ?? bundledWasmUrl() }).then(
    () => undefined,
    (error: unknown) => {
      engineInitialization = undefined;
      throw error;
    }
  );
  return engineInitialization;
};

const sourceDirectory = (source: string | undefined, fallback: string): string => {
  if (!source || source.startsWith("<")) return fallback;
  return extname(source) ? dirname(source) : source;
};

const importUrl = (
  request: ImportRequest,
  context: ParseContext,
  options: ResolvedOptions
): URL => {
  const specifier = request.specifier;
  if (hasScheme(specifier)) return new URL(specifier);

  const base = request.baseDirectory ?? context.source ?? options.base;
  if (base && hasScheme(base)) {
    const baseUrl = new URL(base);
    return new URL(specifier, baseUrl.href.endsWith("/") ? baseUrl : new URL(".", baseUrl));
  }

  const directory = sourceDirectory(base, options.base);
  const basePath = isAbsolute(directory) ? directory : resolvePath(options.base, directory);
  return pathToFileURL(resolvePath(basePath, specifier));
};

const verifyIntegrity = async (text: string, expectedHash: string | undefined): Promise<void> => {
  if (!expectedHash) return;
  const match = /^sha256:([0-9a-fA-F]{64})$/.exec(expectedHash);
  if (!match?.[1]) {
    throw new Error(`Unsupported Dhall integrity hash: ${expectedHash}`);
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (actual !== match[1].toLowerCase()) {
    throw new Error(`Dhall import integrity check failed for ${expectedHash}`);
  }
};

export interface DhallParserDeps {
  readonly fs: FsDeps;
  readonly http: HttpDeps;
}

const parserDeps = (deps?: DhallParserDeps): DhallParserDeps =>
  deps ?? { fs: createFsDeps(), http: createHttpDeps() };

const createEnvironment = (
  deps: DhallParserDeps,
  context: ParseContext,
  options: ResolvedOptions
): DhallEnvironment => ({
  async resolveImport(request) {
    if (/^env:/.test(request.specifier)) {
      throw new Error(`Missing environment variable import: ${request.specifier}`);
    }
    const url = importUrl(request, context, options);
    let text: string;
    let source: string;

    if (url.protocol === "file:") {
      source = fileURLToPath(url);
      text = await deps.fs.readTextFile(source);
    } else {
      source = url.toString();
      const content = await fetchResource(deps.http, url, "dhall", options.http);
      if (typeof content !== "string") {
        throw new Error(`Dhall import did not return text: ${source}`);
      }
      text = content;
    }

    await verifyIntegrity(text, request.expectedHash);
    return { text, source };
  },
});

export const createDhallParser = (deps?: DhallParserDeps, options?: ResolvedOptions) => {
  const resolvedDeps = parserDeps(deps);
  return async (content: ParseContent, context: ParseContext): Promise<unknown> => {
    const source = typeof content === "string" ? content : new TextDecoder().decode(content);
    const resolvedOptions = options ?? defaultOptions(process.cwd());
    try {
      await ensureEngine();
      const result = await evaluate(source, {
        format: "json",
        sourcePath: context.source,
        environment: createEnvironment(resolvedDeps, context, resolvedOptions),
      });
      if (!result.ok) {
        throw createLoadError({
          code: "PARSE_ERROR",
          message: formatDiagnostic(result.error),
          source: context.source,
          format: "dhall",
          cause: result.error,
        });
      }
      return result.value;
    } catch (error) {
      if (error instanceof Error && error.name === "LoadError") throw error;
      throw createLoadError({
        code: "PARSE_ERROR",
        message: `Failed to parse Dhall from ${context.source}: ${error instanceof Error ? error.message : String(error)}`,
        source: context.source,
        format: "dhall",
        cause: error,
      });
    }
  };
};

export const createDhallStringifier = () => async (value: unknown): Promise<string> => {
  try {
    return formatValue(value, "dhall");
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify Dhall: ${error instanceof Error ? error.message : String(error)}`,
      format: "dhall",
      cause: error,
    });
  }
};
