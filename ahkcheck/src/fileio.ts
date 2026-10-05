/** File reading/writing with UTF-8 BOM preservation and LF output. */

import { readFileSync, writeFileSync } from "node:fs";

export interface AhkFile {
  bom: boolean;
  text: string;
}

const BOM = "\uFEFF";

const decoder = new TextDecoder("utf-8", { fatal: true });

export function readAhkFile(path: string): AhkFile {
  const bytes = readFileSync(path);
  const bom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  try {
    const text = decoder.decode(bom ? bytes.subarray(3) : bytes);
    return { bom, text };
  } catch {
    throw new Error("file is not valid UTF-8");
  }
}

export function splitLines(text: string): string[] {
  // Drop a trailing empty element caused by the final newline.
  const raw = text.split("\n");
  if (raw.length > 0 && raw[raw.length - 1] === "") raw.pop();
  return raw.map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
}

export function joinLines(lines: string[]): string {
  if (lines.length === 0) return "";
  return lines.join("\n") + "\n";
}

export function serialize(file: AhkFile, lines: string[]): string {
  return (file.bom ? BOM : "") + joinLines(lines);
}

export function writeAhkFile(path: string, content: string): void {
  writeFileSync(path, content, "utf8");
}
