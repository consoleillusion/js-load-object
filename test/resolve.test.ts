import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { formatFromPath, formatFromUrl, resolveInput } from "../src/index.js";

describe("format detection", () => {
  test("detects known extensions from paths", () => {
    expect(formatFromPath("/a/b/file.json")).toBe("json");
    expect(formatFromPath("/a/b/file.yaml")).toBe("yaml");
    expect(formatFromPath("/a/b/file.yml")).toBe("yml");
    expect(formatFromPath("/a/b/file.toml")).toBe("toml");
    expect(formatFromPath("/a/b/file.xml")).toBe("xml");
    expect(formatFromPath("/a/b/file.html")).toBe("html");
    expect(formatFromPath("/a/b/file.md")).toBe("md");
    expect(formatFromPath("/a/b/file.cbor")).toBe("cbor");
    expect(formatFromPath("/a/b/file.dhall")).toBe("dhall");
    expect(formatFromPath("/a/b/file.txt")).toBeNull();
  });

  test("detects format from URL pathname and treats extensionless as html", () => {
    expect(formatFromUrl(new URL("https://example.com/data.json?x=1#y"))).toBe("json");
    expect(formatFromUrl(new URL("https://example.com/path/"))).toBe("html");
    expect(formatFromUrl(new URL("https://example.com/path"))).toBe("html");
  });
});

describe("resolveInput", () => {
  test("resolves relative paths against base", () => {
    const base = "/tmp/base/dir";
    const r = resolveInput("./foo/bar.json", base);
    expect(r.kind).toBe("file");
    if (r.kind === "file") {
      expect(r.path).toBe(resolve(base, "./foo/bar.json"));
      expect(r.format).toBe("json");
    }
  });

  test("keeps absolute paths absolute", () => {
    const abs = "/var/data/config.yaml";
    const r = resolveInput(abs, "/tmp/other");
    expect(r.kind).toBe("file");
    if (r.kind === "file") {
      expect(r.path).toBe(resolve(abs));
      expect(r.format).toBe("yaml");
    }
  });

  test("resolves file:// URLs to local paths", () => {
    const abs = "/tmp/example/data.toml";
    const u = pathToFileURL(abs);
    const r = resolveInput(u.toString(), "/ignored");
    expect(r.kind).toBe("file");
    if (r.kind === "file") {
      expect(r.path).toBe(resolve(abs));
      expect(r.format).toBe("toml");
    }
  });

  test("resolves http(s) URLs as url kind", () => {
    const r = resolveInput("https://example.com/a/b.json", "/tmp");
    expect(r.kind).toBe("url");
    if (r.kind === "url") {
      expect(r.url.protocol).toBe("https:");
      expect(r.format).toBe("json");
    }
  });
});
