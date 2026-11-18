import { parse as parse5 } from "parse5";
import { createLoadError } from "../errors.js";
import type { ParseContent } from "../types.js";

export const parseHtml = (content: ParseContent): unknown => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return parse5(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse HTML: ${error instanceof Error ? error.message : String(error)}`,
      format: "html",
      cause: error,
    });
  }
};
