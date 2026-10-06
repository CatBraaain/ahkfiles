import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyLines } from "../src/classify.ts";
import { readAhkFile, splitLines } from "../src/fileio.ts";
import { splitHotDefinition } from "../src/lexer.ts";

const BASE = "95dd2f387a9d0381bde7114ef3d099c9dbc5f5a7";
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const BIN = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
let dir: string;
let paths: string[];
const originals = new Map<string, Buffer>();

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "ahkcheck-corpus-"));
  paths = execFileSync("git", ["-C", ROOT, "ls-tree", "-r", "--name-only", BASE], {
    encoding: "utf8",
  })
    .trimEnd()
    .split("\n")
    .filter((path) => path.endsWith(".ahk"));
  if (paths.some((path) => path === "Env.ahk"))
    throw new Error("private settings must not enter the corpus");
  for (const path of paths) {
    const bytes = execFileSync("git", ["-C", ROOT, "show", `${BASE}:${path}`]);
    originals.set(path, bytes);
    const copy = join(dir, path);
    mkdirSync(dirname(copy), { recursive: true });
    writeFileSync(copy, bytes);
  }
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

function run(args: string[]) {
  const start = performance.now();
  const result = spawnSync(BIN, args, { cwd: dir, encoding: "utf8" });
  const elapsedMs = performance.now() - start;
  expect(result.error).toBeUndefined();
  const record = {
    command: [BIN, ...args],
    cwd: dir,
    exit: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    elapsedMs,
  };
  console.log(JSON.stringify(record));
  return record;
}

function preservedContent(text: string) {
  const { infos } = classifyLines(splitLines(text));
  return {
    tokens: infos.flatMap((info) => info.toks?.map((tok) => [tok.kind, tok.text]) ?? []),
    sections: infos
      .filter((info) => info.kind === "contsec" || info.kind === "blockcomment")
      .map((info) => info.raw),
    definitions: infos
      .filter((info) => info.kind === "hotkey")
      .map((info) => {
        const definition = splitHotDefinition(info.raw)!;
        return definition.hotstring ? info.raw.trimStart() : definition.key;
      }),
    directives: infos
      .filter((info) => info.kind === "directive")
      .map((info) => info.raw.trimStart()),
  };
}

describe("cli: tracked reference corpus", () => {
  it("finishes one end-to-end default run for 13 files / 934 lines within five seconds", () => {
    expect(process.platform).toBe("linux");
    expect(process.arch).toBe("x64");
    expect(execFileSync("bun", ["--version"], { encoding: "utf8" }).trim()).toBe("1.4.2");
    expect(paths).toHaveLength(13);
    expect(
      [...originals.values()].reduce(
        (sum, bytes) => sum + bytes.toString("utf8").split("\n").length - 1,
        0,
      ),
    ).toBe(934);
    const result = run([]);
    expect(result.elapsedMs).toBeLessThanOrEqual(5000);
    expect(result.exit).toBe(1);
    expect(result.stdout).toContain("Checking formatting...");
    expect(result.stderr).toContain("[warn] ");
    expect(result.stderr).toContain("Run ahkcheck with --write to fix.");
    for (const path of paths)
      expect(readFileSync(join(dir, path)), path).toEqual(originals.get(path));
  });

  it("dogfoods --write/default/--lint and preserves content and idempotence on copies only", () => {
    const write = run(["--write"]);
    expect(write.exit).toBe(0);
    expect(write.stderr).toBe("");
    const changed = paths.filter(
      (path) => !readFileSync(join(dir, path)).equals(originals.get(path)!),
    );
    const writeLines = write.stdout.trimEnd().split("\n");
    expect(writeLines).toHaveLength(paths.length);
    for (const path of paths) {
      const line = writeLines.find((l) => l.startsWith(`${path} `));
      expect(line, path).toBeDefined();
      const match = line!.match(/^(\S.+ )\d+ms( \(unchanged\))?$/);
      expect(match, path).not.toBeNull();
      expect(match![2] !== undefined, path).toBe(!changed.includes(path));
    }
    const formatted = new Map(paths.map((path) => [path, readFileSync(join(dir, path))]));
    for (const path of paths) {
      const beforeBytes = originals.get(path)!;
      const afterFile = readAhkFile(join(dir, path));
      const before = beforeBytes.toString("utf8").replace(/^\uFEFF/, "");
      expect(afterFile.bom, path).toBe(
        beforeBytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
      );
      expect(afterFile.text, path).not.toContain("\r\n");
      expect(preservedContent(afterFile.text), path).toEqual(preservedContent(before));
    }
    expect(run([])).toMatchObject({
      exit: 0,
      stdout: "Checking formatting...\nAll matched files use ahkcheck code style!\n",
      stderr: "",
    });
    expect(run(["--lint"])).toMatchObject({ exit: 0, stdout: "", stderr: "" });
    const again = run(["--write"]);
    expect(again.exit).toBe(0);
    expect(again.stdout.split("\n").filter((l) => l.endsWith("(unchanged)"))).toHaveLength(
      paths.length,
    );
    for (const path of paths)
      expect(readFileSync(join(dir, path)), path).toEqual(formatted.get(path));
    console.log(
      JSON.stringify({
        files: paths.length,
        changed,
        preservation: "13/13",
        idempotence: "13/13",
        liveRoot: resolve(ROOT),
      }),
    );
  });
});
