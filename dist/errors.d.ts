import type { LoadErrorCode, LoadErrorDetails } from "./types.js";
export declare class LoadError extends Error {
    readonly code: LoadErrorCode;
    readonly source?: string;
    readonly format?: string;
    readonly cause?: unknown;
    constructor(details: LoadErrorDetails);
}
export declare const createLoadError: (details: LoadErrorDetails) => LoadError;
export declare const asLoadError: (error: unknown, fallback: LoadErrorDetails) => LoadError;
export declare const isNodeErrno: (error: unknown) => error is NodeJS.ErrnoException;
export declare const toIoLoadError: (error: unknown, source: string) => LoadError;
