import type { Format, Parser, ResolvedOptions } from "../types.js";
import { parseCbor } from "./cbor.js";
import { createDhallParser } from "./dhall.js";
import { parseHtml } from "./html.js";
import { parseJson } from "./json.js";
import { parseMd } from "./md.js";
import { parseToml } from "./toml.js";
import { parseXml } from "./xml.js";
import { parseYaml } from "./yaml.js";
import type { DhallParserDeps } from "./dhall.js";

export const builtInParsers = {
  json: parseJson,
  yaml: parseYaml,
  yml: parseYaml,
  toml: parseToml,
  xml: parseXml,
  html: parseHtml,
  md: parseMd,
  cbor: parseCbor,
} as const satisfies Partial<Record<Format, Parser>>;

export const createParserRegistry = (
  options: ResolvedOptions,
  deps?: DhallParserDeps
): Readonly<Partial<Record<Format, Parser>>> => {
  const custom = options.parsers ?? {};
  return {
    json: (custom.json as Parser | undefined) ?? builtInParsers.json,
    yaml: (custom.yaml as Parser | undefined) ?? builtInParsers.yaml,
    yml: (custom.yaml as Parser | undefined) ?? builtInParsers.yml,
    toml: (custom.toml as Parser | undefined) ?? builtInParsers.toml,
    xml: (custom.xml as Parser | undefined) ?? builtInParsers.xml,
    html: (custom.html as Parser | undefined) ?? builtInParsers.html,
    md: (custom.md as Parser | undefined) ?? builtInParsers.md,
    cbor: (custom.cbor as Parser | undefined) ?? builtInParsers.cbor,
    dhall: (custom.dhall as Parser | undefined) ?? createDhallParser(deps, options),
  };
};
