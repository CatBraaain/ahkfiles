import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runCli } from "../src/cli.ts";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ahkcheck-test-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(rel: string, content: string): string {
  const path = join(dir, rel);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content, "utf8");
  return path;
}

const CLEAN = 'x := 1\nMsgBox("ok")\n';
const DIRTY = "x:=1\n"; // needs operator spacing
const LINT_PROBLEM = "x = 1\n";
const CHECK_OK = ["Checking formatting...", "All matched files use ahkcheck code style!"];
const warnSummary = (files: string) =>
  `[warn] Code style issues found in the above ${files}. Run ahkcheck with --write to fix.`;

/** Durations vary between runs, so normalize them before comparing output. */
function withoutDurations(result: { exit: unknown; stdout: string; stderr: string }) {
  return {
    exit: result.exit,
    stdout: result.stdout.replace(/\b\d+ms\b/g, "Xms"),
    stderr: result.stderr,
  };
}

describe("cli: default mode", () => {
  it("prints the success lines for clean files", () => {
    write("clean.ahk", CLEAN);
    const r = runCli(["clean.ahk"], dir);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toEqual(CHECK_OK);
    expect(r.stderr).toEqual([]);
  });

  it("warns on stderr for files needing formatting and exits 1", () => {
    write("dirty.ahk", DIRTY);
    const r = runCli(["dirty.ahk"], dir);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toEqual(["Checking formatting..."]);
    expect(r.stderr).toEqual(["[warn] dirty.ahk", warnSummary("file")]);
    expect(readFileSync(join(dir, "dirty.ahk"), "utf8")).toBe(DIRTY);
  });

  it("uses the plural summary for multiple files", () => {
    write("a.ahk", DIRTY);
    write("b.ahk", DIRTY);
    const r = runCli(["a.ahk", "b.ahk"], dir);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toEqual(["[warn] a.ahk", "[warn] b.ahk", warnSummary("files")]);
  });

  it("reports lint findings on stdout after the header", () => {
    write("dirty.ahk", DIRTY);
    write("lint.ahk", LINT_PROBLEM);
    const r = runCli(["dirty.ahk", "lint.ahk"], dir);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toHaveLength(2);
    expect(r.stdout[0]).toBe("Checking formatting...");
    expect(r.stdout[1]!.startsWith("lint.ahk:1:1 no-legacy-assign ")).toBe(true);
    expect(r.stderr).toEqual(["[warn] dirty.ahk", warnSummary("file")]);
  });

  it("uses the current directory when no path is given", () => {
    write("sub/nested.ahk", DIRTY);
    const r = runCli([], dir);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toEqual(["Checking formatting..."]);
    expect(r.stderr).toEqual(["[warn] " + join("sub", "nested.ahk"), warnSummary("file")]);
  });
});

describe("cli: write mode", () => {
  it("rewrites files and lists every processed file with a duration", () => {
    write("dirty.ahk", DIRTY);
    write("clean.ahk", CLEAN);
    const r = runCli(["--write", "dirty.ahk", "clean.ahk"], dir);
    expect(r.exitCode).toBe(0);
    expect(r.stderr).toEqual([]);
    expect(r.stdout).toHaveLength(2);
    expect(r.stdout[0]).toMatch(/^dirty\.ahk \d+ms$/);
    expect(r.stdout[1]).toMatch(/^clean\.ahk \d+ms \(unchanged\)$/);
    expect(readFileSync(join(dir, "dirty.ahk"), "utf8")).toBe("x := 1\n");
  });

  it("is idempotent", () => {
    write("dirty.ahk", DIRTY);
    expect(runCli(["--write", "dirty.ahk"], dir).stdout[0]).toMatch(/^dirty\.ahk \d+ms$/);
    const r = runCli(["--write", "dirty.ahk"], dir);
    expect(r.stdout).toHaveLength(1);
    expect(r.stdout[0]).toMatch(/^dirty\.ahk \d+ms \(unchanged\)$/);
  });

  it("accepts -w as an alias", () => {
    write("dirty.ahk", DIRTY);
    const r = runCli(["-w", "dirty.ahk"], dir);
    expect(r.exitCode).toBe(0);
    expect(r.stdout[0]).toMatch(/^dirty\.ahk \d+ms$/);
    expect(readFileSync(join(dir, "dirty.ahk"), "utf8")).toBe("x := 1\n");
  });

  it("does not write untokenizable files and exits 2", () => {
    write("bad.ahk", 's := "unterminated\n');
    const r = runCli(["--write", "bad.ahk"], dir);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toEqual(["[error] bad.ahk: unterminated string literal"]);
    expect(r.stdout).toEqual([]);
    expect(readFileSync(join(dir, "bad.ahk"), "utf8")).toBe('s := "unterminated\n');
  });
});

