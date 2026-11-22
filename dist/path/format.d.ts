import type { Format } from "../types.js";
export declare const KNOWN_FORMATS: Set<string>;
export declare const normalizeFormat: (ext: string) => Format | null;
export declare const formatFromPath: (pathLike: string) => Format | null;
export declare const formatFromUrl: (url: URL) => Format | null;
export declare const isKnownFormat: (value: string) => value is Format;
