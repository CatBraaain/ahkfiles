/** Minimal unified diff over newline-preserving line arrays. No external
 * dependencies. */

export type DiffOp = { type: " " | "-" | "+"; text: string; aLine: number; bLine: number };

/** Split text into lines that keep their line endings, so that CRLF vs LF
 * and a missing final newline stay visible as differences. Every line ends
 * with "\n" except a final line without one. */
export function splitKeepEnds(text: string): string[] {
  if (text === "") return [];
  const parts = text.split("\n");
  const trailing = parts.pop()!;
  const lines = parts.map((l) => l + "\n");
  if (trailing !== "") lines.push(trailing);
  return lines;
}

function diffOps(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  // lcs[i * (m + 1) + j] = LCS length of a[i..] vs b[j..]
  const width = m + 1;
  const lcs = new Int32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * width + j] =
        a[i] === b[j]
          ? lcs[(i + 1) * width + j + 1] + 1
          : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: " ", text: a[i]!, aLine: i + 1, bLine: j + 1 });
      i++;
      j++;
    } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) {
      ops.push({ type: "-", text: a[i]!, aLine: i + 1, bLine: j + 1 });
      i++;
    } else {
      ops.push({ type: "+", text: b[j]!, aLine: i + 1, bLine: j + 1 });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: "-", text: a[i]!, aLine: i + 1, bLine: j + 1 });
    i++;
  }
  while (j < m) {
    ops.push({ type: "+", text: b[j]!, aLine: i + 1, bLine: j + 1 });
    j++;
  }
  return ops;
}

const CONTEXT = 3;

function range(start: number, count: number): string {
  return count === 1 ? `${start}` : `${start},${count}`;
}

/** Unified diff of `a` (old) against `b` (new) with a two-line header using
 * `path`. Returns [] when the inputs are equal. Context groups follow the
 * usual 3-line convention and hunks carry git-style `@@` ranges. */
export function unifiedDiff(a: string[], b: string[], path: string): string[] {
  const ops = diffOps(a, b);
  const changed = ops.map((op) => op.type !== " ");
  const groups: [number, number][] = [];
  let k = 0;
  while (k < ops.length) {
    if (!changed[k]) {
      k++;
      continue;
    }
    const from = Math.max(0, k - CONTEXT);
    let end = k;
    let to = Math.min(ops.length - 1, k + CONTEXT);
    while (end + 1 < ops.length) {
      if (changed[end + 1]) {
        end++;
        to = Math.min(ops.length - 1, end + CONTEXT);
      } else if (end + 1 <= to) {
        end++;
      } else break;
    }
    const last = groups[groups.length - 1];
    if (last !== undefined && from <= last[1] + 1) last[1] = Math.max(last[1], to);
    else groups.push([from, to]);
    k = end + 1;
  }
  if (groups.length === 0) return [];
  const out: string[] = [`--- ${path}`, `+++ ${path}`];
  for (const [from, to] of groups) {
    const slice = ops.slice(from, to + 1);
    const aCount = slice.filter((op) => op.type !== "+").length;
    const bCount = slice.filter((op) => op.type !== "-").length;
    const aFirst = slice.find((op) => op.type !== "+");
    const bFirst = slice.find((op) => op.type !== "-");
    // Pure insertions/deletions anchor at the previous line position.
    const aStart = aFirst ? aFirst.aLine : slice[0]!.aLine - 1;
    const bStart = bFirst ? bFirst.bLine : slice[0]!.bLine - 1;
    out.push(`@@ -${range(aStart, aCount)} +${range(bStart, bCount)} @@`);
    for (const op of slice) {
      // Keep a CR so CRLF-vs-LF differences stay visible in the output.
      out.push(`${op.type}${op.text.replace(/\n$/, "")}`);
      if (!op.text.endsWith("\n")) out.push("\\ No newline at end of file");
    }
  }
  return out;
}
