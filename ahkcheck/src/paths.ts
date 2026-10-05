/**
 * Expansion of command line path arguments: files, directories (recursive
 * *.ahk search) and glob patterns (*, **, ?). No external dependencies.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export interface ExpandResult {
  files: string[];
  /** Display path for each file, parallel to `files`. */
  displays: string[];
  errors: string[];
}

const GLOB_CHARS = /[*?]/;

function toPosix(p: string): string {
  return sep === "/" ? p : p.split(sep).join("/");
}

/** Convert a glob pattern with `**`, `*`, `?` into a RegExp over posix-style
 * relative paths. */
export function globToRegExp(pattern: string): RegExp {
  let re = "";
  let i = 0;
  while (i < pattern.length) {
    const c = pattern[i]!;
    if (c === "*") {
      if (pattern[i + 1] === "*") {
        // "**/" matches zero or more path segments; "**" matches anything.
        if (pattern[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 3;
        } else {
          re += ".*";
          i += 2;
        }
      } else {
        re += "[^/]*";
        i++;
      }
    } else if (c === "?") {
      re += "[^/]";
      i++;
    } else {
      re += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      i++;
    }
  }
  return new RegExp(`^${re}$`);
}

function walkDir(dir: string, out: string[], errors: string[], cwd: string): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    errors.push(`${relative(cwd, dir)}: ${(e as Error).message}`);
    return;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    if (e.name === ".git") continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      walkDir(full, out, errors, cwd);
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".ahk")) {
      out.push(full);
    }
  }
}

export function expandPaths(args: string[], cwd: string): ExpandResult {
  const files: string[] = [];
  const displays: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  const add = (file: string) => {
    const abs = resolve(cwd, file);
    if (seen.has(abs)) return;
    seen.add(abs);
    files.push(abs);
    displays.push(relative(cwd, abs));
  };

  const targets = args.length > 0 ? args : ["."];

  for (const arg of targets) {
    if (GLOB_CHARS.test(arg)) {
      // Split into the deepest directory prefix without glob characters.
      const parts = toPosix(arg).split("/");
      let dirIdx = parts.findIndex((p) => GLOB_CHARS.test(p));
      if (dirIdx === -1) dirIdx = parts.length;
      const prefixParts = parts.slice(0, dirIdx);
      const patternParts = parts.slice(dirIdx);
      const base = resolve(cwd, prefixParts.join("/"));
      const re = globToRegExp(patternParts.join("/"));
      let matches = 0;
      const previousErrors = errors.length;
      let stack: { dir: string; rel: string }[] = [{ dir: base, rel: "" }];
      while (stack.length > 0) {
        const { dir, rel } = stack.pop()!;
        let entries;
        try {
          entries = readdirSync(dir, { withFileTypes: true });
        } catch (e) {
          errors.push(`${relative(cwd, dir)}: ${(e as Error).message}`);
          continue;
        }
        for (const e of entries) {
          if (e.name === ".git") continue;
          const childRel = rel === "" ? e.name : `${rel}/${e.name}`;
          const childPath = join(dir, e.name);
          if (e.isDirectory()) {
            stack.push({ dir: childPath, rel: childRel });
          } else if (e.isFile() && re.test(childRel) && e.name.toLowerCase().endsWith(".ahk")) {
            matches++;
            add(childPath);
          }
        }
      }
      if (matches === 0 && errors.length === previousErrors)
        errors.push(`${arg}: no matching .ahk files`);
      continue;
    }

    const abs = resolve(cwd, arg);
    let st;
    try {
      st = statSync(abs);
    } catch {
      errors.push(`${arg}: no such file or directory`);
      continue;
    }
    if (st.isFile()) {
      add(abs);
    } else if (st.isDirectory()) {
      const out: string[] = [];
      const previousErrors = errors.length;
      walkDir(abs, out, errors, cwd);
      if (out.length === 0 && errors.length === previousErrors)
        errors.push(`${arg}: no .ahk files found`);
      for (const f of out) add(f);
    } else {
      errors.push(`${arg}: not a regular file`);
    }
  }

  return { files, displays, errors };
}
