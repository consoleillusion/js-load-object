import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createLoader, createDefaultDeps, load, loadDhall, parseDhall, LoadError } from "../src/index.js";
import type { ProcDeps } from "../src/types.js";

const fixtures = resolve(import.meta.dir, "fixtures/local");

const mockProc = (impl: ProcDeps["execFile"]): ProcDeps => ({ execFile: impl });

describe("dhall (opt-in, safe)", () => {
  test("generic load rejects .dhall when not enabled", async () => {
    await expect(load(join(fixtures, "script.dhall"))).rejects.toMatchObject({ code: "DISABLED_FORMAT" });
  });

  test("loadDhall enables dhall and uses proc dep (mocked)", async () => {
    const proc = mockProc(async (command, args, options) => {
      expect(command).toBe("dhall-to-json");
      expect(options.input).toBeDefined();
      return { stdout: JSON.stringify({ name: "from-dhall", count: 2 }), stderr: "", exitCode: 0, signal: null, timedOut: false };
    });
    const loader = createLoader({ ...createDefaultDeps(), proc });
    const res = await loader.loadDhall(join(fixtures, "script.dhall"));
    expect(res).toEqual({ name: "from-dhall", count: 2 });
  });

  test("parseDhall works with mocked proc", async () => {
    const proc = mockProc(async () => ({ stdout: '{"x":1}', stderr: "", exitCode: 0, signal: null, timedOut: false }));
    const loader = createLoader({ ...createDefaultDeps(), proc });
    const res = await loader.parseDhall('{ x = 1 }');
    expect(res).toEqual({ x: 1 });
  });

  test("surfaces missing dhall-to-json as ExternalToolError", async () => {
    const proc = mockProc(async () => {
      const err: any = new Error("spawn dhall-to-json ENOENT");
      err.code = "ENOENT";
      throw err;
    });
    const loader = createLoader({ ...createDefaultDeps(), proc });
    await expect(loader.parseDhall('{ a = 1 }')).rejects.toMatchObject({ code: "EXTERNAL_TOOL_ERROR" });
  });

  test("surfaces non-zero exit with stderr", async () => {
    const proc = mockProc(async () => ({ stdout: "", stderr: "parse failed", exitCode: 1, signal: null, timedOut: false }));
    const loader = createLoader({ ...createDefaultDeps(), proc });
    await expect(loader.parseDhall('bad')).rejects.toMatchObject({ code: "EXTERNAL_TOOL_ERROR" });
  });

  test("surfaces timeout", async () => {
    const proc = mockProc(async () => ({ stdout: "", stderr: "", exitCode: -1, signal: "SIGKILL", timedOut: true }));
    const loader = createLoader({ ...createDefaultDeps(), proc });
    await expect(loader.parseDhall('{ a = 1 }')).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  // Optional integration: only runs when dhall-to-json is available in PATH
  test("integration with real dhall-to-json if installed", async () => {
    const hasDhall = await (async () => {
      try {
        const p = Bun.spawn(["dhall-to-json", "--version"], { stdout: "ignore", stderr: "ignore" });
        const code = await p.exited;
        return code === 0;
      } catch {
        return false;
      }
    })();
    if (!hasDhall) {
      // skip by early return in bun test
      return;
    }
    const res = await loadDhall(join(fixtures, "script.dhall"));
    expect(res).toEqual({ name: "dhall-fixture", count: 2 });
  });
});
