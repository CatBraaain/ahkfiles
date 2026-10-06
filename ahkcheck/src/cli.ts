#!/usr/bin/env bun
/**
 * ahkcheck — formatter / linter for AutoHotkey v2 scripts.
 *
 * Usage:
 *   ahkcheck [path ...]          check format need + lint findings (no writes)
 *   ahkcheck --write [path ...]  rewrite files with the formatting rules (-w)
 *   ahkcheck --diff [path ...]   print unified diffs of pending formatting
 *   ahkcheck --lint [path ...]   report lint findings only
 *   ahkcheck -h | --help         show this help
 *
 * <path> accepts files, directories (recursive *.ahk search) and globs.
 * Without arguments the current directory is used. Options may appear
 * anywhere; --write, --diff and --lint are mutually exclusive.
 */

import { performance } from "node:perf_hooks";
import { unifiedDiff, splitKeepEnds } from "./diff.ts";
import { joinLines, readAhkFile, splitLines, writeAhkFile, type AhkFile } from "./fileio.ts";
import { formatSource } from "./format.ts";
import { lintLines } from "./lint.ts";
import { expandPaths } from "./paths.ts";

export type Mode = "check" | "write" | "diff" | "lint";

export interface CliResult {
  exitCode: number;
  stdout: string[];
  stderr: string[];
}

const BOM = "\uFEFF";

const HELP = [
  "ahkcheck — formatter / linter for AutoHotkey v2 scripts",
  "",
  "Usage:",
  "  ahkcheck [path ...]          check format need + lint findings (no writes)",
  "  ahkcheck --write [path ...]  rewrite files with the formatting rules (-w)",
  "  ahkcheck --diff [path ...]   print unified diffs of pending formatting",
  "  ahkcheck --lint [path ...]   report lint findings only",
  "  ahkcheck -h | --help         show this help",
  "",
  "<path> accepts files, directories (recursive *.ahk search) and globs.",
  "Without arguments the current directory is used. Options may appear anywhere;",
  "--write, --diff and --lint are mutually exclusive.",
  "",
  "Exit codes:",
  "  0  success (check/lint/diff: no problems found)",
  "  1  check, lint or diff found problems",
  "  2  processing error (path, option conflict, UTF-8, read/write failure,",
  "     or lexical error in check/write/diff)",
].join("\n");

interface ParsedArgs {
  mode: Mode;
  paths: string[];
}

function parseArgs(argv: string[]): { parsed?: ParsedArgs; error?: string } {
  let mode: Mode | undefined;
  const paths: string[] = [];
  for (const arg of argv) {
    const flag: Mode | undefined =
      arg === "--write" || arg === "-w"
        ? "write"
        : arg === "--diff"
          ? "diff"
          : arg === "--lint"
            ? "lint"
            : undefined;
    if (flag !== undefined) {
      if (mode !== undefined && mode !== flag)
        return { error: "options --write, --diff and --lint are mutually exclusive" };
      mode = flag;
    } else {
      paths.push(arg);
    }
  }
  return { parsed: { mode: mode ?? "check", paths } };
}

function readSource(
  path: string,
  display: string,
  stderr: string[],
): { file?: AhkFile; failed: boolean } {
  try {
    return { file: readAhkFile(path), failed: false };
  } catch (e) {
    stderr.push(`[error] ${display}: ${(e as Error).message}`);
    return { failed: true };
  }
}

