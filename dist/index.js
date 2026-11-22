var __esm = (fn, res, err) => () => {
  if (fn)
    try {
      res = fn(fn = 0);
    } catch (e) {
      err = [e];
    }
  if (err)
    throw err[0];
  return res;
};

// node_modules/dhall-wasm/packages/core/src/errors.ts
function ok(value) {
  return { ok: true, value };
}
function err(kind, message, details = {}) {
  return { ok: false, error: { kind, message, ...details } };
}
function failure(error) {
  return { ok: false, error };
}
var DhallError, EngineNotBuiltError;
var init_errors = __esm(() => {
  DhallError = class DhallError extends Error {
    diagnostic;
    constructor(diagnostic) {
      super(diagnostic.message);
      this.name = "DhallError";
      this.diagnostic = diagnostic;
    }
  };
  EngineNotBuiltError = class EngineNotBuiltError extends DhallError {
    constructor() {
      super({
        kind: "engine",
        message: "The Dhall engine is not built yet. Run the engine build (or install a published package with the prebuilt WASM artifact) before evaluating expressions."
      });
      this.name = "EngineNotBuiltError";
    }
  };
});

// node_modules/dhall-wasm/packages/engine/wasm/engine.js
class JSValManager {
  #lastk = 0;
  #kv = new Map;
  newJSVal(v) {
    const k = ++this.#lastk;
    this.#kv.set(k, v);
    return k;
  }
  getJSVal(k) {
    if (!this.#kv.has(k)) {
      throw new WebAssembly.RuntimeError(`getJSVal(${k})`);
    }
    return this.#kv.get(k);
  }
  freeJSVal(k) {
    if (!this.#kv.delete(k)) {
      throw new WebAssembly.RuntimeError(`freeJSVal(${k})`);
    }
  }
}
var setImmediate, engine_default = (__exports) => {
  const __ghc_wasm_jsffi_jsval_manager = new JSValManager;
  const __ghc_wasm_jsffi_finalization_registry = globalThis.FinalizationRegistry ? new FinalizationRegistry((sp) => __exports.rts_freeStablePtr(sp)) : { register: () => {}, unregister: () => true };
  return {
    newJSVal: (v) => __ghc_wasm_jsffi_jsval_manager.newJSVal(v),
    getJSVal: (k) => __ghc_wasm_jsffi_jsval_manager.getJSVal(k),
    freeJSVal: (k) => __ghc_wasm_jsffi_jsval_manager.freeJSVal(k),
    scheduleWork: () => setImmediate(__exports.rts_schedulerLoop),
    ZC3ZCdhallzmenginezm0zi1zi0zi0zminplacezmdhallzmengineZCMainZC: async ($1, $2) => $1($2),
    ZC0ZCghczminternalZCGHCziInternalziWasmziPrimziExportsZC: ($1, $2) => $1.reject(new WebAssembly.RuntimeError($2)),
    ZC18ZCghczminternalZCGHCziInternalziWasmziPrimziExportsZC: ($1, $2) => $1.resolve($2),
    ZC20ZCghczminternalZCGHCziInternalziWasmziPrimziExportsZC: ($1) => {
      $1.throwTo = () => {};
    },
    ZC21ZCghczminternalZCGHCziInternalziWasmziPrimziExportsZC: ($1, $2) => {
      $1.throwTo = (err) => __exports.rts_promiseThrowTo($2, err);
    },
    ZC22ZCghczminternalZCGHCziInternalziWasmziPrimziExportsZC: () => {
      let res, rej;
      const p = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
      });
      p.resolve = res;
      p.reject = rej;
      return p;
    },
    ZC17ZCghczminternalZCGHCziInternalziWasmziPrimziImportsZC: ($1, $2) => $1.then((res) => __exports.rts_promiseResolveJSVal($2, res), (err) => __exports.rts_promiseReject($2, err)),
    ZC18ZCghczminternalZCGHCziInternalziWasmziPrimziImportsZC: ($1, $2) => $1.then(() => __exports.rts_promiseResolveUnit($2), (err) => __exports.rts_promiseReject($2, err)),
    ZC0ZCghczminternalZCGHCziInternalziWasmziPrimziTypesZC: ($1) => `${$1.stack ? $1.stack : $1}`,
    ZC1ZCghczminternalZCGHCziInternalziWasmziPrimziTypesZC: ($1, $2) => new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(__exports.memory.buffer, $1, $2)),
    ZC2ZCghczminternalZCGHCziInternalziWasmziPrimziTypesZC: ($1, $2, $3) => new TextEncoder().encodeInto($1, new Uint8Array(__exports.memory.buffer, $2, $3)).written,
    ZC3ZCghczminternalZCGHCziInternalziWasmziPrimziTypesZC: ($1) => $1.length,
    ZC4ZCghczminternalZCGHCziInternalziWasmziPrimziTypesZC: ($1) => {
      try {
        __ghc_wasm_jsffi_finalization_registry.unregister($1);
      } catch {}
    },
    ZC0ZCghczminternalZCGHCziInternalziWasmziPrimziConcziInternalZC: async ($1) => new Promise((res) => setTimeout(res, $1 / 1000))
  };
};
var init_engine = __esm(() => {
  setImmediate = (() => {
    if (globalThis.setImmediate) {
      return globalThis.setImmediate;
    }
    if (globalThis.scheduler) {
      return (cb, ...args) => scheduler.postTask(() => cb(...args));
    }
    if (globalThis.MessageChannel) {

      class SetImmediate {
        #fs = [];
        #mc = new MessageChannel;
        constructor() {
          this.#mc.port1.addEventListener("message", () => {
            this.#fs.pop()();
          });
          this.#mc.port1.start();
        }
        setImmediate(cb, ...args) {
          this.#fs.push(() => cb(...args));
          this.#mc.port2.postMessage(undefined);
        }
      }
      const sm = new SetImmediate;
      return (cb, ...args) => sm.setImmediate(cb, ...args);
    }
    return (cb, ...args) => setTimeout(cb, 0, ...args);
  })();
});

