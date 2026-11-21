export { LoadError } from "./errors.js";
export { createLoader, createDefaultDeps, parse } from "./load.js";
export { createStringify, stringifyJson, stringifyYaml, stringifyToml, stringifyXml, stringifyHtml, stringifyMd, stringifyCbor } from "./stringify.js";
export { resolveInput } from "./path/resolve.js";
export { formatFromPath, formatFromUrl } from "./path/format.js";

export { parseJson } from "./parsers/json.js";
export { parseYaml } from "./parsers/yaml.js";
export { parseToml } from "./parsers/toml.js";
export { parseXml } from "./parsers/xml.js";
export { parseHtml } from "./parsers/html.js";
export { parseMd } from "./parsers/md.js";
export { parseCbor } from "./parsers/cbor.js";
export { createDhallParser, createDhallStringifier, generateDhallTypes } from "./parsers/dhall.js";
export { generateTypesFromDhall } from "./dhall-types.js";

export type {
  DhallTypesOptions,
  GeneratedDhallTypes,
  Format,
  LoadInput,
  LoadOptions,
  HttpOptions,
  LoadDeps,
  LoadErrorCode,
  ResolvedInput,
  ResolvedFile,
  ResolvedDirectory,
  ResolvedUrl,
  Parser,
  Stringifier,
} from "./types.js";

import { createLoader } from "./load.js";
import { createStringify } from "./stringify.js";

export const defaultLoader = createLoader();
export const load = defaultLoader.load;
export const loadDhall = defaultLoader.loadDhall;
export const parseDhall = defaultLoader.parseDhall;
export const stringify = defaultLoader.stringify;
export const stringifyDhall = defaultLoader.stringifyDhall;

const defaultStringify = createStringify();
export { defaultStringify };

// Compatibility-ish aliases
export const loadJSON = (input: string | URL, options?: any) => load(input, options);
export const loadYAML = (input: string | URL, options?: any) => load(input, options);
export const loadTOML = (input: string | URL, options?: any) => load(input, options);
export const loadHTML = (input: string | URL, options?: any) => load(input, options);
export const loadXML = (input: string | URL, options?: any) => load(input, options);
export const loadMD = (input: string | URL, options?: any) => load(input, options);
export const loadCBOR = (input: string | URL, options?: any) => load(input, options);
export const loadDHALL = (input: string | URL, options?: any) => loadDhall(input, options);
