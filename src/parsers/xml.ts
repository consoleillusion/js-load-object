import { XMLParser } from "fast-xml-parser";
import { createLoadError } from "../errors.js";
import type { ParseContent } from "../types.js";

const parser = new XMLParser({ ignoreAttributes: false });

export const parseXml = (content: ParseContent): unknown => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return parser.parse(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`,
      format: "xml",
      cause: error,
    });
  }
};
