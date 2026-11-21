# load-object

Load, parse, stringify, and convert structured data across local files, directories, URLs, and inline strings.

Supports **JSON, YAML (`.yaml`/`.yml`), TOML, XML, HTML, Markdown, CBOR, and Dhall**. Dhall is evaluated in-process by the official Dhall engine compiled to WebAssembly via [`dhall-wasm`](https://github.com/consoleillusion/dhall-wasm); no external tools or opt-in flag are needed. Built with **TypeScript** and designed to be used with **Bun** by default (also works with Node.js >= 20).

## Features

- **Unified conversion API**: load/parse input in one format and stringify to another
- Input sources: relative/absolute file paths, `file://` URLs, `http(s)` URLs, directories, and inline strings
- Correct handling of **relative and absolute** paths via a shared resolver (`base` for relative resolution)
- Directory loading with optional recursion
- TypeScript types and typed `LoadError`s
- Safe remote fetching with protocol allowlist, timeout, and max-size limits
- **Dhall support without flags or external tools** (WASM engine), including local and HTTP imports
- **CLI** (`load-object`) exposing the same core capabilities as the library

## Install

```bash
# Bun (recommended)
bun add load-object

# npm
npm install load-object
```

**Requirements:** Bun >= 1.0 or Node.js >= 20 (ESM package).

## Library usage

```ts
import { load, parse, stringify, loadDhall, parseDhall, stringifyDhall, LoadError } from "load-object";

// Load from path/URL/directory (format auto-detected)
const obj1 = await load("./data/config.yaml");                    // relative to process.cwd()
const obj2 = await load("./config.yaml", { base: "/project" });  // relative to explicit base
const obj3 = await load("/etc/myapp/config.json");                // absolute
const obj4 = await load(new URL("file:///path/to/config.toml")); // file:// URL
const obj5 = await load("https://example.com/data.json");         // remote URL
const dir  = await load("./configs", { directory: { recursive: true } });

// Parse inline content (from any supported format)
const fromJson = await parse('{"a":1}', "json");
const fromYaml = await parse("a: 1\n", "yaml");

// Stringify/serialize to any supported format
const asJson = await stringify(fromYaml, "json");   // string
const asYaml = await stringify(fromJson, "yaml");   // string
const asToml = await stringify(fromJson, "toml");   // string
const asCbor = await stringify(fromJson, "cbor");   // Uint8Array

// Convert: load/parse -> stringify
const value = await load("./data.json");
const yamlText = await stringify(value, "yaml");

// Dhall works like any other format - no flag, no external tools
const dhallVal  = await load("./config.dhall");
const dhallText = await stringify({ a: 1 }, "dhall");
// convenience aliases are still available
const sameValue = await loadDhall("./config.dhall");
const sameText  = await stringifyDhall({ a: 1 });
```

### Main API

- **`load(input, options?): Promise<unknown>`**  
  Load and parse from a `string | URL` source (relative/absolute path, `file://` URL, `http(s)` URL, or directory). Format is auto-detected from the path/URL (extensionless URLs treated as HTML). Throws `LoadError` on failure.

- **`parse(content, format, options?): Promise<unknown>`**  
  Parse inline content (`string | Uint8Array`) as the given format.

- **`stringify(value, format, options?): Promise<string | Uint8Array>`**  
  Serialize a value to the given format. Returns a `string` for text formats and a `Uint8Array` for binary formats (e.g. CBOR).

- **`loadDhall(input, options?)`, `parseDhall(content, options?)`, `stringifyDhall(value)`**  
  Convenience aliases for `load`/`parse`/`stringify` with the `dhall` format (see [Dhall](#dhall)).

- **`createLoader(deps?)`**  
  Create a loader instance with injectable dependencies (`fs`, `http`, `cwd`) for testing/customization. Default instance is exported as `defaultLoader`.

- **Per-format helpers**: `parseJson|Yaml|Toml|Xml|Html|Md|Cbor`, `stringifyJson|Yaml|Toml|Xml|Html|Md|Cbor`, `createDhallParser`, `createDhallStringifier`.

- **Path/format helpers**: `resolveInput`, `formatFromPath`, `formatFromUrl`.

- **`LoadError`**: thrown with a `code` — `UNSUPPORTED_FORMAT`, `RESOLVE_ERROR`, `NOT_FOUND`, `IO_ERROR`, `HTTP_ERROR`, `TIMEOUT`, `LIMIT_EXCEEDED`, `PARSE_ERROR`, `SERIALIZE_ERROR`.

## CLI

The CLI is a thin interface over the same library functions.

```bash
load-object --help

# Resolve by filepath (format auto-detected), output JSON by default
load-object ./data.json
load-object ./config.yaml /path/to/base        # relative source resolved against base (positional)
load-object /abs/path/data.toml
load-object https://example.com/data.json

# Parse inline string (requires --from/--to as needed)
load-object --string '{"a":1,"b":2}' --from json
load-object -s 'a: 1' -f yaml --to toml

# Convert between formats
load-object ./data.json --to yaml
load-object ./data.yaml --to json --out ./data.json
load-object ./data.json --to cbor --out ./data.cbor

# Directories
load-object ./configs                  # load directory (non-recursive)
load-object ./configs --recursive      # recursive
load-object ./configs -r --to yaml     # load/merge result serialized to yaml

# Dhall (no flag required)
load-object ./config.dhall
load-object -s '{ a = 1 }' -f dhall -t json
load-object ./data.json -t dhall
```

**Arguments / options**
- `[source]` — input path, `file://`/`http(s)` URL, or directory (omit when using `--string`)
- `[base]` — optional base directory/URL for resolving a relative `source` (positional parameter)
- `-s, --string <content>` — inline input content to parse
- `-f, --from <format>` — input format for `--string` (and can override for local file paths)
- `-t, --to <format>` — output format (`json|yaml|yml|toml|xml|html|md|cbor|dhall`); default `json` or inferred from `--out` extension
- `-o, --out <file>` — write output to file (binary-safe for CBOR)
- `-r, --recursive` — recursively load directories

## Path and URL resolution

- **Relative paths** resolve against `options.base ?? process.cwd()` (CLI: `[base]` positional) — not string concatenation.
- **Absolute paths** are normalized and used as-is.
- **`file://` URLs** are converted to local filesystem paths.
- **`http(s)://` URLs** are parsed via `WHATWG URL`; format is detected from the **pathname** extension (query/hash ignored). Extensionless URLs are treated as **HTML**.
- All resolution/loading flows (file, directory, URL, CLI) share the same resolver.

## Directory loading

- Non-recursive by default; pass `options.directory.recursive = true` (CLI: `--recursive`) to recurse into subdirectories.
- Loads entries whose detected format is supported (including `.dhall`); skips unknown/unsupported formats.
- Returns an object keyed by **entry name including extension** (e.g. `{ "config.json": { ... } }`), with children resolved via `path.join`.

## Options

```ts
interface LoadOptions {
  base?: string | URL;                 // base for resolving relative paths (default: process.cwd())
  formats?: readonly Format[];         // allowed formats
  http?: {
    timeoutMs?: number;                // default: 30000
    maxBytes?: number;                 // default: 10 MiB
    allowedProtocols?: readonly string[]; // default: ["http:", "https:"]
    followRedirects?: boolean;         // default: true
    headers?: Readonly<Record<string, string>>;
  };
  directory?: {
    recursive?: boolean;               // default: false
    includeUnknown?: boolean;          // default: false
  };
  parsers?: {                          // optional per-format parse overrides
    html?: (content: string) => unknown;
    xml?: (content: string) => unknown;
    json?: (content: string) => unknown;
    yaml?: (content: string) => unknown;
    toml?: (content: string) => unknown;
    md?: (content: string) => unknown;
    cbor?: (content: Uint8Array) => unknown | Promise<unknown>;
    dhall?: (content: string) => unknown | Promise<unknown>;
  };
}
```

## Dhall

Dhall is loaded and stringified exactly like the other formats: `load("./config.dhall")`, `parse(text, "dhall")`, and `stringify(value, "dhall")`. There is no opt-in flag and no external `dhall-to-json`/`json-to-dhall` toolchain.

- Parsing uses the official Dhall engine compiled to WebAssembly by [`dhall-wasm`](https://github.com/consoleillusion/dhall-wasm). The engine artifact ships with the pinned git dependency; consumers do not need Haskell, Nix, or any CLI tools.
- Relative/local imports resolve against the source file (or `options.base` for inline content) using the injected `fs` dependency.
- `http(s)` imports use the same `options.http` settings as remote loads: protocol allowlist, timeout, max bytes, headers, and redirects.
- Imports with `sha256:` integrity annotations are verified before evaluation. `env:` imports are rejected.
- Set `DHALL_WASM_ENGINE` to override the engine WASM location if needed.
- Dhall is an evaluated language: treat untrusted expressions and their imports with the same care you would treat executable configuration.

## Format notes

- **CBOR** is binary (`Uint8Array`) for reading/writing/stringifying.
- **HTML** parses to a parse5 document/tree; stringifying accepts a parse5 tree or a raw HTML string.
- **Markdown** is parsed to an HTML (parse5) representation (via `marked` + parse5). Stringifying Markdown expects a Markdown string input (parsed Markdown is not losslessly convertible back to Markdown source).
- **XML** round-tripping is best-effort based on `fast-xml-parser` object representation.
- **TOML** stringification follows `@iarna/toml` rules (values must be representable as TOML).

## Security notes

- Remote fetches use `fetch` with abort timeout, response size limits, allowed protocols, redirect handling, and non-2xx rejection (configurable via `options.http`).
- Dhall is evaluated by a WebAssembly engine; no child processes or shell are involved. Imports are resolved through the same fs/http dependencies and limits as normal loads.
- Other parsing/serialization libraries are used for data handling; loaded content is not executed.

## Development

```bash
bun install
bun test
bun run typecheck
bun run build
```

## License

MIT
