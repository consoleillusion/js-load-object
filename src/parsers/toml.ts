import { parse as tomlParse } from "@iarna/toml";
import { createLoadError } from "../errors.js";
import type { ParseContent } from "../types.js";

export const parseToml = (content: ParseContent): unknown => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return tomlParse(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse TOML: ${error instanceof Error ? error.message : String(error)}`,
      format: "toml",
      cause: error,
    });
  }
};
