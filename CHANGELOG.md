# Changelog

## 2.0.0

### Breaking changes
- Rewritten in **TypeScript** (ESM) with typed exports and build output in `dist/`.
- **Bun-first** workflow and scripts; requires **Node.js >= 20** or Bun >= 1.0.
- **Standardized path/URL resolution:** relative paths resolve against `options.base ?? process.cwd()` (default: current working directory), absolute paths are normalized, `file://` URLs are supported, and `http(s)` URLs are resolved via `URL` (format detected from pathname; extensionless URLs treated as HTML).
- **Directory loading** behavior made explicit: non-recursive by default (opt-in recursive via `options.directory.recursive` / CLI `--recursive`), keys are entry names including extension, known/supported formats loaded, unknown/unsupported entries skipped, child paths joined with `path.join`.
- **Errors are thrown** as typed `LoadError` instances (with error codes, including `SERIALIZE_ERROR`) instead of returning `undefined` on unsupported/failed loads.
- **Dhall is opt-in and safely executed:** no `shelljs`, no `process.stdout/stderr` monkeypatching, no shell. Parsing uses `dhall-to-json` and stringifying uses `json-to-dhall` as direct child processes (`shell: false`) with stdin input, captured output, timeout/max-output limits, and strict exit/stderr checks. Enable via `loadDhall`/`parseDhall`/`stringifyDhall` or `{ dhall: { enabled: true } }` / CLI `--enable-dhall` (the only Dhall control; tool commands are internal defaults). Dhall is evaluated/import-capable—treat untrusted input accordingly.
- **Remote fetching hardened:** uses `fetch` (replacing axios) with configurable timeout, max response size, allowed protocols, redirect handling, and HTTP status checks.
- **CLI rebuilt** using `cmd-ts` with generated help and parity with library capabilities. Base is a positional parameter (not an option), with options for `--string/-s`, `--from/-f`, `--to/-t`, `--out/-o`, `--recursive/-r`, and `--enable-dhall`.
- Dependency updates and removals (e.g. removed `shelljs`, `axios`, `parse-path`; updated parser libraries).

### Added
- **Format conversion/stringifying:** `parse(content, format)`, `stringify(value, format)`, `stringifyDhall`, per-format stringifiers, and library/CLI support to convert from and to any supported format (including inline string input in CLI).
- `createLoader` with dependency injection for fs/http/proc/cwd and shared resolver/registry architecture.
- Exported per-format parsers/stringifiers and typed option/error definitions.
- Deterministic local/HTTP/Dhall-mocked test suite runnable with `bun test`.

## 1.8.x and earlier

- See previous git history for legacy releases.