describe("cli: diff mode", () => {
  it("prints a unified diff without writing and exits 1", () => {
    write("dirty.ahk", DIRTY);
    const r = runCli(["--diff", "dirty.ahk"], dir);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toEqual([]);
    expect(r.stdout).toEqual(["--- dirty.ahk", "+++ dirty.ahk", "@@ -1 +1 @@", "-x:=1", "+x := 1"]);
    expect(readFileSync(join(dir, "dirty.ahk"), "utf8")).toBe(DIRTY);
  });

  it("exits 0 without output for clean files", () => {
    write("clean.ahk", CLEAN);
    const r = runCli(["--diff", "clean.ahk"], dir);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toEqual([]);
  });

  it("shows line-ending-only and final-newline changes", () => {
    write("crlf.ahk", CLEAN.replaceAll("\n", "\r\n"));
    write("noeol.ahk", "x := 1");
    const crlf = runCli(["--diff", "crlf.ahk"], dir);
    expect(crlf.exitCode).toBe(1);
    expect(crlf.stdout.join("\n")).toContain("-" + CLEAN.trimEnd().split("\n")[0] + "\r");
    const noeol = runCli(["--diff", "noeol.ahk"], dir);
    expect(noeol.exitCode).toBe(1);
    expect(noeol.stdout).toEqual([
      "--- noeol.ahk",
      "+++ noeol.ahk",
      "@@ -1 +1 @@",
      "-x := 1",
      "\\ No newline at end of file",
      "+x := 1",
    ]);
  });

  it("rejects untokenizable files and exits 2", () => {
    write("bad.ahk", 's := "unterminated\n');
    const r = runCli(["--diff", "bad.ahk"], dir);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toEqual(["[error] bad.ahk: unterminated string literal"]);
    expect(r.stdout).toEqual([]);
  });
});

describe("cli: lint mode", () => {
  it("reports findings and exits 1", () => {
    write("lint.ahk", LINT_PROBLEM);
    const r = runCli(["--lint", "lint.ahk"], dir);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toHaveLength(1);
    expect(r.stdout[0]!.startsWith("lint.ahk:1:1 no-legacy-assign ")).toBe(true);
  });

  it("exits 0 when there are no findings", () => {
    write("clean.ahk", CLEAN);
    const r = runCli(["--lint", "clean.ahk"], dir);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toEqual([]);
  });

  it("continues on files with tokenize errors", () => {
    write("bad.ahk", 's := "unterminated\nx = 1\n');
    const r = runCli(["--lint", "bad.ahk"], dir);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toHaveLength(1);
    expect(r.stderr).toEqual([]);
  });
});

describe("cli: option handling", () => {
  it("rejects mutually exclusive modes and exits 2", () => {
    const r = runCli(["--write", "--lint", "x.ahk"], dir);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toEqual(["[error] options --write, --diff and --lint are mutually exclusive"]);
  });

  it("accepts repeated identical flags", () => {
    write("clean.ahk", CLEAN);
    expect(runCli(["--write", "-w", "clean.ahk"], dir).exitCode).toBe(0);
  });
});

describe("cli: path expansion", () => {
  it("walks directories recursively", () => {
    write("a/x.ahk", DIRTY);
    write("b/y.ahk", CLEAN);
    const r = runCli(["."], dir);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toEqual(["Checking formatting..."]);
    expect(r.stderr).toEqual(["[warn] " + join("a", "x.ahk"), warnSummary("file")]);
  });

  it("expands glob patterns", () => {
    write("a/keep.txt", DIRTY);
    write("a/one.ahk", DIRTY);
    write("a/two.ahk", CLEAN);
    const r = runCli(["a/*.ahk"], dir);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toEqual(["[warn] a/one.ahk", warnSummary("file")]);
  });
});

