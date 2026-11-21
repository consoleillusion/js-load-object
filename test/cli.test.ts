import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const fixtures = resolve(import.meta.dir, "fixtures/local");
const cli = resolve(import.meta.dir, "../src/cli.ts");

const runCli = async (args: string[]) => {
  const proc = Bun.spawn(["bun", "run", cli, ...args], {
    cwd: resolve(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env },
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
};

describe("cli", () => {
  test("prints loaded json to stdout", async () => {
    const { stdout, stderr, exitCode } = await runCli([resolve(fixtures, "data.json")]);
    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    const parsed = JSON.parse(stdout);
    expect(parsed).toEqual({ name: "local-json", value: 42 });
  });

  test("resolves relative path with base positional arg", async () => {
    const { stdout, exitCode } = await runCli(["./data.yaml", fixtures]);
    expect(exitCode).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.name).toBe("local-yaml");
  });

  test("parses inline string with --string and --from", async () => {
    const { stdout, exitCode } = await runCli(["--string", '{"a":1}', "--from", "json"]);
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toEqual({ a: 1 });
  });

  test("converts inline string to another format with --to", async () => {
    const { stdout, exitCode } = await runCli(["--string", '{"a":1}', "--from", "json", "--to", "yaml"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("a: 1");
  });

  test("loads dhall without any flag", async () => {
    const { stdout, stderr, exitCode } = await runCli([resolve(fixtures, "script.dhall")]);
    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toEqual({ name: "dhall-fixture", count: 2 });
  });

  test("reports errors with non-zero exit", async () => {
    const { stderr, exitCode } = await runCli([resolve(fixtures, "does-not-exist.json")]);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("NOT_FOUND");
  });
});
