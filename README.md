# load-object

Load, parse, stringify, and convert structured data across local files, directories, URLs, and inline strings.

Supports **JSON, YAML (`.yaml`/`.yml`), TOML, XML, HTML, Markdown, CBOR, and Dhall** (Dhall is opt-in for safety). Built with **TypeScript** and designed to be used with **Bun** by default (also works with Node.js >= 20).

## Features

- **Unified conversion API**: load/parse input in one format and stringify to another
- Input sources: relative/absolute file paths, `file://` URLs, `http(s)` URLs, directories, and inline strings
- Correct handling of **relative and absolute** paths via a shared resolver (`base` for relative resolution)
- Directory loading with optional recursion
- TypeScript types and typed `LoadError`s
- Safe remote fetching with protocol allowlist, timeout, and max-size limits
- **Safe, opt-in Dhall support** (no shell, no global stdio monkeypatching; external tools executed with bounded, checked child processes)
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

// Dhall is opt-in (requires external dhall-json tools on PATH)
const dhallVal  = await loadDhall("./config.dhall");           // uses dhall-to-json
const dhallText = await stringifyDhall({ a: 1 });              // uses json-to-dhall
// or explicitly via options:
await load("./config.dhall", { dhall: { enabled: true } });
await stringify({ a: 1 }, "dhall", { dhall: { enabled: true } });
```

### Main API

- **`load(input, options?): Promise<unknown>`**  
  Load and parse from a `string | URL` source (relative/absolute path, `file://` URL, `http(s)` URL, or directory). Format is auto-detected from the path/URL (extensionless URLs treated as HTML). Throws `LoadError` on failure.

- **`parse(content, format, options?): Promise<unknown>`**  
  Parse inline content (`string | Uint8Array`) as the given format.

- **`stringify(value, format, options?): Promise<string | Uint8Array>`**  
  Serialize a value to the given format. Returns a `string` for text formats and a `Uint8Array` for binary formats (e.g. CBOR).

- **`loadDhall(input, options?)`, `parseDhall(content, options?)`, `stringifyDhall(value)`**  
  Dhall helpers (opt-in; see [Dhall](#dhall-opt-in)).

- **`createLoader(deps?)`**  
  Create a loader instance with injectable dependencies (`fs`, `http`, `proc`, `cwd`) for testing/customization. Default instance is exported as `defaultLoader`.

- **Per-format helpers**: `parseJson|Yaml|Toml|Xml|Html|Md|Cbor`, `stringifyJson|Yaml|Toml|Xml|Html|Md|Cbor`, `createDhallParser`, `createDhallStringifier`.

- **Path/format helpers**: `resolveInput`, `formatFromPath`, `formatFromUrl`.

- **`LoadError`**: thrown with a `code` — `UNSUPPORTED_FORMAT`, `DISABLED_FORMAT`, `RESOLVE_ERROR`, `NOT_FOUND`, `IO_ERROR`, `HTTP_ERROR`, `TIMEOUT`, `LIMIT_EXCEEDED`, `PARSE_ERROR`, `SERIALIZE_ERROR`, `EXTERNAL_TOOL_ERROR`.

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

# Dhall (opt-in only flag)
load-object ./config.dhall --enable-dhall
load-object -s '{ a = 1 }' -f dhall -t json --enable-dhall
load-object ./data.json -t dhall --enable-dhall
```

**Arguments / options**
- `[source]` — input path, `file://`/`http(s)` URL, or directory (omit when using `--string`)
- `[base]` — optional base directory/URL for resolving a relative `source` (positional parameter)
- `-s, --string <content>` — inline input content to parse
- `-f, --from <format>` — input format for `--string` (and can override for local file paths)
- `-t, --to <format>` — output format (`json|yaml|yml|toml|xml|html|md|cbor|dhall`); default `json` or inferred from `--out` extension
- `-o, --out <file>` — write output to file (binary-safe for CBOR)
- `-r, --recursive` — recursively load directories
- `--enable-dhall` — explicitly enable Dhall parsing/stringifying (no other Dhall-specific CLI options)

## Path and URL resolution

- **Relative paths** resolve against `options.base ?? process.cwd()` (CLI: `[base]` positional) — not string concatenation.
- **Absolute paths** are normalized and used as-is.
- **`file://` URLs** are converted to local filesystem paths.
- **`http(s)://` URLs** are parsed via `WHATWG URL`; format is detected from the **pathname** extension (query/hash ignored). Extensionless URLs are treated as **HTML**.
- All resolution/loading flows (file, directory, URL, CLI) share the same resolver.

## Directory loading

- Non-recursive by default; pass `options.directory.recursive = true` (CLI: `--recursive`) to recurse into subdirectories.
- Loads entries whose detected format is supported; skips unknown/unsupported formats and skips `.dhall` unless Dhall is enabled.
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
  dhall?: {
    enabled?: boolean;                 // default: false (opt-in required)
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
  };
}
```

## Dhall (opt-in)

Dhall support is **disabled by default** and must be explicitly enabled (`{ dhall: { enabled: true } }`, `loadDhall/parseDhall/stringifyDhall`, or CLI `--enable-dhall`). This is the only Dhall control exposed.

- **Parsing** uses the external `dhall-to-json` tool; **stringifying** uses `json-to-dhall` (from `dhall-json`). Ensure the required tool is installed and on `PATH`.
- Execution is **safe by implementation**: direct child process with `shell: false`, input via stdin, captured stdout/stderr (no global `process.stdout/stderr` mutation), time and output-size limits, and strict exit-code/stderr checks.
- **Security note:** Dhall is an evaluated configuration language and may resolve imports depending on tool/version/configuration. Treat untrusted `.dhall` input accordingly.

## Format notes

- **CBOR** is binary (`Uint8Array`) for reading/writing/stringifying.
- **HTML** parses to a parse5 document/tree; stringifying accepts a parse5 tree or a raw HTML string.
- **Markdown** is parsed to an HTML (parse5) representation (via `marked` + parse5). Stringifying Markdown expects a Markdown string input (parsed Markdown is not losslessly convertible back to Markdown source).
- **XML** round-tripping is best-effort based on `fast-xml-parser` object representation.
- **TOML** stringification follows `@iarna/toml` rules (values must be representable as TOML).

## Security notes

- Remote fetches use `fetch` with abort timeout, response size limits, allowed protocols, redirect handling, and non-2xx rejection (configurable via `options.http`).
- Dhall runs out-of-process only when explicitly enabled and with bounded, non-shell execution.
- Parsing/serialization libraries are used for data handling; loaded content is not executed.

## Development

```bash
bun install
bun test
bun run typecheck
bun run build
```

## License

MIT