describe("cli: errors", () => {
  it("reports nonexistent paths on stderr and exits 2", () => {
    const r = runCli(["missing.ahk"], dir);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toEqual(["[error] missing.ahk: no such file or directory"]);
  });

  it("still processes valid files alongside invalid ones", () => {
    write("dirty.ahk", DIRTY);
    const r = runCli(["missing.ahk", "dirty.ahk"], dir);
    expect(r.exitCode).toBe(2);
    expect(r.stdout).toEqual(["Checking formatting..."]);
    expect(r.stderr).toEqual([
      "[error] missing.ahk: no such file or directory",
      "[warn] dirty.ahk",
      warnSummary("file"),
    ]);
  });

  it("rejects non-UTF-8 files", () => {
    writeFileSync(join(dir, "sjis.ahk"), Buffer.from([0x93, 0xfa, 0x96, 0x7b]), "binary");
    const r = runCli(["sjis.ahk"], dir);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toEqual(["[error] sjis.ahk: file is not valid UTF-8"]);
  });
});

describe("cli: help", () => {
  it.each([
    [["--help"]],
    [["-h"]],
    [["--write", "--help"]],
    [["--diff", "-h"]],
    [["--lint", "--help"]],
  ])("prints usage and exits 0 for %j without touching paths", (args) => {
    const r = runCli(args, dir);
    expect(r.exitCode).toBe(0);
    expect(r.stderr).toEqual([]);
    expect(r.stdout).toContain("Usage:");
    expect(r.stdout.join("\n")).toContain("ahkcheck --write [path ...]");
  });

  it("ignores invalid paths when help is requested", () => {
    const r = runCli(["--help", "missing.ahk"], dir);
    expect(r.exitCode).toBe(0);
    expect(r.stderr).toEqual([]);
  });
});

describe("cli: BOM and line endings", () => {
  it("preserves UTF-8 BOM while normalizing CRLF through --write", () => {
    const bom = "\uFEFF";
    const before = bom + "x:=1\r\ny := 2\r\n";
    write("crlf.ahk", before);
    const r = runCli(["--write", "crlf.ahk"], dir);
    expect(r.exitCode).toBe(0);
    const after = readFileSync(join(dir, "crlf.ahk"), "utf8");
    expect(after).toBe(bom + "x := 1\ny := 2\n");
  });

  it("preserves LF-only files without adding a BOM", () => {
    write("lf.ahk", DIRTY);
    runCli(["--write", "lf.ahk"], dir);
    const bytes = readFileSync(join(dir, "lf.ahk"));
    expect(bytes[0]).toBe(0x78); // "x"
    expect(readFileSync(join(dir, "lf.ahk"), "utf8")).toBe("x := 1\n");
  });

  it("adds the missing final newline", () => {
    write("noeol.ahk", "x := 1");
    runCli(["--write", "noeol.ahk"], dir);
    expect(readFileSync(join(dir, "noeol.ahk"), "utf8")).toBe("x := 1\n");
  });
});

const BIN = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const FOLDER = fileURLToPath(new URL("../", import.meta.url));