// node_modules/dhall-wasm/packages/core/src/wasm.ts
function stripAnsi(text) {
  return text.replace(ANSI_ESCAPE, "");
}
function errorMessage(error) {
  return stripAnsi(error instanceof Error ? error.message : String(error));
}
function toDiagnostic(envelope) {
  const error = envelope.error ?? {};
  const kind = ERROR_KINDS.find((candidate) => candidate === error.kind) ?? "engine";
  const source = error.source && error.source.length > 0 ? error.source : undefined;
  return {
    kind,
    message: stripAnsi(error.message ?? "The Dhall engine returned an error"),
    source
  };
}
function nodeUrlModule() {
  return import("node:url");
}
function nodeFsModule() {
  return import("node:fs/promises");
}
function processEnvironment() {
  return typeof process === "undefined" ? undefined : process.env;
}
async function configuredWasmUrl() {
  const configured = processEnvironment()?.DHALL_WASM_ENGINE;
  if (!configured)
    return;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(configured)) {
    return new URL(configured);
  }
  const { pathToFileURL } = await nodeUrlModule();
  return pathToFileURL(configured);
}
async function readWasm(url) {
  if (url.protocol === "file:") {
    const { readFile } = await nodeFsModule();
    return new Uint8Array(await readFile(url));
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load Dhall engine from ${url.href}: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}
function createWasiImports(getMemory) {
  const errno = { success: 0, badf: 8, nosys: 52 };
  const withMemory = (fallback, operation) => {
    const memory = getMemory();
    return memory ? operation(new DataView(memory.buffer)) : fallback;
  };
  const writeU32 = (view, offset, value) => {
    view.setUint32(offset, value >>> 0, true);
  };
  return {
    args_get: () => errno.success,
    args_sizes_get: (argc, size) => withMemory(errno.success, (view) => {
      writeU32(view, argc, 0);
      writeU32(view, size, 0);
      return errno.success;
    }),
    environ_get: () => errno.success,
    environ_sizes_get: (count, size) => withMemory(errno.success, (view) => {
      writeU32(view, count, 0);
      writeU32(view, size, 0);
      return errno.success;
    }),
    clock_time_get: (_clock, _precision, out) => withMemory(errno.success, (view) => {
      view.setBigUint64(out, BigInt(Date.now()) * 1000000n, true);
      return errno.success;
    }),
    fd_close: () => errno.success,
    fd_fdstat_get: (fd, out) => withMemory(errno.success, (view) => {
      for (let offset = 0;offset < 24; offset += 1)
        view.setUint8(out + offset, 0);
      view.setUint8(out, fd <= 2 ? 2 : 0);
      return fd <= 2 ? errno.success : errno.badf;
    }),
    fd_fdstat_set_flags: () => errno.success,
    fd_filestat_get: () => errno.badf,
    fd_filestat_set_size: () => errno.badf,
    fd_prestat_dir_name: () => errno.badf,
    fd_prestat_get: () => errno.badf,
    fd_read: (_fd, _iovs, _len, nread) => withMemory(errno.success, (view) => {
      writeU32(view, nread, 0);
      return errno.success;
    }),
    fd_seek: () => errno.badf,
    fd_write: (_fd, iovs, len, nwritten) => withMemory(errno.success, (view) => {
      let written = 0;
      for (let index = 0;index < len; index += 1) {
        written += view.getUint32(iovs + index * 8 + 4, true);
      }
      writeU32(view, nwritten, written);
      return errno.success;
    }),
    path_create_directory: () => errno.badf,
    path_filestat_get: () => errno.badf,
    path_open: () => errno.badf,
    poll_oneoff: () => errno.success,
    proc_exit: (code) => {
      throw new Error(`Dhall engine exited with status ${code}`);
    },
    sched_yield: () => errno.success,
    random_get: () => errno.nosys
  };
}
function defaultEnvironment(remoteImports) {
  return {
    async resolveImport(request) {
      const specifier = request.specifier;
      if (/^env:/.test(specifier)) {
        throw new Error(`Missing environment variable import: ${specifier}`);
      }
      const base = request.baseDirectory;
      const hasBase = base !== undefined && /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(base);
      const browserBase = typeof location === "undefined" ? undefined : location.href;
      const url = new URL(specifier, hasBase ? base : browserBase);
      if (!remoteImports && url.protocol !== "file:" && url.protocol !== "data:") {
        throw new Error(`Remote import ${specifier} is disabled; pass remoteImports: true to allow it`);
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${specifier}: ${response.status} ${response.statusText}`);
      }
      return { text: await response.text(), source: url.href };
    }
  };
}
function requestFor(op, source, options) {
  return JSON.stringify({
    op,
    source,
    format: options.format ?? "json",
    sourcePath: options.sourcePath ?? "source",
    variables: options.environment?.variables ?? {}
  });
}
function importCallback(environment, remoteImports) {
  const resolver = environment ?? defaultEnvironment(remoteImports);
  return async (raw) => {
    try {
      const request = JSON.parse(raw);
      const resolution = await resolver.resolveImport(request);
      return JSON.stringify({
        ok: true,
        text: resolution.text,
        source: resolution.source ?? request.specifier
      });
    } catch (error) {
      return JSON.stringify({
        ok: false,
        error: { kind: "import", message: errorMessage(error) }
      });
    }
  };
}
function makeEngine(exports) {
  async function invoke(name, raw, resolve) {
    try {
      const function_ = exports[name];
      const response = await function_(resolve, raw);
      const envelope = JSON.parse(response);
      return envelope.ok ? ok(envelope.value) : failure(toDiagnostic(envelope));
    } catch (error) {
      return err("engine", errorMessage(error));
    }
  }
  return {
    evaluate(source, options = { format: "json" }) {
      return invoke("evaluate", requestFor("evaluate", source, options), importCallback(options.environment, options.remoteImports));
    },
    typeCheck(source, options = {}) {
      return invoke("typeCheck", requestFor("typeCheck", source, options), importCallback(options.environment, options.remoteImports));
    },
    describeType(source, options = {}) {
      return invoke("describeType", requestFor("describeType", source, options), importCallback(options.environment, options.remoteImports));
    }
  };
}
async function loadWasmEngine(options = {}) {
  const url = options.wasmUrl ? toUrl(options.wasmUrl) : await configuredWasmUrl() ?? DEFAULT_WASM_URL;
  const source = await readWasm(url);
  const exports = {};
  const createImports = options.createImports ?? engine_default;
  const jsffi = createImports(exports);
  let memory;
  const imports = {
    ghc_wasm_jsffi: jsffi,
    wasi_snapshot_preview1: createWasiImports(() => memory)
  };
  const { instance } = await WebAssembly.instantiate(source, imports);
  Object.assign(exports, instance.exports);
  const wasmExports = exports;
  memory = wasmExports.memory;
  wasmExports._initialize();
  return makeEngine(wasmExports);
}
function toUrl(location2) {
  return typeof location2 === "string" ? new URL(location2) : location2;
}
var DEFAULT_WASM_URL, ERROR_KINDS, ANSI_ESCAPE;
var init_wasm = __esm(() => {
  init_engine();
  init_errors();
  DEFAULT_WASM_URL = new URL("../../engine/wasm/engine.wasm", import.meta.url);
  ERROR_KINDS = [
    "parse",
    "typecheck",
    "import",
    "integrity",
    "evaluation",
    "engine",
    "unsupported"
  ];
  ANSI_ESCAPE = /\u001b\[[0-9;]*[A-Za-z]/g;
});

// src/errors.ts
class LoadError extends Error {
  code;
  source;
  format;
  cause;
  constructor(details) {
    super(details.message);
    this.name = "LoadError";
    this.code = details.code;
    this.source = details.source;
    this.format = details.format;
    this.cause = details.cause;
  }
}
var createLoadError = (details) => new LoadError(details);
var isNodeErrno = (error) => typeof error === "object" && error !== null && ("code" in error);
var toIoLoadError = (error, source) => {
  if (error instanceof LoadError)
    return error;
  if (isNodeErrno(error) && error.code === "ENOENT") {
    return createLoadError({
      code: "NOT_FOUND",
      message: `Not found: ${source}`,
      source,
      cause: error
    });
  }
  const message = error instanceof Error ? error.message : String(error);
  return createLoadError({
    code: "IO_ERROR",
    message: `I/O error for ${source}: ${message}`,
    source,
    cause: error
  });
};
// src/load.ts
import { fromPairs } from "ramda";

// src/io/fs.ts
import { readFile, readdir, stat } from "node:fs/promises";
var createFsDeps = () => ({
  stat: async (path) => stat(path),
  readFile: async (path) => new Uint8Array(await readFile(path)),
  readTextFile: async (path) => readFile(path, "utf8"),
  readdir: async (path) => readdir(path)
});

// src/io/http.ts
var isBinaryFormat = (format) => format === "cbor";
var readResponseBody = async (response, format, maxBytes, source) => {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const len = Number(contentLength);
    if (Number.isFinite(len) && len > maxBytes) {
      throw createLoadError({
        code: "LIMIT_EXCEEDED",
        message: `Remote resource exceeds maxBytes (${maxBytes}): ${source}`,
        source
      });
    }
  }
  if (isBinaryFormat(format)) {
    const buf = new Uint8Array(await response.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      throw createLoadError({
        code: "LIMIT_EXCEEDED",
        message: `Remote resource exceeds maxBytes (${maxBytes}): ${source}`,
        source
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
      source
    });
  }
  return text;
};
var fetchResource = async (deps, url, format, options) => {
  const source = url.toString();
  const allowed = options.allowedProtocols.map((p) => p.endsWith(":") ? p : `${p}:`);
  if (!allowed.includes(url.protocol)) {
    throw createLoadError({
      code: "HTTP_ERROR",
      message: `Protocol not allowed: ${url.protocol}`,
      source
    });
  }
  const controller = new AbortController;
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await deps.fetch(url, {
      method: "GET",
      redirect: options.followRedirects ? "follow" : "manual",
      headers: { ...options.headers ?? {} },
      signal: controller.signal
    });
    if (!response.ok) {
      throw createLoadError({
        code: "HTTP_ERROR",
        message: `HTTP ${response.status} ${response.statusText} for ${source}`,
        source
      });
    }
    return await readResponseBody(response, format, options.maxBytes, source);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createLoadError({
        code: "TIMEOUT",
        message: `Request timed out after ${options.timeoutMs}ms: ${source}`,
        source,
        cause: error
      });
    }
    if (error?.code === "LIMIT_EXCEEDED")
      throw error;
    if (error && typeof error === "object" && "code" in error) {
      const e = error;
      if (typeof e.code === "string" && ["HTTP_ERROR", "TIMEOUT", "LIMIT_EXCEEDED"].includes(e.code)) {
        throw error;
      }
    }
    throw createLoadError({
      code: "HTTP_ERROR",
      message: `Failed to fetch ${source}: ${error instanceof Error ? error.message : String(error)}`,
      source,
      cause: error
    });
  } finally {
    clearTimeout(timer);
  }
};
var createHttpDeps = () => ({
  fetch: (url, init) => fetch(url, init)
});

// src/options.ts
import { mergeDeepRight } from "ramda";
var DEFAULT_FORMATS = [
  "json",
  "yaml",
  "yml",
  "toml",
  "xml",
  "html",
  "md",
  "cbor",
  "dhall"
];
var DEFAULT_HTTP = {
  timeoutMs: 30000,
  maxBytes: 10 * 1024 * 1024,
  allowedProtocols: ["http:", "https:"],
  followRedirects: true,
  headers: {}
};
var defaultOptions = (cwd) => ({
  base: cwd,
  formats: DEFAULT_FORMATS,
  http: DEFAULT_HTTP,
  directory: {
    recursive: false,
    includeUnknown: false
  },
  parsers: {}
});
var normalizeBase = (base, cwd) => {
  if (base === undefined)
    return cwd;
  if (base instanceof URL) {
    if (base.protocol !== "file:") {
      return base.toString();
    }
    return base.pathname ? decodeURIComponent(base.pathname) : cwd;
  }
  return base;
};
var resolveOptions = (options, cwd) => {
  const baseDefaults = defaultOptions(cwd);
  if (!options)
    return baseDefaults;
  const merged = mergeDeepRight(baseDefaults, options);
  const base = normalizeBase(options.base, cwd);
  const formats = options.formats ?? baseDefaults.formats;
  const allowedProtocols = (options.http?.allowedProtocols ?? baseDefaults.http.allowedProtocols).map((p) => p.endsWith(":") ? p : `${p}:`);
  return {
    ...merged,
    base,
    formats,
    http: {
      ...baseDefaults.http,
      ...options.http ?? {},
      allowedProtocols,
      headers: options.http?.headers ?? baseDefaults.http.headers
    },
    directory: {
      ...baseDefaults.directory,
      ...options.directory ?? {}
    },
    parsers: options.parsers ?? {}
  };
};

// src/path/format.ts
import { extname } from "node:path";
var KNOWN_FORMATS = new Set([
  "json",
  "yaml",
  "yml",
  "toml",
  "xml",
  "html",
  "md",
  "cbor",
  "dhall"
]);
var normalizeFormat = (ext) => {
  const cleaned = ext.replace(/^\./, "").toLowerCase();
  return KNOWN_FORMATS.has(cleaned) ? cleaned : null;
};
var formatFromPath = (pathLike) => {
  const ext = extname(pathLike);
  return normalizeFormat(ext);
};
var formatFromUrl = (url) => {
  const pathname = url.pathname || "";
  const ext = extname(pathname);
  if (!ext)
    return "html";
  return normalizeFormat(ext);
};

// src/path/resolve.ts
import { isAbsolute, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
var isUrlLike = (value) => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);
var toFilePathFromUrl = (url) => fileURLToPath(url);
var resolveLocalPath = (input, base) => {
  if (isAbsolute(input))
    return resolvePath(input);
  if (isUrlLike(base)) {
    try {
      const baseUrl = new URL(base);
      if (baseUrl.protocol === "file:") {
        return resolvePath(toFilePathFromUrl(baseUrl), input);
      }
    } catch {}
  }
  return resolvePath(base, input);
};
var resolveInput = (input, base) => {
  if (input instanceof URL) {
    if (input.protocol === "file:") {
      const path = resolvePath(toFilePathFromUrl(input));
      return { kind: "file", path, format: formatFromPath(path), source: input };
    }
    return { kind: "url", url: new URL(input.toString()), format: formatFromUrl(input), source: input };
  }
  const str = String(input);
  if (isUrlLike(str)) {
    let url;
    try {
      url = new URL(str);
    } catch {
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
var childPath = (dir, entry) => join(dir, entry);

// src/parsers/cbor.ts
import { decode as cborDecode } from "@ipld/dag-cbor";
var parseCbor = async (content) => {
  try {
    const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
    return await cborDecode(bytes);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse CBOR: ${error instanceof Error ? error.message : String(error)}`,
      format: "cbor",
      cause: error
    });
  }
};

// src/parsers/dhall.ts
import { createRequire } from "node:module";
import { dirname, extname as extname2, isAbsolute as isAbsolute2, resolve as resolvePath2 } from "node:path";
import { fileURLToPath as fileURLToPath2, pathToFileURL } from "node:url";

// node_modules/dhall-wasm/packages/core/src/index.ts
init_errors();

// node_modules/dhall-wasm/packages/core/src/engine.ts
init_errors();
function errorEngine(message) {
  return {
    async evaluate() {
      return err("engine", message);
    },
    async typeCheck() {
      return err("engine", message);
    },
    async describeType() {
      return err("engine", message);
    }
  };
}
var unavailable = errorEngine(new EngineNotBuiltError().message);
var explicitEngine;
var disabled = false;
var initialization;
function setEngine(engine) {
  explicitEngine = engine;
  disabled = false;
  initialization = Promise.resolve(engine);
}
async function initializeEngine(options) {
  await Promise.resolve().then(() => init_wasm());
  const engine = await loadWasmEngine(options);
  setEngine(engine);
  return engine;
}
async function ensureEngine() {
  if (explicitEngine)
    return explicitEngine;
  if (disabled)
    return unavailable;
  initialization ??= Promise.resolve().then(() => (init_wasm(), {})).then(({}) => loadWasmEngine()).then((engine) => {
    explicitEngine = engine;
    return engine;
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    const failed = errorEngine(`Unable to load the Dhall WASM engine: ${message}`);
    explicitEngine = failed;
    return failed;
  });
  return initialization;
}
async function evaluate(source, options = { format: "json" }) {
  const engine = await ensureEngine();
  return engine.evaluate(source, options);
}
async function typeCheck(source, options = {}) {
  const engine = await ensureEngine();
  return engine.typeCheck(source, options);
}
async function describeType(source, options = {}) {
  const engine = await ensureEngine();
  return engine.describeType(source, options);
}
// node_modules/dhall-wasm/packages/core/src/schema.ts
var TS_PRIMITIVES = {
  Bool: "boolean",
  Natural: "number",
  Integer: "number",
  Double: "number",
  Text: "string",
  Bytes: "Uint8Array",
  Date: "string",
  Time: "string",
  TimeZone: "string"
};
var PRIMITIVE_VALIDATORS = {
  Bool: { expected: "boolean", predicate: 'typeof candidate === "boolean"' },
  Natural: {
    expected: "non-negative integer",
    predicate: 'typeof candidate === "number" && Number.isInteger(candidate) && candidate >= 0'
  },
  Integer: {
    expected: "integer",
    predicate: 'typeof candidate === "number" && Number.isInteger(candidate)'
  },
  Double: { expected: "number", predicate: 'typeof candidate === "number"' },
  Text: { expected: "string", predicate: 'typeof candidate === "string"' },
  Bytes: { expected: "Uint8Array", predicate: "candidate instanceof Uint8Array" },
  Date: { expected: "date string", predicate: 'typeof candidate === "string"' },
  Time: { expected: "time string", predicate: 'typeof candidate === "string"' },
  TimeZone: { expected: "timezone string", predicate: 'typeof candidate === "string"' }
};
function toPascalCase(input) {
  const parts = input.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^A-Za-z0-9]+/).filter(Boolean);
  const name = parts.map((part) => part[0].toUpperCase() + part.slice(1)).join("");
  return /^[A-Za-z]/.test(name) ? name : `Dhall${name}`;
}
function isIdentifier(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}
function renderKey(key) {
  return isIdentifier(key) ? key : JSON.stringify(key);
}
function wrapUnion(type) {
  return type.includes("|") ? `(${type})` : type;
}
function renderType(schema) {
  switch (schema.kind) {
    case "primitive":
      return TS_PRIMITIVES[schema.name];
    case "list":
      return `${wrapUnion(renderType(schema.element))}[]`;
    case "optional":
      return `${wrapUnion(renderType(schema.element))} | null`;
    case "record": {
      const fields = Object.keys(schema.fields).map((key) => {
        return `  readonly ${renderKey(key)}: ${renderType(schema.fields[key])};`;
      });
      return `{
${fields.join(`
`)}
}`;
    }
    case "union": {
      const alternatives = Object.keys(schema.alternatives).map((key) => {
        const value = schema.alternatives[key];
        if (value === null || value === undefined) {
          return `  | { readonly tag: ${JSON.stringify(key)} }`;
        }
        return `  | { readonly tag: ${JSON.stringify(key)}; readonly value: ${wrapUnion(renderType(value))} }`;
      });
      return alternatives.length === 0 ? "never" : `
${alternatives.join(`
`)}`;
    }
    case "map":
      return `Record<string, ${wrapUnion(renderType(schema.value))}>`;
    case "function":
      return "unknown";
  }
}
function renderDeclaration(name, schema) {
  const body = renderType(schema);
  if (schema.kind === "record") {
    return `export interface ${name} ${body}
`;
  }
  return `export type ${name} = ${body};
`;
}
function indexedPath(base, suffix) {
  return `${base} + "[" + ${suffix} + "]"`;
}
function renderValidatorExpression(schema, path, valueRef) {
  switch (schema.kind) {
    case "primitive": {
      const validator = PRIMITIVE_VALIDATORS[schema.name];
      return `expect(${valueRef}, ${path}, ${JSON.stringify(validator.expected)}, candidate => ${validator.predicate})`;
    }
    case "list":
      return `expect(${valueRef}, ${path}, "array", Array.isArray).map((item, i) => ${renderValidatorExpression(schema.element, indexedPath(path, "i"), "item")})`;
    case "optional":
      return `${valueRef} === null ? null : ${renderValidatorExpression(schema.element, path, valueRef)}`;
    case "record": {
      const fields = Object.keys(schema.fields).map((key) => {
        const access = isIdentifier(key) ? `object.${key}` : `object[${JSON.stringify(key)}]`;
        const fieldPath = isIdentifier(key) ? `${path} + ".${key}"` : `${path} + "[" + ${JSON.stringify(key)} + "]"`;
        return `      ${renderKey(key)}: ${renderValidatorExpression(schema.fields[key], fieldPath, access)},`;
      });
      return `(() => {
    const object = expectObject(${valueRef}, ${path});
    return {
${fields.join(`
`)}
    };
  })()`;
    }
    case "union": {
      const cases = Object.keys(schema.alternatives).map((key) => {
        const value = schema.alternatives[key];
        const valueProperty = value === null || value === undefined ? "" : `, value: ${renderValidatorExpression(value, `${path} + ".value"`, "object.value")}`;
        return `      case ${JSON.stringify(key)}: return { tag${valueProperty} };`;
      });
      return `(() => {
    const object = expectObject(${valueRef}, ${path});
    switch (object.tag) {
${cases.join(`
`)}
      default: return fail(${path}, "known tag", object.tag);
    }
  })()`;
    }
    case "map":
      return `Object.fromEntries(Object.entries(expectObject(${valueRef}, ${path})).map(([key, item]) => [key, ${renderValidatorExpression(schema.value, indexedPath(path, "key"), "item")}]))`;
    case "function":
      return `fail(${path}, "data value", ${valueRef})`;
  }
}
var VALIDATOR_HELPERS = `function fail(path: string, expected: string, value: unknown): never {
  throw new TypeError(\`\${path || "value"} expected \${expected}, got \${typeof value}\`);
}

function expect(
  value: unknown,
  path: string,
  expected: string,
  predicate: (candidate: unknown) => boolean,
): unknown {
  if (!predicate(value)) fail(path, expected, value);
  return value;
}

function expectObject(value: unknown, path: string): Record<string, unknown> {
  return expect(value, path, "object", candidate =>
    typeof candidate === "object" && candidate !== null,
  ) as Record<string, unknown>;
}
`;
function generateTypes(schema, options) {
  const name = toPascalCase(options.name);
  const declaration = renderDeclaration(name, schema);
  if (!options.validator) {
    return { declaration, module: declaration };
  }
  const validatorName = `validate${name}`;
  const expression = renderValidatorExpression(schema, '"value"', "value");
  const validator = `export function ${validatorName}(value: unknown): ${name} {
  return ${expression} as ${name};
}
`;
  return {
    declaration,
    module: `${declaration}
${VALIDATOR_HELPERS}
${validator}`
  };
}
// node_modules/dhall-wasm/packages/core/src/operations.ts
init_errors();
function isIdentifier2(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}
function renderDhall(value) {
  if (value === null || value === undefined)
    return "None Type";
  switch (typeof value) {
    case "boolean":
      return value ? "True" : "False";
    case "number":
      return String(value);
    case "string":
      return JSON.stringify(value);
    case "bigint":
      return value.toString();
  }
  if (value instanceof Uint8Array) {
    return JSON.stringify(Array.from(value));
  }
  if (Array.isArray(value)) {
    return `[ ${value.map(renderDhall).join(", ")} ]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    const fields = entries.map(([key, item]) => {
      const renderedKey = isIdentifier2(key) ? key : JSON.stringify(key);
      return `${renderedKey} = ${renderDhall(item)}`;
    });
    return fields.length === 0 ? "{}" : `{ ${fields.join(", ")} }`;
  }
  return JSON.stringify(value);
}
function formatValue(value, format) {
  switch (format) {
    case "json":
      return JSON.stringify(value, null, 2);
    case "dhall":
      return typeof value === "string" ? value : renderDhall(value);
    case "cbor":
      return typeof value === "string" ? value : JSON.stringify(value);
  }
}
function formatDiagnostic(error) {
  const location2 = error.location ? ` (${error.source ?? "source"}:${error.location.line ?? error.location.start})` : "";
  return `${error.kind}: ${error.message}${location2}`;
}
async function generateTypesFromSource(source, options) {
  const described = await describeType(source, options);
  if (!described.ok)
    return failure(described.error);
  return ok(generateTypes(described.value, {
    name: options.name,
    validator: options.validator
  }));
}

// node_modules/dhall-wasm/packages/core/src/index.ts
init_wasm();

// src/parsers/dhall.ts
var hasScheme = (value) => /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value);
var require2 = createRequire(import.meta.url);
var bundledWasmUrl = () => {
  const packageJsonPath = require2.resolve("dhall-wasm/package.json");
  return pathToFileURL(resolvePath2(dirname(packageJsonPath), "packages/engine/wasm/engine.wasm"));
};
var configuredWasmUrl2 = () => {
  const configured = process.env.DHALL_WASM_ENGINE;
  if (!configured)
    return;
  if (hasScheme(configured))
    return new URL(configured);
  return pathToFileURL(resolvePath2(configured));
};
var engineInitialization;
var ensureEngine2 = async () => {
  engineInitialization ??= initializeEngine({ wasmUrl: configuredWasmUrl2() ?? bundledWasmUrl() }).then(() => {
    return;
  }, (error) => {
    engineInitialization = undefined;
    throw error;
  });
  return engineInitialization;
};
var sourceDirectory = (source, fallback) => {
  if (!source || source.startsWith("<"))
    return fallback;
  return extname2(source) ? dirname(source) : source;
};
var importUrl = (request, context, options) => {
  const specifier = request.specifier;
  if (hasScheme(specifier))
    return new URL(specifier);
  const base = request.baseDirectory ?? context.source ?? options.base;
  if (base && hasScheme(base)) {
    const baseUrl = new URL(base);
    return new URL(specifier, baseUrl.href.endsWith("/") ? baseUrl : new URL(".", baseUrl));
  }
  const directory = sourceDirectory(base, options.base);
  const basePath = isAbsolute2(directory) ? directory : resolvePath2(options.base, directory);
  return pathToFileURL(resolvePath2(basePath, specifier));
};
var verifyIntegrity = async (text, expectedHash) => {
  if (!expectedHash)
    return;
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
var parserDeps = (deps) => deps ?? { fs: createFsDeps(), http: createHttpDeps() };
var createEnvironment = (deps, context, options) => ({
  async resolveImport(request) {
    if (/^env:/.test(request.specifier)) {
      throw new Error(`Missing environment variable import: ${request.specifier}`);
    }
    const url = importUrl(request, context, options);
    let text;
    let source;
    if (url.protocol === "file:") {
      source = fileURLToPath2(url);
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
  }
});
var createDhallParser = (deps, options) => {
  const resolvedDeps = parserDeps(deps);
  return async (content, context) => {
    const source = typeof content === "string" ? content : new TextDecoder().decode(content);
    const resolvedOptions = options ?? defaultOptions(process.cwd());
    try {
      await ensureEngine2();
      const result = await evaluate(source, {
        format: "json",
        sourcePath: context.source,
        environment: createEnvironment(resolvedDeps, context, resolvedOptions)
      });
      if (!result.ok) {
        throw createLoadError({
          code: "PARSE_ERROR",
          message: formatDiagnostic(result.error),
          source: context.source,
          format: "dhall",
          cause: result.error
        });
      }
      return result.value;
    } catch (error) {
      if (error instanceof Error && error.name === "LoadError")
        throw error;
      throw createLoadError({
        code: "PARSE_ERROR",
        message: `Failed to parse Dhall from ${context.source}: ${error instanceof Error ? error.message : String(error)}`,
        source: context.source,
        format: "dhall",
        cause: error
      });
    }
  };
};
var createDhallStringifier = () => async (value) => {
  try {
    return formatValue(value, "dhall");
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify Dhall: ${error instanceof Error ? error.message : String(error)}`,
      format: "dhall",
      cause: error
    });
  }
};
var generateDhallTypes = async (source, options) => {
  await ensureEngine2();
  try {
    const inferred = await typeCheck(source, {
      sourcePath: options.sourcePath,
      environment: options.environment
    });
    if (!inferred.ok) {
      throw createLoadError({
        code: "PARSE_ERROR",
        message: formatDiagnostic(inferred.error),
        source: options.sourcePath,
        format: "dhall",
        cause: inferred.error
      });
    }
    const typeSource = inferred.value === "Type" ? source : inferred.value;
    const generated = await generateTypesFromSource(typeSource, {
      name: options.name,
      validator: options.validator,
      sourcePath: options.sourcePath,
      environment: options.environment
    });
    if (!generated.ok) {
      throw createLoadError({
        code: "PARSE_ERROR",
        message: formatDiagnostic(generated.error),
        source: options.sourcePath,
        format: "dhall",
        cause: generated.error
      });
    }
    return generated.value;
  } catch (error) {
    if (error instanceof Error && error.name === "LoadError")
      throw error;
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to generate types from Dhall: ${error instanceof Error ? error.message : String(error)}`,
      source: options.sourcePath,
      format: "dhall",
      cause: error
    });
  }
};

// src/parsers/html.ts
import { parse as parse5 } from "parse5";
var parseHtml = (content) => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return parse5(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse HTML: ${error instanceof Error ? error.message : String(error)}`,
      format: "html",
      cause: error
    });
  }
};

