import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { load, LoadError } from "../src/index.js";

let server: ReturnType<typeof Bun.serve> | null = null;
let baseUrl = "";

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/data.json") {
        return new Response(JSON.stringify({ ok: true, via: "http" }), { headers: { "content-type": "application/json" } });
      }
      if (url.pathname === "/data.yaml") {
        return new Response("a: 1\nb: two\n", { headers: { "content-type": "text/yaml" } });
      }
      if (url.pathname === "/noext") {
        return new Response("<!doctype html><html><body>hi</body></html>", { headers: { "content-type": "text/html" } });
      }
      if (url.pathname === "/big") {
        const big = "x".repeat(200);
        return new Response(big, { headers: { "content-type": "text/plain" } });
      }
      if (url.pathname === "/error") {
        return new Response("nope", { status: 500, statusText: "Server Error" });
      }
      return new Response("not found", { status: 404 });
    },
  });
  baseUrl = `http://127.0.0.1:${server.port}`;
});

afterAll(() => {
  server?.stop(true);
});

describe("remote http loading", () => {
  test("loads json over http", async () => {
    const res = await load(`${baseUrl}/data.json`);
    expect(res).toEqual({ ok: true, via: "http" });
  });

  test("loads yaml over http", async () => {
    const res = await load(`${baseUrl}/data.yaml`) as any;
    expect(res.a).toBe(1);
    expect(res.b).toBe("two");
  });

  test("treats extensionless URL as html", async () => {
    const res = await load(`${baseUrl}/noext`) as any;
    expect(res && typeof res === "object").toBe(true);
  });

  test("throws on http error status", async () => {
    await expect(load(`${baseUrl}/error`)).rejects.toMatchObject({ code: "HTTP_ERROR" });
  });

  test("enforces maxBytes", async () => {
    await expect(load(`${baseUrl}/data.yaml`, { http: { maxBytes: 5 } })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
  });

  test("enforces allowed protocols", async () => {
    await expect(load(`${baseUrl}/data.json`, { http: { allowedProtocols: ["https:"] } })).rejects.toBeInstanceOf(LoadError);
  });
});
