export type Format =
  | "json"
  | "yaml"
  | "yml"
  | "toml"
  | "xml"
  | "html"
  | "md"
  | "cbor"
  | "dhall";

export type LoadInput = string | URL;

export interface HttpOptions {
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
  readonly allowedProtocols?: readonly string[];
  readonly followRedirects?: boolean;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface DhallOptions {
  /** Explicit opt-in required for Dhall parsing/stringifying (executes external dhall tools). */
  readonly enabled?: boolean;
}

export interface LoadOptions {
  readonly base?: string | URL;
  readonly formats?: readonly Format[];
  readonly http?: HttpOptions;
  readonly dhall?: DhallOptions;
  readonly directory?: {
    readonly recursive?: boolean;
    readonly includeUnknown?: boolean;
  };
  readonly parsers?: {
    readonly html?: (content: string) => unknown;
    readonly xml?: (content: string) => unknown;
    readonly json?: (content: string) => unknown;
    readonly yaml?: (content: string) => unknown;
    readonly toml?: (content: string) => unknown;
    readonly md?: (content: string) => unknown;
    readonly cbor?: (content: Uint8Array) => unknown | Promise<unknown>;
  };
}

export interface ResolvedFile {
  readonly kind: "file";
  readonly path: string;
  readonly format: Format | null;
  readonly source: LoadInput;
}

export interface ResolvedDirectory {
  readonly kind: "directory";
  readonly path: string;
  readonly source: LoadInput;
}

export interface ResolvedUrl {
  readonly kind: "url";
  readonly url: URL;
  readonly format: Format | null;
  readonly source: LoadInput;
}

export type ResolvedInput = ResolvedFile | ResolvedDirectory | ResolvedUrl;

export type ParseContent = string | Uint8Array;

export interface ParseContext {
  readonly format: Format;
  readonly source: string;
}

export type Parser = (content: ParseContent, context: ParseContext) => unknown | Promise<unknown>;

export type Stringifier = (value: unknown, context?: { readonly format: Format }) => string | Uint8Array | Promise<string | Uint8Array>;

export type LoadErrorCode =
  | "UNSUPPORTED_FORMAT"
  | "DISABLED_FORMAT"
  | "RESOLVE_ERROR"
  | "NOT_FOUND"
  | "IO_ERROR"
  | "HTTP_ERROR"
  | "TIMEOUT"
  | "LIMIT_EXCEEDED"
  | "PARSE_ERROR"
  | "SERIALIZE_ERROR"
  | "EXTERNAL_TOOL_ERROR";

export interface LoadErrorDetails {
  readonly code: LoadErrorCode;
  readonly message: string;
  readonly source?: string;
  readonly format?: string;
  readonly cause?: unknown;
}

export interface FsDeps {
  readonly stat: (path: string) => Promise<{ isFile(): boolean; isDirectory(): boolean }>;
  readonly readFile: (path: string) => Promise<Uint8Array>;
  readonly readTextFile: (path: string) => Promise<string>;
  readonly readdir: (path: string) => Promise<readonly string[]>;
}

export interface HttpResponseLike {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly headers: { get(name: string): string | null };
  readonly text: () => Promise<string>;
  readonly arrayBuffer: () => Promise<ArrayBuffer>;
}

export interface HttpDeps {
  readonly fetch: (url: string | URL, init?: RequestInit) => Promise<HttpResponseLike>;
}

export interface ProcResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly signal: NodeJS.Signals | null;
  readonly timedOut: boolean;
}

export interface ProcRunOptions {
  readonly input?: string | Uint8Array;
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
}

export interface ProcDeps {
  readonly execFile: (
    command: string,
    args: readonly string[],
    options: ProcRunOptions
  ) => Promise<ProcResult>;
}

export interface LoadDeps {
  readonly fs: FsDeps;
  readonly http: HttpDeps;
  readonly proc: ProcDeps;
  readonly cwd: () => string;
}

export interface ResolvedOptions {
  readonly base: string;
  readonly formats: readonly Format[];
  readonly http: Required<Omit<HttpOptions, "headers">> & { readonly headers: Readonly<Record<string, string>> };
  readonly dhall: {
    readonly enabled: boolean;
  };
  readonly directory: {
    readonly recursive: boolean;
    readonly includeUnknown: boolean;
  };
  readonly parsers: NonNullable<LoadOptions["parsers"]>;
}
