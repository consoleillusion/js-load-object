import { decode as cborDecode } from "@ipld/dag-cbor";
import { createLoadError } from "../errors.js";
import type { ParseContent } from "../types.js";

export const parseCbor = async (content: ParseContent): Promise<unknown> => {
  try {
    const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
    return await cborDecode(bytes);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse CBOR: ${error instanceof Error ? error.message : String(error)}`,
      format: "cbor",
      cause: error,
    });
  }
};
