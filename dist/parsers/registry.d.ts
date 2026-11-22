import type { Format, Parser, ResolvedOptions } from "../types.js";
import type { DhallParserDeps } from "./dhall.js";
export declare const builtInParsers: {
    readonly json: (content: import("../types.js").ParseContent) => unknown;
    readonly yaml: (content: import("../types.js").ParseContent) => unknown;
    readonly yml: (content: import("../types.js").ParseContent) => unknown;
    readonly toml: (content: import("../types.js").ParseContent) => unknown;
    readonly xml: (content: import("../types.js").ParseContent) => unknown;
    readonly html: (content: import("../types.js").ParseContent) => unknown;
    readonly md: (content: import("../types.js").ParseContent) => Promise<unknown>;
    readonly cbor: (content: import("../types.js").ParseContent) => Promise<unknown>;
};
export declare const createParserRegistry: (options: ResolvedOptions, deps?: DhallParserDeps) => Readonly<Partial<Record<Format, Parser>>>;
