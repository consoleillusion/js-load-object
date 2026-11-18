import type { ParseContent } from "../types.js";
import { createLoadError } from "../errors.js";

export const parseJson = (content: ParseContent): unknown => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
      format: "json",
      cause: error,
    });
  }
};
