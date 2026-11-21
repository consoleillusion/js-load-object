# Changelog

## 2.0.0

### Breaking changes
- Rewritten in **TypeScript** (ESM) with typed exports and build output in `dist/`.
- **Bun-first** workflow and scripts; requires **Node.js >= 20** or Bun >= 1.0.
- **Standardized path/URL resolution:** relative paths resolve against `options.base ?? process.cwd()` (default: current working directory), absolute paths are normalized, `file://` URLs are supported, and `http(s)` URLs are resolved via `URL` (format detected from pathname; extensionless URLs treated as HTML).
- **Directory loading** behavior made explicit: non-recursive by default (opt-in recursive via `options.directory.recursive` / CLI `--recursive`), keys are entry names including extension, known/supported formats loaded, unknown/unsupported entries skipped, child paths joined with `path.join`.
- **Errors are thrown** as typed `LoadError` instances (with error codes, including `SERIALIZE_ERROR`) instead of returning `undefined` on unsupported/failed loads.
- **Dhall is a first-class format with no opt-in flag:** parsing and stringifying use the official Dhall engine compiled to WebAssembly via [`dhall-wasm`](https://github.com/consoleillusion/dhall-wasm). No external `dhall-to-json`/`json-to-dhall` tools, shell, or child processes are used; `.dhall` files load like `.json` files, including in directories and via the CLI. Local and `http(s)` imports use the existing fs/http dependencies and limits; `sha256:` integrity annotations are verified and `env:` imports are rejected.
- **Remote fetching hardened:** uses `fetch` (replacing axios) with configurable timeout, max response size, allowed protocols, redirect handling, and HTTP status checks.
- **CLI rebuilt** using `cmd-ts` with generated help and parity with library capabilities. Base is a positional parameter (not an option), with options for `--string/-s`, `--from/-f`, `--to/-t`, `--out/-o`, and `--recursive/-r`.
- Dependency updates and removals (e.g. removed `shelljs`, `axios`, `parse-path`; updated parser libraries).

### Added
- **Format conversion/stringifying:** `parse(content, format)`, `stringify(value, format)`, `stringifyDhall`, per-format stringifiers, and library/CLI support to convert from and to any supported format (including inline string input in CLI).
- `createLoader` with dependency injection for fs/http/cwd and shared resolver/registry architecture.
- Exported per-format parsers/stringifiers and typed option/error definitions.
- Deterministic local/HTTP/Dhall test suite runnable with `bun test`; Dhall is exercised through the WASM engine with local and mocked HTTP imports.
- `dhall-wasm` is pinned to a specific GitHub commit and bundled into `dist` at build time; consumers need no Haskell/Nix toolchain.

## 1.8.x and earlier

- See previous git history for legacy releases.
