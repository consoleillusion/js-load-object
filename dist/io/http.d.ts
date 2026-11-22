import type { Format, HttpDeps, HttpOptions, HttpResponseLike } from "../types.js";
export declare const isBinaryFormat: (format: Format | null) => boolean;
export declare const readResponseBody: (response: HttpResponseLike, format: Format | null, maxBytes: number, source: string) => Promise<string | Uint8Array>;
export declare const fetchResource: (deps: HttpDeps, url: URL, format: Format | null, options: Required<Omit<HttpOptions, "headers">> & {
    readonly headers: Readonly<Record<string, string>>;
}) => Promise<string | Uint8Array>;
export declare const createHttpDeps: () => HttpDeps;
