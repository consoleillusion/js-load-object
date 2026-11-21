import { resolve } from "node:path";

const engineEntry = resolve(
  import.meta.dir,
  "../node_modules/dhall-wasm/packages/engine/wasm/engine.js"
);

/**
 * The pinned dhall-wasm checkout is a monorepo whose core package imports
 * `@dhall-wasm/engine/engine.js` through a workspace-only specifier. Map that
 * specifier to the prebuilt JSFFI glue shipped in the git checkout.
 */
export const dhallWasmPlugin: Bun.Plugin = {
  name: "load-object-dhall-wasm",
  setup(build) {
    build.onResolve({ filter: /^@dhall-wasm\/engine\/engine\.js$/ }, () => ({
      path: engineEntry,
    }));
  },
};