export function runCli(argv: string[], cwd: string): CliResult {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { exitCode: 0, stdout: HELP.split("\n"), stderr: [] };
  }

  const { parsed, error } = parseArgs(argv);
  if (error !== undefined) {
    return { exitCode: 2, stdout: [], stderr: [`[error] ${error}`] };
  }
  const mode = parsed!.mode;

  const { files, displays, errors } = expandPaths(parsed!.paths, cwd);
  const stdout: string[] = [];
  const stderr: string[] = errors.map((e) => `[error] ${e}`);
  let hadError = errors.length > 0;

  if (mode === "check") {
    stdout.push("Checking formatting...");
    const warnPaths: string[] = [];
    let findings = 0;
    for (let i = 0; i < files.length; i++) {
      const display = displays[i]!;
      const { file, failed } = readSource(files[i]!, display, stderr);
      if (failed) {
        hadError = true;
        continue;
      }
      const src = splitLines(file!.text);
      const fmt = formatSource(src);
      if (fmt.error !== undefined) {
        stderr.push(`[error] ${display}: ${fmt.error}`);
        hadError = true;
      } else if (joinLines(fmt.lines) !== file!.text) {
        warnPaths.push(display);
      }
      for (const f of lintLines(src)) {
        stdout.push(`${display}:${f.line}:${f.col} ${f.rule} ${f.message}`);
        findings++;
      }
    }
    if (warnPaths.length > 0) {
      for (const p of warnPaths) stderr.push(`[warn] ${p}`);
      stderr.push(
        `[warn] Code style issues found in the above ${warnPaths.length === 1 ? "file" : "files"}. Run ahkcheck with --write to fix.`,
      );
    } else if (findings === 0 && !hadError) {
      stdout.push("All matched files use ahkcheck code style!");
    }
    return {
      exitCode: hadError ? 2 : warnPaths.length + findings > 0 ? 1 : 0,
      stdout,
      stderr,
    };
  }

  if (mode === "write") {
    for (let i = 0; i < files.length; i++) {
      const display = displays[i]!;
      const { file, failed } = readSource(files[i]!, display, stderr);
      if (failed) {
        hadError = true;
        continue;
      }
      const started = performance.now();
      const src = splitLines(file!.text);
      const fmt = formatSource(src);
      if (fmt.error !== undefined) {
        stderr.push(`[error] ${display}: ${fmt.error}`);
        hadError = true;
        continue;
      }
      const text = joinLines(fmt.lines);
      const changed = text !== file!.text;
      if (changed) {
        try {
          writeAhkFile(files[i]!, (file!.bom ? BOM : "") + text);
        } catch (e) {
          stderr.push(`[error] ${display}: ${(e as Error).message}`);
          hadError = true;
          continue;
        }
      }
      const ms = Math.max(0, Math.round(performance.now() - started));
      stdout.push(`${display} ${ms}ms${changed ? "" : " (unchanged)"}`);
    }
    return { exitCode: hadError ? 2 : 0, stdout, stderr };
  }

  if (mode === "diff") {
    let differed = false;
    for (let i = 0; i < files.length; i++) {
      const display = displays[i]!;
      const { file, failed } = readSource(files[i]!, display, stderr);
      if (failed) {
        hadError = true;
        continue;
      }
      const src = splitLines(file!.text);
      const fmt = formatSource(src);
      if (fmt.error !== undefined) {
        stderr.push(`[error] ${display}: ${fmt.error}`);
        hadError = true;
        continue;
      }
      const text = joinLines(fmt.lines);
      if (text !== file!.text) {
        differed = true;
        stdout.push(...unifiedDiff(splitKeepEnds(file!.text), splitKeepEnds(text), display));
      }
    }
    return { exitCode: hadError ? 2 : differed ? 1 : 0, stdout, stderr };
  }

  let total = 0;
  for (let i = 0; i < files.length; i++) {
    const display = displays[i]!;
    const { file, failed } = readSource(files[i]!, display, stderr);
    if (failed) {
      hadError = true;
      continue;
    }
    const src = splitLines(file!.text);
    for (const f of lintLines(src)) {
      stdout.push(`${display}:${f.line}:${f.col} ${f.rule} ${f.message}`);
      total++;
    }
  }
  return { exitCode: hadError ? 2 : total > 0 ? 1 : 0, stdout, stderr };
}

const meta = import.meta as { main?: boolean };
if (meta.main) {
  const result = runCli(process.argv.slice(2), process.cwd());
  for (const line of result.stdout) console.log(line);
  for (const line of result.stderr) console.error(line);
  process.exit(result.exitCode);
}
