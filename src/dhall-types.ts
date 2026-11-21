import { readFile } from "node:fs/promises";
import { createFsDeps } from "./io/fs.js";
import { createHttpDeps } from "./io/http.js";
import { defaultOptions } from "./options.js";
import { createEnvironment, generateDhallTypes } from "./parsers/dhall.js";
import type { DhallTypesOptions, GeneratedDhallTypes } from "./types.js";

/** Generate a TypeScript declaration for a Dhall file (or `file://` URL). */
export const generateTypesFromDhall = async (
  input: string | URL,
  options: DhallTypesOptions = {}
): Promise<GeneratedDhallTypes> => {
  const sourcePath = input instanceof URL ? input.href : input;
  const source = await readFile(input, "utf8");
  const environment = createEnvironment(
    { fs: createFsDeps(), http: createHttpDeps() },
    { format: "dhall", source: sourcePath },
    defaultOptions(process.cwd())
  );

  return generateDhallTypes(source, {
    name: options.name ?? "Config",
    validator: options.validator,
    sourcePath,
    environment,
  });
};
