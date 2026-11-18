import { readFile, readdir, stat } from "node:fs/promises";
import type { FsDeps } from "../types.js";

export const createFsDeps = (): FsDeps => ({
  stat: async (path: string) => stat(path),
  readFile: async (path: string) => new Uint8Array(await readFile(path)),
  readTextFile: async (path: string) => readFile(path, "utf8"),
  readdir: async (path: string) => readdir(path),
});
