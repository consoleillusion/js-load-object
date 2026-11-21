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

  export interface SourceOptions {
    readonly sourcePath?: string;
  }

  export interface EvaluateOptions extends SourceOptions {
    readonly format: "json" | "dhall" | "cbor";
    readonly environment?: DhallEnvironment;
    readonly remoteImports?: boolean;
  }

  export interface TypeCheckOptions extends SourceOptions {
    readonly environment?: DhallEnvironment;
    readonly remoteImports?: boolean;
  }

  export interface DescribeTypeOptions extends TypeCheckOptions {}

  export type DhallPrimitive =
    | "Bool"
    | "Natural"
    | "Integer"
    | "Double"
    | "Text"
    | "Bytes"
    | "Date"
    | "Time"
    | "TimeZone";

  export type DhallTypeSchema =
    | { readonly kind: "primitive"; readonly name: DhallPrimitive }
    | { readonly kind: "list"; readonly element: DhallTypeSchema }
    | { readonly kind: "optional"; readonly element: DhallTypeSchema }
    | { readonly kind: "record"; readonly fields: Readonly<Record<string, DhallTypeSchema>> }
    | {
        readonly kind: "union";
        readonly alternatives: Readonly<Record<string, DhallTypeSchema | null>>;
      }
    | { readonly kind: "map"; readonly key: DhallTypeSchema; readonly value: DhallTypeSchema }
    | { readonly kind: "function"; readonly argument: DhallTypeSchema; readonly result: DhallTypeSchema };

  export interface GenerateTypesOptions {
    readonly name: string;
    readonly validator?: boolean;
  }

  export interface GeneratedTypes {
    readonly declaration: string;
    readonly module: string;
  }

  export interface DhallEngine {
    evaluate(source: string, options?: EvaluateOptions): Promise<Result<unknown>>;
    typeCheck(source: string, options?: TypeCheckOptions): Promise<Result<string>>;
    describeType(source: string, options?: DescribeTypeOptions): Promise<Result<DhallTypeSchema>>;
  }

  export interface WasmEngineOptions {
    readonly wasmUrl?: string | URL;
  }

  export function evaluate(source: string, options?: EvaluateOptions): Promise<Result<unknown>>;
  export function typeCheck(source: string, options?: TypeCheckOptions): Promise<Result<string>>;
  export function describeType(source: string, options?: DescribeTypeOptions): Promise<Result<DhallTypeSchema>>;
  export function generateTypes(schema: DhallTypeSchema, options: GenerateTypesOptions): GeneratedTypes;
  export function generateTypesFromSource(
    source: string,
    options: GenerateTypesOptions & DescribeTypeOptions,
  ): Promise<Result<GeneratedTypes>>;
  export function initializeEngine(options?: WasmEngineOptions): Promise<DhallEngine>;
  export function setEngine(engine: DhallEngine): void;
  export function clearEngine(): void;
  export function formatValue(value: unknown, format: "json" | "dhall" | "cbor"): string;
  export function formatDiagnostic(error: DhallDiagnostic): string;
}