// src/parsers/json.ts
var parseJson = (content) => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
      format: "json",
      cause: error
    });
  }
};

// src/parsers/md.ts
import { marked } from "marked";
var parseMd = async (content) => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    const html = await marked.parse(text);
    const htmlString = typeof html === "string" ? html : String(html);
    return parseHtml(htmlString);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse Markdown: ${error instanceof Error ? error.message : String(error)}`,
      format: "md",
      cause: error
    });
  }
};

// src/parsers/toml.ts
import { parse as tomlParse } from "@iarna/toml";
var parseToml = (content) => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return tomlParse(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse TOML: ${error instanceof Error ? error.message : String(error)}`,
      format: "toml",
      cause: error
    });
  }
};

// src/parsers/xml.ts
import { XMLParser } from "fast-xml-parser";
var parser = new XMLParser({ ignoreAttributes: false });
var parseXml = (content) => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return parser.parse(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`,
      format: "xml",
      cause: error
    });
  }
};

// src/parsers/yaml.ts
import { load as yamlLoad } from "js-yaml";
var parseYaml = (content) => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return yamlLoad(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`,
      format: "yaml",
      cause: error
    });
  }
};

// src/parsers/registry.ts
var builtInParsers = {
  json: parseJson,
  yaml: parseYaml,
  yml: parseYaml,
  toml: parseToml,
  xml: parseXml,
  html: parseHtml,
  md: parseMd,
  cbor: parseCbor
};
var createParserRegistry = (options, deps) => {
  const custom = options.parsers ?? {};
  return {
    json: custom.json ?? builtInParsers.json,
    yaml: custom.yaml ?? builtInParsers.yaml,
    yml: custom.yaml ?? builtInParsers.yml,
    toml: custom.toml ?? builtInParsers.toml,
    xml: custom.xml ?? builtInParsers.xml,
    html: custom.html ?? builtInParsers.html,
    md: custom.md ?? builtInParsers.md,
    cbor: custom.cbor ?? builtInParsers.cbor,
    dhall: custom.dhall ?? createDhallParser(deps, options)
  };
};

