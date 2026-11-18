import { describe, expect, test } from "bun:test";
import { load, parse, stringify } from "../src/index.js";
import { resolve } from "node:path";

const fixtures = resolve(import.meta.dir, "fixtures/local");

describe("parse from string", () => {
  test("parses json string", async () => {
    const res = await parse('{"a":1,"b":"x"}', "json");
    expect(res).toEqual({ a: 1, b: "x" });
  });

  test("parses yaml string", async () => {
    const res = await parse("a: 1\nb: two\n", "yaml") as any;
    expect(res).toEqual({ a: 1, b: "two" });
  });

  test("parses toml string", async () => {
    const res = await parse('a = 1\nb = "two"\n', "toml") as any;
    expect(res).toEqual({ a: 1, b: "two" });
  });
});

describe("stringify to formats", () => {
  const value = { a: 1, b: "two", nested: { ok: true } };

  test("stringifies to json", async () => {
    const out = await stringify(value, "json");
    expect(typeof out).toBe("string");
    expect(JSON.parse(out as string)).toEqual(value);
  });

  test("stringifies to yaml", async () => {
    const out = await stringify(value, "yaml") as string;
    expect(out).toContain("a: 1");
    expect(out).toContain("b: two");
  });

  test("stringifies to toml", async () => {
    const out = await stringify(value, "toml") as string;
    expect(out).toContain("a = 1");
    expect(out).toContain('b = "two"');
  });

  test("stringifies to cbor bytes", async () => {
    const out = await stringify(value, "cbor");
    expect(out).toBeInstanceOf(Uint8Array);
    // round-trip through parse
    const parsed = await parse(out as Uint8Array, "cbor");
    expect(parsed).toEqual(value);
  });
});

describe("convert (load/parse -> stringify)", () => {
  test("converts loaded json file value to yaml", async () => {
    const value = await load(resolve(fixtures, "data.json"));
    const yaml = await stringify(value, "yaml") as string;
    expect(yaml).toContain("name: local-json");
    expect(yaml).toContain("value: 42");
  });

  test("round-trips json string -> parse -> stringify -> parse", async () => {
    const input = '{"x":10,"arr":[1,2,3]}';
    const value = await parse(input, "json");
    const out = await stringify(value, "json") as string;
    const value2 = await parse(out, "json");
    expect(value2).toEqual(value);
  });

  test("xml round-trip for simple structure", async () => {
    const xmlIn = '<root attr="1"><item>hello</item></root>';
    const value = await parse(xmlIn, "xml");
    const xmlOut = await stringify(value, "xml") as string;
    expect(typeof xmlOut).toBe("string");
    const value2 = await parse(xmlOut, "xml");
    expect(value2).toEqual(value);
  });

  test("html stringify from loaded parse5 document", async () => {
    const doc = await load(resolve(fixtures, "page.html"));
    const htmlOut = await stringify(doc, "html") as string;
    expect(htmlOut.toLowerCase()).toContain("<html");
    expect(htmlOut).toContain("Hello");
  });
});
