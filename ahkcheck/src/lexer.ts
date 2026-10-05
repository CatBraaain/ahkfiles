/**
 * Lightweight per-line tokenizer for AutoHotkey v2 source.
 *
 * The lexer never spans lines except for block comments, whose state is
 * carried in LexState by the caller. Strings are terminated by the matching
 * quote, with backtick escapes and doubled quotes. Everything that is not an
 * identifier, number, string, comment or known operator/punctuation is kept
 * verbatim as a single-character op token.
 */

export type TokKind = "id" | "num" | "str" | "com" | "op" | "object";

export interface Tok {
  kind: TokKind;
  /** Verbatim source text of the token. */
  text: string;
  /** 1-based column of the first character. */
  col: number;
  /** Number of whitespace characters between the previous token (or line
   * start) and this token. */
  before: number;
}

export interface LexResult {
  toks: Tok[];
  /** Set when the line cannot be tokenized (e.g. unterminated string). */
  error?: string;
}

export interface LexState {
  /** True while inside an unterminated /* ... *\/ block comment. */
  blockComment: boolean;
}

const OPS4 = [">>>="];
const OPS3 = ["<<=", ">>>", ">>=", "//=", "!=="];
const OPS2 = [
  ":=",
  "+=",
  "-=",
  "*=",
  "/=",
  ".=",
  "|=",
  "&=",
  "^=",
  "~=",
  "&&",
  "||",
  "==",
  "!=",
  "<=",
  ">=",
  "<<",
  ">>",
  "++",
  "--",
  "**",
  "//",
  "=>",
  "??",
];
const OPS1 = [
  "=",
  "+",
  "-",
  "*",
  "/",
  "%",
  "<",
  ">",
  "!",
  "~",
  "&",
  "|",
  "^",
  "?",
  ":",
  ",",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "#",
];

const ID_START = /[\p{L}_]/u;
const ID_CONT = /[\p{L}\p{N}_]/u;
const NUM_RE = /^(0[xX][0-9A-Fa-f]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/;

function isWs(c: string): boolean {
  return c === " " || c === "\t";
}

export function lexLine(line: string, state: LexState): LexResult {
  const toks: Tok[] = [];
  let error: string | undefined;
  let i = 0;
  let gap = 0;
  const push = (kind: TokKind, text: string, col: number) => {
    toks.push({ kind, text, col, before: gap });
    gap = 0;
  };

  if (state.blockComment) {
    const end = line.indexOf("*/");
    if (end === -1) {
      push("com", line, 1);
      return { toks, error };
    }
    push("com", line.slice(0, end + 2), 1);
    i = end + 2;
    gap = 0;
    state.blockComment = false;
  }

  const len = line.length;
  while (i < len) {
    const c = line[i]!;
    if (isWs(c)) {
      i++;
      gap++;
      continue;
    }
    const col = i + 1;

    // ";" starts a comment only at line start or after whitespace.
    if (c === ";" && (i === 0 || isWs(line[i - 1]!))) {
      push("com", line.slice(i), col);
      break;
    }
    // "/*" starts a block comment under the same boundary rule.
    if (c === "/" && line[i + 1] === "*" && (i === 0 || isWs(line[i - 1]!))) {
      const end = line.indexOf("*/", i + 2);
      if (end === -1) {
        push("com", line.slice(i), col);
        state.blockComment = true;
        break;
      }
      push("com", line.slice(i, end + 2), col);
      i = end + 2;
      continue;
    }

    if (c === '"' || c === "'") {
      const q = c;
      let j = i + 1;
      let closed = false;
      while (j < len) {
        const d = line[j]!;
        if (d === "`") {
          j += 2;
          continue;
        }
        if (d === q) {
          if (line[j + 1] === q) {
            j += 2;
            continue;
          }
          j++;
          closed = true;
          break;
        }
        j++;
      }
      if (!closed) error = "unterminated string literal";
      push("str", line.slice(i, Math.min(j, len)), col);
      i = Math.min(j, len);
      continue;
    }

    // Backtick escape outside strings: consume two characters as one token.
    if (c === "`") {
      const take = i + 1 < len ? 2 : 1;
      push("op", line.slice(i, i + take), col);
      i += take;
      continue;
    }

    const rest = line.slice(i);
    const num = NUM_RE.exec(rest);
    if (num) {
      push("num", num[0]!, col);
      i += num[0]!.length;
      continue;
    }
    if (ID_START.test(c)) {
      let j = i + 1;
      while (j < len && ID_CONT.test(line[j]!)) j++;
      push("id", line.slice(i, j), col);
      i = j;
      continue;
    }

    const op4 = OPS4.find((o) => rest.startsWith(o));
    if (op4) {
      push("op", op4, col);
      i += 4;
      continue;
    }
    const op3 = OPS3.find((o) => rest.startsWith(o));
    if (op3) {
      push("op", op3, col);
      i += 3;
      continue;
    }
    const op2 = OPS2.find((o) => rest.startsWith(o));
    if (op2) {
      push("op", op2, col);
      i += 2;
      continue;
    }
    if (OPS1.includes(c)) {
      push("op", c, col);
      i++;
      continue;
    }
    // Unknown character: keep verbatim so offsets stay correct.
    push("op", c, col);
    i++;
  }
  return { toks, error };
}

export function splitHotDefinition(line: string):
  | {
      key: string;
      action: string;
      offset: number;
      hotstring: boolean;
      executable: boolean;
    }
  | undefined {
  const start = line.search(/\S/);
  if (start < 0) return undefined;
  const options = /^:([^:]*):/.exec(line.slice(start));
  const colon = options ? line.indexOf("::", start + options[0].length) : findHotkeyColon(line);
  if (colon < 0) return undefined;
  return {
    key: line.slice(start, colon + 2),
    action: line.slice(colon + 2),
    offset: colon + 2,
    hotstring: options !== null,
    executable: options === null || /x(?!0)/i.test(options[1]!),
  };
}

/**
 * Find the first "::" (hotkey / hotstring trigger separator) that appears at
 * the code level: outside strings and comments. A quote character with no
 * matching closing quote on the same line is treated as a literal key
 * character so that definitions like `'::` or `"::` are recognized.
 */
export function findHotkeyColon(line: string): number {
  const len = line.length;
  let i = 0;
  while (i < len) {
    const c = line[i]!;
    if (c === "`") {
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const close = line.indexOf(c, i + 1);
      if (close === -1) {
        // Unpaired quote: treat as literal and keep scanning.
        i++;
        continue;
      }
      i = close + 1;
      continue;
    }
    if (c === ";" && (i === 0 || isWs(line[i - 1]!))) break;
    if (c === "/" && line[i + 1] === "*" && (i === 0 || isWs(line[i - 1]!))) break;
    if (c === ":" && line[i + 1] === ":") return i;
    i++;
  }
  return -1;
}
