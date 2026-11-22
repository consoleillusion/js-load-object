import type { Format, LoadDeps, LoadInput, LoadOptions, ParseContent } from "./types.js";
export declare const parse: <T = unknown>(content: ParseContent, format: Format, options?: LoadOptions) => Promise<T>;
export declare const createDefaultDeps: () => LoadDeps;
export interface Loader {
    <T = unknown>(input: LoadInput, options?: LoadOptions): Promise<T>;
    load: <T = unknown>(input: LoadInput, options?: LoadOptions) => Promise<T>;
    loadDhall: <T = unknown>(input: LoadInput, options?: LoadOptions) => Promise<T>;
    parse: <T = unknown>(content: ParseContent, format: Format, options?: LoadOptions) => Promise<T>;
    parseDhall: <T = unknown>(content: ParseContent, options?: LoadOptions) => Promise<T>;
    stringify: (value: unknown, format: Format, options?: LoadOptions) => Promise<string | Uint8Array>;
    stringifyDhall: (value: unknown) => Promise<string>;
}
export declare const createLoader: (depsInput?: Partial<LoadDeps>) => Loader;
