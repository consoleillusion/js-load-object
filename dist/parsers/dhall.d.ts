import type { DhallEnvironment, GeneratedTypes } from "dhall-wasm/packages/core/src/index.ts";
import type { FsDeps, HttpDeps, ParseContent, ParseContext, ResolvedOptions } from "../types.js";
export declare const ensureEngine: () => Promise<void>;
export interface DhallParserDeps {
    readonly fs: FsDeps;
    readonly http: HttpDeps;
}
export declare const createEnvironment: (deps: DhallParserDeps, context: ParseContext, options: ResolvedOptions) => DhallEnvironment;
export declare const createDhallParser: (deps?: DhallParserDeps, options?: ResolvedOptions) => (content: ParseContent, context: ParseContext) => Promise<unknown>;
export declare const createDhallStringifier: () => (value: unknown) => Promise<string>;
export interface GenerateDhallTypesOptions {
    readonly name: string;
    readonly validator?: boolean;
    readonly sourcePath?: string;
    readonly environment?: DhallEnvironment;
}
/** Infer the TypeScript declaration for a Dhall value or type expression. */
export declare const generateDhallTypes: (source: string, options: GenerateDhallTypesOptions) => Promise<GeneratedTypes>;
