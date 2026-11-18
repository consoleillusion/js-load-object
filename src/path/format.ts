import { extname } from "node:path";
import type { Format } from "../types.js";

export const KNOWN_FORMATS = new Set<string>([
  "json",
  "yaml",
  "yml",
  "toml",
  "xml",
  "html",
  "md",
  "cbor",
  "dhall",
]);

export const normalizeFormat = (ext: string): Format | null => {
  const cleaned = ext.replace(/^\./, "").toLowerCase();
  return KNOWN_FORMATS.has(cleaned) ? (cleaned as Format) : null;
};

export const formatFromPath = (pathLike: string): Format | null => {
  const ext = extname(pathLike);
  return normalizeFormat(ext);
};

export const formatFromUrl = (url: URL): Format | null => {
  const pathname = url.pathname || "";
  // If no extension, treat as html (common for root/index pages)
  const ext = extname(pathname);
  if (!ext) return "html";
  return normalizeFormat(ext);
};

export const isKnownFormat = (value: string): value is Format => KNOWN_FORMATS.has(value);
