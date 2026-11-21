import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { load, parse, stringify, loadDhall, parseDhall, stringifyDhall } from "../src/index.js";

const fixtures = resolve(import.meta.dir, "fixtures/local");

describe("dhall (wasm engine, no opt-in flag)", () => {
  test("loads .dhall with the generic load function", async () => {
    const res = await load(join(fixtures, "script.dhall"));
    expect(res).toEqual({ name: "dhall-fixture", count: 2 });
  });

  test("loadDhall is just an alias for load", async () => {
    await expect(loadDhall(join(fixtures, "script.dhall"))).resolves.toEqual({
      name: "dhall-fixture",
      count: 2,
    });
  });

  test("parses inline dhall", async () => {
    await expect(parse('{ x = 1, label = "ok" }', "dhall")).resolves.toEqual({ x: 1, label: "ok" });
    await expect(parseDhall("{ x = 2 }")).resolves.toEqual({ x: 2 });
  });

  test("stringifies values as dhall", async () => {
    const text = await stringify({ count: 2, name: "dhall" }, "dhall");
    expect(typeof text).toBe("string");
    expect(text).toContain("count = 2");
    expect(text).toContain('name = "dhall"');
    await expect(parse(text as string, "dhall")).resolves.toEqual({ count: 2, name: "dhall" });
    expect(await stringifyDhall({ ok: true })).toContain("ok = True");
  });

  test("maps engine diagnostics to PARSE_ERROR", async () => {
    await expect(parse("let x = in x", "dhall")).rejects.toMatchObject({
      name: "LoadError",
      code: "PARSE_ERROR",
      format: "dhall",
    });
  });

  test("resolves local imports relative to the source file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "load-object-dhall-local-"));
    const main = join(dir, "main.dhall");
    writeFileSync(join(dir, "part.dhall"), "{ count = 3 }");
    writeFileSync(main, 'let part = ./part.dhall in { name = "local", count = part.count }');

    await expect(load(main)).resolves.toEqual({ name: "local", count: 3 });
  });

  test("resolves remote imports through the existing HTTP options", async () => {
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/part.dhall") {
          return new Response("{ count = 7 }", { headers: { "content-type": "application/x-dhall" } });
        }
        return new Response("not found", { status: 404 });
      },
    });
    try {
      const source = `let part = http://127.0.0.1:${server.port}/part.dhall in { name = "remote", count = part.count }`;
      await expect(parse(source, "dhall")).resolves.toEqual({ name: "remote", count: 7 });
      await expect(parse(source, "dhall", { http: { maxBytes: 5 } })).rejects.toMatchObject({
        code: "PARSE_ERROR",
      });
    } finally {
      server.stop(true);
    }
  });
});
