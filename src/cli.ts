import { command, run, positional, string, option, flag, optional, boolean } from "cmd-ts";
import { load, parse, stringify } from "./index.js";
import { LoadError } from "./errors.js";
import { formatFromPath } from "./path/format.js";
import type { Format, LoadOptions } from "./types.js";

const KNOWN_FORMATS = new Set<string>(["json", "yaml", "yml", "toml", "xml", "html", "md", "cbor", "dhall"]);

const inferOutputFormat = (outPath: string | undefined): Format | undefined => {
  if (!outPath) return undefined;
  const fmt = formatFromPath(outPath);
  return fmt ?? undefined;
};

const asFormat = (value: string, label: string): Format => {
  if (!KNOWN_FORMATS.has(value)) {
    throw new Error(`Unknown ${label} format: ${value}. Supported: json, yaml, yml, toml, xml, html, md, cbor, dhall`);
  }
  return value as Format;
};

const writeOutput = async (data: string | Uint8Array, outPath: string | undefined): Promise<void> => {
  if (!outPath) {
    if (typeof data === "string") {
      process.stdout.write(data.endsWith("\n") ? data : data + "\n");
    } else {
      await Bun.write(Bun.stdout, data);
    }
    return;
  }
  await Bun.write(outPath, data);
};

const app = command({
  name: "load-object",
  description:
    "Load/parse/convert data between formats (JSON, YAML, TOML, XML, HTML, Markdown, CBOR, Dhall). " +
    "Input can be a file/URL/directory path OR inline content via --string with --from. " +
    "Output defaults to JSON unless --to (or --out extension) is specified.",
  args: {
    source: positional({
      type: optional(string),
      displayName: "source",
      description: "Input path, file URL, http(s) URL, or directory (omit when using --string)",
    }),
    base: positional({
      type: optional(string),
      displayName: "base",
      description: "Optional base directory/URL for resolving a relative source path",
    }),
    string: option({
      type: optional(string),
      long: "string",
      short: "s",
      description: "Inline input content to parse (instead of reading from source)",
    }),
    from: option({
      type: optional(string),
      long: "from",
      short: "f",
      description: "Input format when using --string (or to override detection): json,yaml,yml,toml,xml,html,md,cbor,dhall",
    }),
    to: option({
      type: optional(string),
      long: "to",
      short: "t",
      description: "Output format: json,yaml,yml,toml,xml,html,md,cbor,dhall (default: json; or inferred from --out)",
    }),
    out: option({
      type: optional(string),
      long: "out",
      short: "o",
      description: "Write output to a file instead of stdout (format inferred from extension if --to omitted)",
    }),
    recursive: flag({
      type: boolean,
      long: "recursive",
      short: "r",
      defaultValue: () => false,
      description: "Recursively load directories (default: false)",
      defaultValueIsSerializable: true,
    }),
  },
  handler: async (args) => {
    try {
      if (args.string !== undefined && args.source !== undefined) {
        throw new Error("Provide either a source path/URL or --string, not both.");
      }
      if (args.string !== undefined && args.base !== undefined) {
        throw new Error("--base applies to path/URL sources, not --string input.");
      }

      const commonOptions: LoadOptions = {
        directory: { recursive: args.recursive },
      };

      let value: unknown;

      if (args.string !== undefined) {
        if (!args.from) {
          throw new Error("--from is required when using --string.");
        }
        const fromFormat = asFormat(args.from, "input (--from)");
        value = await parse(args.string, fromFormat, commonOptions);
      } else {
        if (!args.source) {
          throw new Error("Missing input: provide a source path/URL/directory or use --string with --from. See --help.");
        }
        // If --from is provided for a path/URL, parse by reading? Simpler: load normally; --from mainly for --string.
        // But to keep CLI/library parity and allow forcing, we can load content when forcing format - however load handles dirs/urls.
        // Support --from override for file/URL by reading+parsing is non-trivial for URLs/dirs; document as string-mode primarily.
        if (args.from) {
          // Attempt to treat source as local file path for forced parsing; for URLs this is ambiguous, so restrict to non-URL local paths.
          const forced = asFormat(args.from, "input (--from)");
          const isUrlLike = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(args.source);
          if (isUrlLike) {
            throw new Error("--from override is supported with --string; for URL/file sources omit --from to auto-detect by extension.");
          }
          const path = await import("node:path");
          const fs = await import("node:fs/promises");
          const resolvedPath = path.resolve(args.base ?? process.cwd(), args.source);
          const text = await fs.readFile(resolvedPath, "utf8");
          value = await parse(text, forced, commonOptions);
        } else {
          const options: LoadOptions = {
            ...commonOptions,
            ...(args.base ? { base: args.base } : {}),
          };
          value = await load(args.source, options);
        }
      }

      const outFormat = args.to ? asFormat(args.to, "output (--to)") : (inferOutputFormat(args.out) ?? "json");
      const output = await stringify(value, outFormat);
      await writeOutput(output, args.out);
    } catch (error) {
      if (error instanceof LoadError) {
        process.stderr.write(`Error [${error.code}]: ${error.message}\n`);
      } else {
        process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
      process.exitCode = 1;
    }
  },
});

run(app, process.argv.slice(2));
