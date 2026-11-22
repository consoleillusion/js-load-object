import type { DhallTypesOptions, GeneratedDhallTypes } from "./types.js";
/** Generate a TypeScript declaration for a Dhall file (or `file://` URL). */
export declare const generateTypesFromDhall: (input: string | URL, options?: DhallTypesOptions) => Promise<GeneratedDhallTypes>;