function invokeCli(entry: "bin" | "folder", args: string[]) {
  const result =
    entry === "bin"
      ? spawnSync(BIN, args, { cwd: dir, encoding: "utf8" })
      : spawnSync("bun", [FOLDER, ...args], { cwd: dir, encoding: "utf8" });
  expect(result.error).toBeUndefined();
  return { exit: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("cli: matching invocation entries", () => {
  it.each([[[]], [["--write"]], [["--lint"]], [["--diff"]]])(
    "matches bin and folder output and writes in the same cwd for %j",
    (mode) => {
      for (const source of [CLEAN, DIRTY, LINT_PROBLEM, 's := "unterminated\n']) {
        const path = write("a.ahk", source);
        const binary = invokeCli("bin", mode);
        const binaryBytes = readFileSync(path);
        write("a.ahk", source);
        expect(withoutDurations(invokeCli("folder", mode))).toEqual(withoutDurations(binary));
        expect(readFileSync(path)).toEqual(binaryBytes);
      }
      write("a.ahk", DIRTY);
      const args = [...mode, "missing.ahk", "a.ahk"];
      const binary = invokeCli("bin", args);
      const binaryBytes = readFileSync(join(dir, "a.ahk"));
      expect(binary.exit).toBe(2);
      write("a.ahk", DIRTY);
      expect(withoutDurations(invokeCli("folder", args))).toEqual(withoutDurations(binary));
      expect(readFileSync(join(dir, "a.ahk"))).toEqual(binaryBytes);
    },
  );

  it("matches bin and folder help output", () => {
    const binary = invokeCli("bin", ["--help"]);
    expect(binary.exit).toBe(0);
    expect(binary.stdout).toContain("Usage:");
    expect(invokeCli("folder", ["--help"])).toEqual(binary);
  });
});

describe.each(["bin", "folder"] as const)("cli: executable %s contract", (entry) => {
  const cliProcess = (args: string[]) => invokeCli(entry, args);
  it("warns on stderr, lints on stdout and does not write", () => {
    write("dirty.ahk", DIRTY);
    write("lint.ahk", LINT_PROBLEM);
    const result = cliProcess(["dirty.ahk", "lint.ahk"]);
    expect(result.exit).toBe(1);
    expect(result.stdout.split("\n")).toEqual([
      "Checking formatting...",
      'lint.ahk:1:1 no-legacy-assign legacy assignment removed in v2; use ":=" such as "x := 1"',
      "",
    ]);
    expect(result.stderr.split("\n")).toEqual(["[warn] dirty.ahk", warnSummary("file"), ""]);
    expect(readFileSync(join(dir, "dirty.ahk"), "utf8")).toBe(DIRTY);
    expect(readFileSync(join(dir, "lint.ahk"), "utf8")).toBe(LINT_PROBLEM);
  });

  it("lists processed files with durations and unchanged markers", () => {
    write("a.ahk", DIRTY);
    write("b.ahk", DIRTY);
    write("empty.ahk", "");
    let result = cliProcess(["--write", "a.ahk"]);
    expect(result.exit).toBe(0);
    expect(result.stdout).toMatch(/^a\.ahk \d+ms\n$/);
    expect(result.stderr).toBe("");
    result = cliProcess(["--write", "a.ahk"]);
    expect(result.stdout).toMatch(/^a\.ahk \d+ms \(unchanged\)\n$/);
    write("a.ahk", DIRTY);
    result = cliProcess(["--write"]);
    expect(result.exit).toBe(0);
    const lines = result.stdout.trimEnd().split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^a\.ahk \d+ms$/);
    expect(lines[1]).toMatch(/^b\.ahk \d+ms$/);
    expect(lines[2]).toMatch(/^empty\.ahk \d+ms \(unchanged\)$/);
    expect(readFileSync(join(dir, "empty.ahk"), "utf8")).toBe("");
  });

  it("lints with status 0 or 1 and does not rewrite", () => {
    write("clean.ahk", CLEAN);
    write("lint.ahk", LINT_PROBLEM);
    expect(cliProcess(["--lint", "clean.ahk"])).toEqual({ exit: 0, stdout: "", stderr: "" });
    const result = cliProcess(["--lint", "lint.ahk"]);
    expect(result.exit).toBe(1);
    expect(result.stdout).toMatch(/^lint\.ahk:1:1 no-legacy-assign .*\n$/);
    expect(result.stderr).toBe("");
    expect(readFileSync(join(dir, "lint.ahk"), "utf8")).toBe(LINT_PROBLEM);
  });

  it("uses cwd recursively and excludes .git", () => {
    write("nested/clean.ahk", CLEAN);
    write(".git/ignored.ahk", LINT_PROBLEM);
    expect(cliProcess([])).toEqual({ exit: 0, stdout: CHECK_OK.join("\n") + "\n", stderr: "" });
  });

  it.each(["missing.ahk", "empty", "none*.ahk"])(
    "reports %s as a one-line processing error",
    (target) => {
      mkdirSync(join(dir, "empty"));
      const result = cliProcess([target]);
      expect(result.exit).toBe(2);
      expect(result.stdout).toBe("Checking formatting...\n");
      expect(result.stderr.trimEnd().split("\n")).toHaveLength(1);
      expect(result.stderr).toContain(`[error] ${target}`);
    },
  );

  it.each([[[]], [["--write"]], [["--lint"]]])(
    "continues after unreadable files in mode %j",
    (mode) => {
      const path = write("unreadable.ahk", DIRTY);
      write("good.ahk", mode[0] === "--lint" ? LINT_PROBLEM : DIRTY);
      chmodSync(path, 0o000);
      const result = cliProcess([...mode, "unreadable.ahk", "good.ahk"]);
      chmodSync(path, 0o600);
      expect(result.exit).toBe(2);
      const errLines = result.stderr.trimEnd().split("\n");
      expect(errLines[0]).toMatch(/^\[error\] unreadable\.ahk: .*EACCES/);
      if (mode[0] === "--write") {
        expect(errLines).toHaveLength(1);
        expect(result.stdout).toMatch(/^good\.ahk \d+ms\n$/);
        expect(readFileSync(join(dir, "good.ahk"), "utf8")).toBe("x := 1\n");
      } else if (mode[0] === "--lint") {
        expect(errLines).toHaveLength(1);
        expect(result.stdout).toContain("good.ahk:1:1 no-legacy-assign");
      } else {
        expect(errLines).toHaveLength(3);
        expect(errLines).toContain("[warn] good.ahk");
        expect(result.stdout).toBe("Checking formatting...\n");
      }
      expect(readFileSync(path, "utf8")).toBe(DIRTY);
    },
  );

  it("continues formatting later files after a real write error", () => {
    const path = write("readonly.ahk", DIRTY);
    write("later.ahk", DIRTY);
    chmodSync(path, 0o444);
    const result = cliProcess(["--write", "readonly.ahk", "later.ahk"]);
    expect(result.exit).toBe(2);
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1);
    expect(result.stderr).toMatch(/^\[error\] readonly\.ahk: .*EACCES/);
    expect(result.stdout).toMatch(/^later\.ahk \d+ms\n$/);
    expect(readFileSync(path, "utf8")).toBe(DIRTY);
    expect(readFileSync(join(dir, "later.ahk"), "utf8")).toBe("x := 1\n");
  });

  it.each([[[]], [["--write"]], [["--lint"]]])(
    "continues past invalid UTF-8 in mode %j",
    (mode) => {
      writeFileSync(join(dir, "bad.ahk"), Buffer.from([0xff]));
      write("good.ahk", DIRTY);
      const result = cliProcess([...mode, "bad.ahk", "good.ahk"]);
      expect(result.exit).toBe(2);
      if (mode[0] === "--write") {
        expect(result.stderr).toBe("[error] bad.ahk: file is not valid UTF-8\n");
        expect(result.stdout).toMatch(/^good\.ahk \d+ms\n$/);
      } else if (mode[0] === "--lint") {
        expect(result.stderr).toBe("[error] bad.ahk: file is not valid UTF-8\n");
        expect(result.stdout).toBe("");
      } else {
        expect(result.stderr).toContain("[error] bad.ahk: file is not valid UTF-8");
        expect(result.stdout).toBe("Checking formatting...\n");
        expect(result.stderr).toContain("[warn] good.ahk");
      }
      expect(readFileSync(join(dir, "bad.ahk"))).toEqual(Buffer.from([0xff]));
    },
  );

  it.each(["blocked", "blocked/*.ahk"])(
    "reports unreadable %s and continues other files",
    (target) => {
      const blocked = join(dir, "blocked");
      mkdirSync(blocked);
      write("blocked/hidden.ahk", DIRTY);
      write("good.ahk", DIRTY);
      chmodSync(blocked, 0o000);
      try {
        const result = cliProcess(["--write", target, "good.ahk"]);
        expect(result.exit).toBe(2);
        expect(result.stderr.trimEnd().split("\n")).toHaveLength(1);
        expect(result.stderr).toMatch(/^\[error\] blocked: .*EACCES/);
        expect(result.stdout).toMatch(/^good\.ahk \d+ms\n$/);
        expect(readFileSync(join(dir, "good.ahk"), "utf8")).toBe("x := 1\n");
      } finally {
        chmodSync(blocked, 0o700);
      }
    },
  );

  it.each(
    ["lf", "crlf", "mixed", "mixed-reverse"].flatMap((eol) =>
      [false, true].map((bom) => ({ eol, bom })),
    ),
  )("normalizes all endings and preserved regions for %j without lint writes", ({ eol, bom }) => {
    const preserved = [
      "; keep   \t",
      "/*  keep  ",
      "",
      "",
      "  literal :=  ( x ) \t",
      "*/  ",
      's := "',
      "(LTrim",
      "  literal  \t",
      "",
      "",
      "  more   ",
      ')"',
      "obj := { a :1+ 2, b: { c :3 } }",
      "::text:: literal   \t",
      "#Include  %A_ScriptDir%\\lib.ahk   ",
      'MsgBox    "ok"',
      "f (1)",
    ];
    const prefix = bom ? "\uFEFF" : "";
    const before =
      prefix +
      preserved
        .map(
          (line, index) =>
            line +
            (eol === "crlf" ||
            (eol === "mixed" && index % 2 === 0) ||
            (eol === "mixed-reverse" && index % 2 === 1)
              ? "\r\n"
              : "\n"),
        )
        .join("");
    const after = prefix + preserved.join("\n") + "\n";
    const changed = before !== after;
    write("endings.ahk", before);
    const warn = `[warn] endings.ahk\n${warnSummary("file")}\n`;
    expect(cliProcess(["endings.ahk"])).toEqual({
      exit: changed ? 1 : 0,
      stdout: changed ? "Checking formatting...\n" : CHECK_OK.join("\n") + "\n",
      stderr: changed ? warn : "",
    });
    expect(readFileSync(join(dir, "endings.ahk"), "utf8")).toBe(before);
    expect(cliProcess(["--lint", "endings.ahk"])).toEqual({ exit: 0, stdout: "", stderr: "" });
    expect(readFileSync(join(dir, "endings.ahk"), "utf8")).toBe(before);
    const written = cliProcess(["--write", "endings.ahk"]);
    expect(written.exit).toBe(0);
    expect(written.stderr).toBe("");
    expect(written.stdout).toMatch(
      changed ? /^endings\.ahk \d+ms\n$/ : /^endings\.ahk \d+ms \(unchanged\)\n$/,
    );
    expect(readFileSync(join(dir, "endings.ahk"), "utf8")).toBe(after);
    expect(cliProcess(["endings.ahk"])).toEqual({
      exit: 0,
      stdout: CHECK_OK.join("\n") + "\n",
      stderr: "",
    });
    expect(cliProcess(["--write", "endings.ahk"]).stdout).toMatch(
      /^endings\.ahk \d+ms \(unchanged\)\n$/,
    );
  });

  it("counts line-ending-only changes alongside other changed files", () => {
    write("lf.ahk", CLEAN);
    write("crlf.ahk", CLEAN.replaceAll("\n", "\r\n"));
    write("mixed.ahk", "x := 1\r\ny := 2\n");
    expect(cliProcess(["crlf.ahk", "mixed.ahk", "lf.ahk"])).toEqual({
      exit: 1,
      stdout: "Checking formatting...\n",
      stderr: `[warn] crlf.ahk\n[warn] mixed.ahk\n${warnSummary("files")}\n`,
    });
    const result = cliProcess(["--write", "crlf.ahk", "mixed.ahk", "lf.ahk"]);
    expect(result.exit).toBe(0);
    const lines = result.stdout.trimEnd().split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^crlf\.ahk \d+ms$/);
    expect(lines[1]).toMatch(/^mixed\.ahk \d+ms$/);
    expect(lines[2]).toMatch(/^lf\.ahk \d+ms \(unchanged\)$/);
  });

  it("preserves BOM while normalizing CRLF through the actual executable", () => {
    write("bom.ahk", "\uFEFFx:=1\r\n");
    expect(cliProcess(["--write", "bom.ahk"]).exit).toBe(0);
    expect(readFileSync(join(dir, "bom.ahk"), "utf8")).toBe("\uFEFFx := 1\n");
  });

  it("retains real calls within defaults and definition bodies", () => {
    const source = "FileCopyDir(x := Asc(1)) => FileCopyDir(x)\n";
    write("calls.ahk", source);
    const result = cliProcess(["--lint", "calls.ahk"]);
    expect(result).toEqual({
      exit: 1,
      stdout:
        "calls.ahk:1:18 no-removed-builtin removed in v2; use Ord()\n" +
        "calls.ahk:1:29 no-renamed-builtin renamed in v2; use DirCopy()\n",
      stderr: "",
    });
    expect(readFileSync(join(dir, "calls.ahk"), "utf8")).toBe(source);
  });

  it("leaves non-call names and unspecified gaps clean through the executable", () => {
    const source = 'FileCopyDir := 1\nAsc := 1\nx := FileCopyDir\nMsgBox    "ok"\nf (1)\n';
    write("clean.ahk", source);
    expect(cliProcess(["clean.ahk"])).toEqual({
      exit: 0,
      stdout: CHECK_OK.join("\n") + "\n",
      stderr: "",
    });
    expect(cliProcess(["--lint", "clean.ahk"])).toEqual({ exit: 0, stdout: "", stderr: "" });
    const written = cliProcess(["--write", "clean.ahk"]);
    expect(written.exit).toBe(0);
    expect(written.stdout).toMatch(/^clean\.ahk \d+ms \(unchanged\)\n$/);
    expect(readFileSync(join(dir, "clean.ahk"), "utf8")).toBe(source);
  });

  it("leaves definition headers and inline action gaps clean through all modes", () => {
    const source = [
      "FileCopyDir(a, b) {",
      "    return a",
      "}",
      "class Tools {",
      "    Asc(c) {",
      "        return c",
      "    }",
      "    static FileCopyDir(a, b) => a",
      "}",
      'a::MsgBox("ok")',
      'b::    MsgBox("ok")',
      "#HotIf active",
      '    c::\tMsgBox("ok")',
      "#HotIf",
      'd::MsgBox("ok")',
      "",
    ].join("\n");
    write("clean.ahk", source);
    const defaultRun = cliProcess(["clean.ahk"]);
    expect(defaultRun).toEqual({
      exit: 0,
      stdout: CHECK_OK.join("\n") + "\n",
      stderr: "",
    });
    expect(cliProcess(["--lint", "clean.ahk"])).toEqual({ exit: 0, stdout: "", stderr: "" });
    const written = cliProcess(["--write", "clean.ahk"]);
    expect(written).toEqual({
      exit: 0,
      stdout: expect.stringMatching(/^clean\.ahk \d+ms \(unchanged\)\n$/),
      stderr: "",
    });
    expect(readFileSync(join(dir, "clean.ahk"), "utf8")).toBe(source);
  });

  it.each([[[]], [["--write"]]])("rejects lexical errors without writing in mode %j", (mode) => {
    const bad = 's := "unterminated\nx = 1\n';
    write("bad.ahk", bad);
    write("good.ahk", DIRTY);
    const result = cliProcess([...mode, "bad.ahk", "good.ahk"]);
    expect(result.exit).toBe(2);
    expect(result.stderr).toContain("[error] bad.ahk: unterminated string literal");
    if (mode[0] === "--write") {
      expect(result.stderr.trimEnd().split("\n")).toHaveLength(1);
      expect(result.stdout).toMatch(/^good\.ahk \d+ms\n$/);
      expect(readFileSync(join(dir, "good.ahk"), "utf8")).toBe("x := 1\n");
    } else {
      // Lint findings continue through the tokenizable range of bad.ahk.
      expect(result.stdout).toContain("Checking formatting...");
      expect(result.stdout).toContain("bad.ahk:2:1 no-legacy-assign");
      expect(result.stderr).toContain("[warn] good.ahk");
    }
    expect(readFileSync(join(dir, "bad.ahk"), "utf8")).toBe(bad);
  });

  it.each(["/*\nx:=1\n", "s :=\n(\nx:=1\n"])(
    "rejects an unclosed preserved section without writing",
    (bad) => {
      write("bad.ahk", bad);
      write("good.ahk", DIRTY);
      const result = cliProcess(["--write", "bad.ahk", "good.ahk"]);
      expect(result.exit).toBe(2);
      expect(result.stderr.trimEnd().split("\n")).toHaveLength(1);
      expect(result.stderr).toMatch(/^\[error\] bad\.ahk: /);
      expect(result.stdout).toMatch(/^good\.ahk \d+ms\n$/);
      expect(readFileSync(join(dir, "bad.ahk"), "utf8")).toBe(bad);
    },
  );

  it("does not treat lexical errors alone as a lint processing error", () => {
    write("bad.ahk", 's := "unterminated\n');
    expect(cliProcess(["--lint", "bad.ahk"])).toEqual({ exit: 0, stdout: "", stderr: "" });
    write("bad.ahk", 's := "unterminated\nx = 1\n');
    const result = cliProcess(["--lint", "bad.ahk"]);
    expect(result.exit).toBe(1);
    expect(result.stdout).toMatch(/^bad\.ahk:2:1 no-legacy-assign /);
    expect(result.stderr).toBe("");
  });
});
