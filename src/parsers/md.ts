import { marked } from "marked";
import { createLoadError } from "../errors.js";
import type { ParseContent } from "../types.js";
import { parseHtml } from "./html.js";

export const parseMd = async (content: ParseContent): Promise<unknown> => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    const html = await marked.parse(text);
    const htmlString = typeof html === "string" ? html : String(html);
    return parseHtml(htmlString);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse Markdown: ${error instanceof Error ? error.message : String(error)}`,
      format: "md",
      cause: error,
    });
  }
};
