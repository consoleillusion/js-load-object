import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { encode as cborEncode } from "@ipld/dag-cbor";
import { load, LoadError } from "../src/index.js";

const fixtures = resolve(import.meta.dir, "fixtures/local");

describe("local file loading", () => {
  test("loads json by relative path with base", async () => {
    const res = await load("./data.json", { base: fixtures });
    expect(res).toEqual({ name: "local-json", value: 42 });
  });

  test("loads yaml and yml", async () => {
    const yaml = await load(join(fixtures, "data.yaml"));
    expect(yaml).toMatchObject({ name: "local-yaml", value: 7 });
    const yml = await load(join(fixtures, "data.yml"));
    expect(yml).toEqual({ name: "local-yml" });
  });

  test("loads toml", async () => {
    const res = await load(join(fixtures, "config.toml")) as any;
    expect(res.title).toBe("TOML Example");
    expect(res.owner.name).toBe("Tom");
  });

  test("loads xml", async () => {
    const res = await load(join(fixtures, "data.xml")) as any;
    expect(res.root).toBeDefined();
    expect(res.root.item).toBe("hello");
  });

  test("loads html and markdown to parse5 document objects", async () => {
    const html = await load(join(fixtures, "page.html")) as any;
    expect(html && typeof html === "object").toBe(true);
    expect(html.nodeName || html.type || html.childNodes).toBeTruthy();

    const md = await load(join(fixtures, "readme.md")) as any;
    expect(md && typeof md === "object").toBe(true);
  });

  test("loads cbor binary file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "load-object-cbor-"));
    const file = join(dir, "data.cbor");
    const payload = { hello: "world", n: 3, arr: [1, 2] };
    const bytes = cborEncode(payload);
    writeFileSync(file, bytes);
    const res = await load(file);
    expect(res).toEqual(payload);
  });

  test("loads via file:// URL", async () => {
    const fileUrl = pathToFileURL(join(fixtures, "data.json")).toString();
    const res = await load(fileUrl);
    expect(res).toEqual({ name: "local-json", value: 42 });
  });

  test("loads directory (non-recursive, skips unknown and disabled dhall)", async () => {
    const res = await load(fixtures) as Record<string, unknown>;
    expect(res["data.json"]).toEqual({ name: "local-json", value: 42 });
    expect(res["data.yaml"]).toMatchObject({ name: "local-yaml" });
    expect(res["config.toml"]).toBeTruthy();
    // unknown .txt skipped
    expect(Object.prototype.hasOwnProperty.call(res, "ignore.txt")).toBe(false);
    // .dhall skipped when not enabled
    expect(Object.prototype.hasOwnProperty.call(res, "script.dhall")).toBe(false);
    // subdir not included when non-recursive
    expect(Object.prototype.hasOwnProperty.call(res, "subdir")).toBe(false);
  });

  test("throws typed error for unsupported/missing", async () => {
    await expect(load(join(fixtures, "ignore.txt"))).rejects.toBeInstanceOf(LoadError);
    await expect(load(join(fixtures, "does-not-exist.json"))).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("throws DISABLED_FORMAT for dhall by default", async () => {
    await expect(load(join(fixtures, "script.dhall"))).rejects.toMatchObject({ code: "DISABLED_FORMAT" });
  });
});
