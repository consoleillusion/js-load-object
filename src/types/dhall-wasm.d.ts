declare module "dhall-wasm/packages/core/src/index.ts" {
  export type DhallErrorKind =
    | "parse"
    | "typecheck"
    | "import"
    | "integrity"
    | "evaluation"
    | "engine"
    | "unsupported";

  export interface DhallDiagnostic {
    readonly kind: DhallErrorKind;
    readonly message: string;
    readonly source?: string;
    readonly location?: { readonly line?: number; readonly start?: number };
  }

  export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: DhallDiagnostic };

  export interface ImportRequest {
    readonly specifier: string;
    readonly expectedHash?: string;
    readonly baseDirectory?: string;
  }

  export interface ImportResolution {
    readonly text: string;
    readonly source?: string;
  }

  export interface DhallEnvironment {
    readonly variables?: Readonly<Record<string, string>>;
    resolveImport(request: ImportRequest): Promise<ImportResolution>;
  }

  export interface EvaluateOptions {
    readonly format: "json" | "dhall" | "cbor";
    readonly sourcePath?: string;
    readonly environment?: DhallEnvironment;
    readonly remoteImports?: boolean;
  }

  export interface DhallEngine {
    evaluate(source: string, options?: EvaluateOptions): Promise<Result<unknown>>;
    typeCheck(source: string, options?: { readonly sourcePath?: string }): Promise<Result<string>>;
  }

  export interface WasmEngineOptions {
    readonly wasmUrl?: string | URL;
  }

  export function evaluate(source: string, options?: EvaluateOptions): Promise<Result<unknown>>;
  export function initializeEngine(options?: WasmEngineOptions): Promise<DhallEngine>;
  export function setEngine(engine: DhallEngine): void;
  export function clearEngine(): void;
  export function formatValue(value: unknown, format: "json" | "dhall" | "cbor"): string;
  export function formatDiagnostic(error: DhallDiagnostic): string;
}
