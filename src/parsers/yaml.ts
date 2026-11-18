import { load as yamlLoad } from "js-yaml";
import { createLoadError } from "../errors.js";
import type { ParseContent } from "../types.js";

export const parseYaml = (content: ParseContent): unknown => {
  const text = typeof content === "string" ? content : new TextDecoder().decode(content);
  try {
    return yamlLoad(text);
  } catch (error) {
    throw createLoadError({
      code: "PARSE_ERROR",
      message: `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`,
      format: "yaml",
      cause: error,
    });
  }
};
