import { dump as yamlDump } from "js-yaml";
import { stringify as tomlStringify } from "@iarna/toml";
import { XMLBuilder } from "fast-xml-parser";
import { serialize as serializeHtml } from "parse5";
import { encode as cborEncode } from "@ipld/dag-cbor";
import { createLoadError } from "./errors.js";
import { createProcDeps } from "./io/proc.js";
import { resolveOptions } from "./options.js";
import { createDhallStringifier } from "./parsers/dhall.js";
import type { Format, LoadOptions, ProcDeps } from "./types.js";

const xmlBuilder = new XMLBuilder({ ignoreAttributes: false, format: true, suppressEmptyNode: true });

const isPlainTextLike = (value: unknown): value is string => typeof value === "string";

export const stringifyJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify JSON: ${error instanceof Error ? error.message : String(error)}`,
      format: "json",
      cause: error,
    });
  }
};

export const stringifyYaml = (value: unknown): string => {
  try {
    return yamlDump(value);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify YAML: ${error instanceof Error ? error.message : String(error)}`,
      format: "yaml",
      cause: error,
    });
  }
};

export const stringifyToml = (value: unknown): string => {
  try {
    return tomlStringify(value as any);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify TOML: ${error instanceof Error ? error.message : String(error)}`,
      format: "toml",
      cause: error,
    });
  }
};

export const stringifyXml = (value: unknown): string => {
  try {
    if (isPlainTextLike(value)) return value;
    return xmlBuilder.build(value as any);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify XML: ${error instanceof Error ? error.message : String(error)}`,
      format: "xml",
      cause: error,
    });
  }
};

const isParse5NodeLike = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return false;
  const v = value as any;
  return typeof v.nodeName === "string" || Array.isArray(v.childNodes);
};

export const stringifyHtml = (value: unknown): string => {
  try {
    if (isPlainTextLike(value)) return value;
    if (isParse5NodeLike(value)) {
      return serializeHtml(value as any);
    }
    throw new Error("HTML stringify expects a parse5 document/tree or a string");
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify HTML: ${error instanceof Error ? error.message : String(error)}`,
      format: "html",
      cause: error,
    });
  }
};

// Markdown: library parses MD -> HTML (parse5). Stringifying back to Markdown source is not losslessly supported;
// accept string input (assumed markdown/html text) for round-trippable API surface.
export const stringifyMd = (value: unknown): string => {
  try {
    if (isPlainTextLike(value)) return value;
    throw new Error("Markdown stringify expects a markdown string; parsed Markdown is represented as HTML and cannot be losslessly converted back to Markdown");
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify Markdown: ${error instanceof Error ? error.message : String(error)}`,
      format: "md",
      cause: error,
    });
  }
};

export const stringifyCbor = (value: unknown): Uint8Array => {
  try {
    return cborEncode(value);
  } catch (error) {
    throw createLoadError({
      code: "SERIALIZE_ERROR",
      message: `Failed to stringify CBOR: ${error instanceof Error ? error.message : String(error)}`,
      format: "cbor",
      cause: error,
    });
  }
};

export const createStringify = (procInput?: ProcDeps) => {
  const proc = procInput ?? createProcDeps();
  const dhallStringify = createDhallStringifier(proc);

  const stringify = async (value: unknown, format: Format, options?: LoadOptions): Promise<string | Uint8Array> => {
    const resolvedOptions = resolveOptions(options, process.cwd());
    switch (format) {
      case "json":
        return stringifyJson(value);
      case "yaml":
      case "yml":
        return stringifyYaml(value);
      case "toml":
        return stringifyToml(value);
      case "xml":
        return stringifyXml(value);
      case "html":
        return stringifyHtml(value);
      case "md":
        return stringifyMd(value);
      case "cbor":
        return stringifyCbor(value);
      case "dhall":
        if (!resolvedOptions.dhall.enabled) {
          throw createLoadError({
            code: "DISABLED_FORMAT",
            message:
              "Dhall support is disabled by default. Enable it with { dhall: { enabled: true } } or use stringifyDhall, and ensure json-to-dhall is installed.",
            format,
          });
        }
        return dhallStringify(value);
      default:
        throw createLoadError({
          code: "UNSUPPORTED_FORMAT",
          message: `Unsupported format for stringify: ${String(format)}`,
          format: String(format),
        });
    }
  };

  const stringifyDhall = async (value: unknown): Promise<string> => dhallStringify(value);

  return { stringify, stringifyDhall };
};
