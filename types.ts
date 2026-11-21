// Generate a real .d.ts from a Dhall file, so TypeScript can type the loaded value.
// Usage: bun run types.ts [path/to/file.dhall] [TypeName] [output.d.ts]
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateTypesFromSource,
  typeCheck,
} from "dhall-wasm/packages/core/src/index.ts";

const file =
  process.argv[2] ?? fileURLToPath(new URL("./test/fixtures/local/script.dhall", import.meta.url));
const name = process.argv[3] ?? "Config";
const output = resolve(process.argv[4] ?? fileURLToPath(new URL("./generated/Config.d.ts", import.meta.url)));
const source = await readFile(file, "utf8");

// `describeType` expects a Dhall *type* expression. For a value file, first ask
// the engine for its inferred type, then turn that into TypeScript.
const inferred = await typeCheck(source, { sourcePath: file });
if (!inferred.ok) throw new Error(inferred.error.message);
const typeSource = inferred.value === "Type" ? source : inferred.value;

const generated = await generateTypesFromSource(typeSource, { name, sourcePath: file });
if (!generated.ok) throw new Error(generated.error.message);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, generated.value.declaration, "utf8");
console.log(`Wrote ${output}:\n\n${generated.value.declaration}`);