// src/stringify.ts
import { dump as yamlDump } from "js-yaml";
import { stringify as tomlStringify } from "@iarna/toml";
import { XMLBuilder } from "fast-xml-parser";
import { serialize as serializeHtml } from "parse5";
import { encode as cborEncode } from "@ipld/dag-cbor";
var xmlBuilder = new XMLBuilder({ ignoreAttributes: false, format: true, suppressEmptyNode: true });
var isPlainTextLike = (value) => typeof value === "string";
var stringifyJson = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify JSON: ${error instanceof Error ? error.message : String(error)}`,
      format: "json",
      cause: error
    });
  }
};
var stringifyYaml = (value) => {
  try {
    return yamlDump(value);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify YAML: ${error instanceof Error ? error.message : String(error)}`,
      format: "yaml",
      cause: error
    });
  }
};
var stringifyToml = (value) => {
  try {
    return tomlStringify(value);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify TOML: ${error instanceof Error ? error.message : String(error)}`,
      format: "toml",
      cause: error
    });
  }
};
var stringifyXml = (value) => {
  try {
    if (isPlainTextLike(value))
      return value;
    return xmlBuilder.build(value);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify XML: ${error instanceof Error ? error.message : String(error)}`,
      format: "xml",
      cause: error
    });
  }
};
var isParse5NodeLike = (value) => {
  if (!value || typeof value !== "object")
    return false;
  const v = value;
  return typeof v.nodeName === "string" || Array.isArray(v.childNodes);
};
var stringifyHtml = (value) => {
  try {
    if (isPlainTextLike(value))
      return value;
    if (isParse5NodeLike(value)) {
      return serializeHtml(value);
    }
    throw new Error("HTML stringify expects a parse5 document/tree or a string");
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify HTML: ${error instanceof Error ? error.message : String(error)}`,
      format: "html",
      cause: error
    });
  }
};
var stringifyMd = (value) => {
  try {
    if (isPlainTextLike(value))
      return value;
    throw new Error("Markdown stringify expects a markdown string; parsed Markdown is represented as HTML and cannot be losslessly converted back to Markdown");
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify Markdown: ${error instanceof Error ? error.message : String(error)}`,
      format: "md",
      cause: error
    });
  }
};
var stringifyCbor = (value) => {
  try {
    return cborEncode(value);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify CBOR: ${error instanceof Error ? error.message : String(error)}`,
      format: "cbor",
      cause: error
    });
  }
};
var createStringify = () => {
  const dhallStringify = createDhallStringifier();
  const stringify = async (value, format, _options) => {
    switch (format) {
      case "json":
        return stringifyJson(value);
      case "yaml":
      case "yml":
        return stringifyYaml(value);
      case "toml":
        return stringifyToml(value);
      case "xml":
        return stringifyXml(value);
      case "html":
        return stringifyHtml(value);
      case "md":
        return stringifyMd(value);
      case "cbor":
        return stringifyCbor(value);
      case "dhall":
        return dhallStringify(value);
      default:
        throw createLoadError({
          code: "UNSUPPORTED_FORMAT",
          message: `Unsupported format for stringify: ${String(format)}`,
          format: String(format)
        });
    }
  };
  const stringifyDhall = async (value) => dhallStringify(value);
  return { stringify, stringifyDhall };
};

// src/load.ts
var parse = async (content, format, options) => {
  const deps = createDefaultDeps();
  const resolvedOptions = resolveOptions(options, deps.cwd());
  return await parseContent(content, format, "<string>", resolvedOptions, deps);
};
var createDefaultDeps = () => ({
  fs: createFsDeps(),
  http: createHttpDeps(),
  cwd: () => process.cwd()
});
var isFormatAllowed = (format, options) => format !== null && options.formats.includes(format);
var readLocalContent = async (deps, resolved, format) => {
  try {
    if (isBinaryFormat(format)) {
      return await deps.fs.readFile(resolved.path);
    }
    return await deps.fs.readTextFile(resolved.path);
  } catch (error) {
    throw toIoLoadError(error, resolved.path);
  }
};
var parseContent = async (content, format, source, options, deps) => {
  const registry = createParserRegistry(options, { fs: deps.fs, http: deps.http });
  const parser = registry[format];
  if (!parser) {
    throw createLoadError({
      code: "UNSUPPORTED_FORMAT",
      message: `No parser available for format: ${format}`,
      source,
      format
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
      cause: error
    });
  }
};
var loadFileResolved = async (deps, resolved, options) => {
  const { format } = resolved;
  if (!isFormatAllowed(format, options)) {
    throw createLoadError({
      code: "UNSUPPORTED_FORMAT",
      message: `Unsupported or undetected format for: ${resolved.path}`,
      source: resolved.path,
      format: format ?? undefined
    });
  }
  const content = await readLocalContent(deps, resolved, format);
  return parseContent(content, format, resolved.path, options, deps);
};
var loadUrlResolved = async (deps, resolved, options) => {
  const { format } = resolved;
  if (!isFormatAllowed(format, options)) {
    throw createLoadError({
      code: "UNSUPPORTED_FORMAT",
      message: `Unsupported or undetected format for URL: ${resolved.url.toString()}`,
      source: resolved.url.toString(),
      format: format ?? undefined
    });
  }
  const content = await fetchResource(deps.http, resolved.url, format, options.http);
  return parseContent(content, format, resolved.url.toString(), options, deps);
};
var loadDirectoryResolved = async (deps, resolved, options, loadFn) => {
  let entries;
  try {
    entries = await deps.fs.readdir(resolved.path);
  } catch (error) {
    throw toIoLoadError(error, resolved.path);
  }
  const sorted = [...entries].sort();
  const pairs = await Promise.all(sorted.map(async (entry) => {
    const fullPath = childPath(resolved.path, entry);
    try {
      const st = await deps.fs.stat(fullPath);
      if (st.isDirectory()) {
        if (!options.directory.recursive)
          return null;
        const value = await loadDirectoryResolved(deps, { kind: "directory", path: fullPath, source: fullPath }, options, loadFn);
        return [entry, value];
      }
      if (!st.isFile())
        return null;
      const childResolved = resolveInput(fullPath, options.base);
      if (childResolved.kind !== "file")
        return null;
      const fmt = childResolved.format;
      if (!isFormatAllowed(fmt, options)) {
        return null;
      }
      const value = await loadFileResolved(deps, childResolved, options);
      return [entry, value];
    } catch (error) {
      if (options.directory.includeUnknown) {}
      if (error instanceof LoadError && error.code === "UNSUPPORTED_FORMAT") {
        return null;
      }
      throw error;
    }
  }));
  const filtered = pairs.filter((p) => p !== null);
  return fromPairs(filtered);
};
var createLoader = (depsInput) => {
  const defaults = createDefaultDeps();
  const deps = {
    fs: depsInput?.fs ?? defaults.fs,
    http: depsInput?.http ?? defaults.http,
    cwd: depsInput?.cwd ?? defaults.cwd
  };
  const load = async (input, options) => {
    const resolvedOptions = resolveOptions(options, deps.cwd());
    const resolved = resolveInput(input, resolvedOptions.base);
    if (resolved.kind === "url") {
      return await loadUrlResolved(deps, resolved, resolvedOptions);
    }
    let st;
    try {
      st = await deps.fs.stat(resolved.path);
    } catch (error) {
      throw toIoLoadError(error, resolved.path);
    }
    if (st.isDirectory()) {
      const dirResolved = { kind: "directory", path: resolved.path, source: resolved.source };
      return await loadDirectoryResolved(deps, dirResolved, resolvedOptions, load);
    }
    if (st.isFile()) {
      const fileResolved = {
        kind: "file",
        path: resolved.path,
        format: formatFromPath(resolved.path),
        source: resolved.source
      };
      return await loadFileResolved(deps, fileResolved, resolvedOptions);
    }
    throw createLoadError({
      code: "RESOLVE_ERROR",
      message: `Path is neither a regular file nor a directory: ${resolved.path}`,
      source: resolved.path
    });
  };
  const parseFn = async (content, format, options) => {
    const resolvedOptions = resolveOptions(options, deps.cwd());
    return await parseContent(content, format, "<string>", resolvedOptions, deps);
  };
  const loadDhall = async (input, options) => load(input, options);
  const parseDhall = async (content, options) => parseFn(content, "dhall", options);
  const { stringify, stringifyDhall } = createStringify();
  const fn = load;
  fn.load = load;
  fn.loadDhall = loadDhall;
  fn.parse = parseFn;
  fn.parseDhall = parseDhall;
  fn.stringify = stringify;
  fn.stringifyDhall = stringifyDhall;
  return fn;
};
// src/dhall-types.ts
import { readFile as readFile2 } from "node:fs/promises";
var generateTypesFromDhall = async (input, options = {}) => {
  const sourcePath = input instanceof URL ? input.href : input;
  const source = await readFile2(input, "utf8");
  const environment = createEnvironment({ fs: createFsDeps(), http: createHttpDeps() }, { format: "dhall", source: sourcePath }, defaultOptions(process.cwd()));
  return generateDhallTypes(source, {
    name: options.name ?? "Config",
    validator: options.validator,
    sourcePath,
    environment
  });
};
// src/index.ts
var defaultLoader = createLoader();
var load = defaultLoader.load;
var loadDhall = defaultLoader.loadDhall;
var parseDhall = defaultLoader.parseDhall;
var stringify = defaultLoader.stringify;
var stringifyDhall = defaultLoader.stringifyDhall;
var defaultStringify = createStringify();
var loadJSON = (input, options) => load(input, options);
var loadYAML = (input, options) => load(input, options);
var loadTOML = (input, options) => load(input, options);
var loadHTML = (input, options) => load(input, options);
var loadXML = (input, options) => load(input, options);
var loadMD = (input, options) => load(input, options);
var loadCBOR = (input, options) => load(input, options);
var loadDHALL = (input, options) => loadDhall(input, options);
export {
  LoadError,
  createDefaultDeps,
  createDhallParser,
  createDhallStringifier,
  createLoader,
  createStringify,
  defaultLoader,
  defaultStringify,
  formatFromPath,
  formatFromUrl,
  generateDhallTypes,
  generateTypesFromDhall,
  load,
  loadCBOR,
  loadDHALL,
  loadDhall,
  loadHTML,
  loadJSON,
  loadMD,
  loadTOML,
  loadXML,
  loadYAML,
  parse,
  parseCbor,
  parseDhall,
  parseHtml,
  parseJson,
  parseMd,
  parseToml,
  parseXml,
  parseYaml,
  resolveInput,
  stringify,
  stringifyCbor,
  stringifyDhall,
  stringifyHtml,
  stringifyJson,
  stringifyMd,
  stringifyToml,
  stringifyXml,
  stringifyYaml
};
