import type { LoadInput, ResolvedInput } from "../types.js";
export declare const toFilePathFromUrl: (url: URL) => string;
export declare const resolveLocalPath: (input: string, base: string) => string;
export declare const resolveInput: (input: LoadInput, base: string) => ResolvedInput;
export declare const childPath: (dir: string, entry: string) => string;
