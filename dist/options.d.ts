import type { Format, HttpOptions, LoadOptions, ResolvedOptions } from "./types.js";
export declare const DEFAULT_FORMATS: readonly Format[];
export declare const DEFAULT_HTTP: Required<Omit<HttpOptions, "headers">> & {
    readonly headers: Readonly<Record<string, string>>;
};
export declare const defaultOptions: (cwd: string) => ResolvedOptions;
export declare const resolveOptions: (options: LoadOptions | undefined, cwd: string) => ResolvedOptions;
