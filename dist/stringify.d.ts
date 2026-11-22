import type { Format, LoadOptions } from "./types.js";
export declare const stringifyJson: (value: unknown) => string;
export declare const stringifyYaml: (value: unknown) => string;
export declare const stringifyToml: (value: unknown) => string;
export declare const stringifyXml: (value: unknown) => string;
export declare const stringifyHtml: (value: unknown) => string;
export declare const stringifyMd: (value: unknown) => string;
export declare const stringifyCbor: (value: unknown) => Uint8Array;
export declare const createStringify: () => {
    stringify: (value: unknown, format: Format, _options?: LoadOptions) => Promise<string | Uint8Array>;
    stringifyDhall: (value: unknown) => Promise<string>;
};
