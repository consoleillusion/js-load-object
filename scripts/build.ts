import { createRequire } from "node:module";
import { dhallWasmPlugin } from "./dhall-wasm-plugin.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const external = [
  ...Object.keys(pkg.dependencies ?? {}).filter((name) => name !== "dhall-wasm"),
  ...Object.keys(pkg.devDependencies ?? {}),
];

const shared = {
  target: "node" as const,
  format: "esm" as const,
  splitting: false,
  sourcemap: "none" as const,
  plugins: [dhallWasmPlugin],
  external,
};

const library = await Bun.build({
  ...shared,
  entrypoints: ["src/index.ts"],
  outdir: "dist",
});

const cli = await Bun.build({
  ...shared,
  entrypoints: ["src/cli.ts"],
  outdir: "dist",
  banner: "#!/usr/bin/env bun",
});

if (!library.success || !cli.success) {
  for (const result of [library, cli]) {
    for (const message of result.logs) console.error(message);
  }
  process.exitCode = 1;
}
