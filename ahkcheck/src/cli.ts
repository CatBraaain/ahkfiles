#!/usr/bin/env bun
/**
 * ahkcheck — formatter / linter for AutoHotkey v2 scripts.
 *
 * Usage:
 *   ahkcheck [path ...]     check format need + lint findings (no writes)
 *   ahkcheck fmt [path ...] rewrite files with the formatting rules
 *   ahkcheck lint [path ...] report lint findings only
 *
 * <path> accepts files, directories (recursive *.ahk search) and globs.
 * Without arguments the current directory is used.
 */

import { joinLines, readAhkFile, splitLines, writeAhkFile, type AhkFile } from "./fileio.ts";
import { formatSource } from "./format.ts";
import { lintLines } from "./lint.ts";
import { expandPaths } from "./paths.ts";

export type Mode = "check" | "fmt" | "lint";

export interface CliResult {
  exitCode: number;
  stdout: string[];
  stderr: string[];
}

const BOM = "\uFEFF";

function readSource(
  path: string,
  display: string,
  stderr: string[],
): { file?: AhkFile; failed: boolean } {
  try {
    return { file: readAhkFile(path), failed: false };
  } catch (e) {
    stderr.push(`${display}: ${(e as Error).message}`);
    return { failed: true };
  }
}

export function runCli(argv: string[], cwd: string): CliResult {
  let mode: Mode = "check";
  let pathArgs = argv;
  if (argv.length > 0 && (argv[0] === "fmt" || argv[0] === "lint")) {
    mode = argv[0];
    pathArgs = argv.slice(1);
  }

  const { files, displays, errors } = expandPaths(pathArgs, cwd);
  const stdout: string[] = [];
  const stderr: string[] = [...errors];
  let hadError = errors.length > 0;

  if (mode === "check") {
    const changedPaths: string[] = [];
    const findings: string[] = [];
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
        stderr.push(`${display}: ${fmt.error}`);
        hadError = true;
      } else if (joinLines(fmt.lines) !== file!.text) {
        changedPaths.push(display);
      }
      for (const f of lintLines(src)) {
        findings.push(`${display}:${f.line}:${f.col} ${f.rule} ${f.message}`);
      }
    }
    stdout.push(...changedPaths, ...findings);
    return {
      exitCode: hadError ? 2 : changedPaths.length + findings.length > 0 ? 1 : 0,
      stdout,
      stderr,
    };
  }

  if (mode === "fmt") {
    let count = 0;
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
        stderr.push(`${display}: ${fmt.error}`);
        hadError = true;
        continue;
      }
      const text = joinLines(fmt.lines);
      if (text !== file!.text) {
        try {
          writeAhkFile(files[i]!, (file!.bom ? BOM : "") + text);
          count++;
        } catch (e) {
          stderr.push(`${display}: ${(e as Error).message}`);
          hadError = true;
        }
      }
    }
    stdout.push(`formatted ${count} files`);
    return { exitCode: hadError ? 2 : 0, stdout, stderr };
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
