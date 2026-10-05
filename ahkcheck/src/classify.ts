/**
 * Line classification for AutoHotkey v2 source: hotkey / hotstring
 * definitions, directives, labels, comments, continuation sections and
 * ordinary code lines.
 */

import { splitHotDefinition, lexLine, type LexState, type Tok } from "./lexer.ts";

export type LineKind =
  | "blank"
  | "comment"
  | "blockcomment"
  | "contsec"
  | "hotkey"
  | "directive"
  | "label"
  | "code";

export interface LineInfo {
  kind: LineKind;
  raw: string;
  toks?: Tok[];
  /** Per-line tokenize error (e.g. unterminated string). */
  error?: string;
  /** True for code lines that continue a previous expression (open
   * brackets, trailing operator, or leading continuation operator). */
  cont?: boolean;
  /** A leading operator continuing a completed operand, rather than unary syntax. */
  binaryStart?: boolean;
}

export interface ClassifyResult {
  infos: LineInfo[];
  /** File-level error that makes formatting impossible. */
  error?: string;
}

const DIRECTIVE_RE = /^#[\p{L}_][\p{L}\p{N}_]*/u;
const CONTSEC_END_RE = /^\s*\)/;

function trimmed(raw: string): string {
  return raw.trim();
}

/**
 * A line-initial unescaped "(" opens a continuation section unless a "(" or
 * ")" appears later on the same line at the code level (per the v2 docs the
 * line is then an expression such as `() => f()` or `(a + b)`, or a
 * reinterpretation like `((MyFunc(`). Continuation-section options such as
 * `Join|` may contain arbitrary characters, so only parentheses disqualify.
 */
function isContSecStart(t: string): boolean {
  if (!t.startsWith("(")) return false;
  for (let i = 1; i < t.length; i++) {
    const c = t[i]!;
    if (c === "`") {
      i++;
      continue;
    }
    if (c === "(" || c === ")") return false;
  }
  return true;
}

/** Line-initial tokens that merge the line with the line above: a comma or
 * any expression operator except ++ and -- (per the v2 docs' continuation
 * operator rule). */
const CONT_START_OPS = new Set([
  ",",
  "%",
  "!",
  "~",
  "~=",
  ":=",
  "+=",
  "-=",
  "*=",
  "/=",
  "//=",
  ".=",
  "|=",
  "&=",
  "^=",
  ">>=",
  "<<=",
  ">>>=",
  "+",
  "-",
  "*",
  "/",
  "//",
  "**",
  ".",
  "<<",
  ">>",
  ">>>",
  "&",
  "|",
  "^",
  "=",
  "==",
  "!=",
  "!==",
  "<",
  ">",
  "<=",
  ">=",
  "&&",
  "||",
  "??",
  "?",
  ":",
  "=>",
]);
/** Word operators that continue a line at the start or, in operator
 * position, at the end of a line. */
const CONTINUATION_WORD_OPS = new Set(["and", "or", "is", "not"]);

/** True when the first non-comment token is a comma, an expression operator
 * other than ++/--, or a word operator, meaning the line continues the
 * previous expression. */
function startsWithContOp(toks: Tok[]): boolean {
  const first = toks.find((t) => t.kind !== "com");
  if (!first) return false;
  return (
    (first.kind === "op" && CONT_START_OPS.has(first.text)) ||
    (first.kind === "id" && CONTINUATION_WORD_OPS.has(first.text.toLowerCase()))
  );
}

/** A trailing word operator continues the line below in operator
 * position: after a completed operand for binary words (`x := a and`),
 * or after any operator for the prefix word `not` (`x := not`). Member
 * names (`obj.and`, `obj.not`) and parameters (`f(and`) do not. */
function endsWithWordOp(code: Tok[]): boolean {
  const last = code.at(-1)!;
  if (last.kind !== "id" || !CONTINUATION_WORD_OPS.has(last.text.toLowerCase())) return false;
  const prev = code.at(-2);
  if (prev === undefined || prev.kind !== "op" || [")", "]", "}", "++", "--"].includes(prev.text)) {
    return true;
  }
  // `not` is a prefix operator: after another operator it still awaits its
  // operand on the line below.
  return last.text.toLowerCase() === "not" && prev.text !== ".";
}

function endsWithContOp(toks: Tok[]): boolean {
  const code = toks.filter((t) => t.kind !== "com");
  const last = code.at(-1);
  if (!last) return false;
  if (last.kind === "id") return endsWithWordOp(code);
  if (last.kind !== "op") return false;
  if ([")", "]", "}", "++", "--"].includes(last.text)) {
    // ++/-- postfix still ends the expression.
    return false;
  }
  if (last.text === "{") {
    // Per the v2 docs, a trailing brace is OTB (a block opening, which does
    // not continue the expression) unless the previous code token is an
    // operator, as in `x := {`, where it starts an object literal.
    const prev = code[code.length - 2];
    return prev !== undefined && prev.kind === "op" && ![")", "]", "}"].includes(prev.text);
  }
  return true;
}

function countParens(toks: Tok[]): number {
  let n = 0;
  for (const t of toks) {
    if (t.text === "(" || t.text === "[") n++;
    else if (t.text === ")" || t.text === "]") n--;
  }
  return n;
}

export function classifyLines(lines: string[]): ClassifyResult {
  const infos: LineInfo[] = [];
  const lexState: LexState = { blockComment: false };
  let error: string | undefined;
  let parenDepth = 0;
  let contPrev = false;
  let contsecEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    // Lines of an open continuation section (including its closing ")"
    // line, which may carry trailing code such as `)"`) pass through as-is.
    if (contsecEnd >= 0) {
      if (i <= contsecEnd) {
        infos.push({ kind: "contsec", raw });
        continue;
      }
      contsecEnd = -1;
    }

    if (lexState.blockComment) {
      infos.push({ kind: "blockcomment", raw });
      if (raw.includes("*/")) lexState.blockComment = false;
      continue;
    }

    if (trimmed(raw) === "") {
      infos.push({ kind: "blank", raw });
      continue;
    }

    const definition = splitHotDefinition(raw);
    if (definition) {
      const action = definition.executable ? lexLine(definition.action, lexState) : { toks: [] };
      for (const tok of action.toks) tok.col += definition.offset;
      infos.push({ kind: "hotkey", raw, toks: action.toks, error: action.error });
      parenDepth = Math.max(0, parenDepth + countParens(action.toks));
      contPrev = endsWithContOp(action.toks);
      continue;
    }

    const { toks, error: lexError } = lexLine(raw, lexState);
    const firstTok = toks.find((t) => t.kind !== "com");

    if (!firstTok) {
      infos.push({
        kind: lexState.blockComment || trimmed(raw).startsWith("/*") ? "blockcomment" : "comment",
        raw,
        toks,
      });
      continue;
    }

    if (firstTok.kind === "com") {
      infos.push({ kind: "comment", raw, toks, error: lexError });
      continue;
    }

    // Directive: line-initial "#Name" (hotkeys like `#n::` were handled above).
    if (DIRECTIVE_RE.test(trimmed(raw))) {
      infos.push({ kind: "directive", raw, toks, error: lexError });
      contPrev = false;
      continue;
    }

    // Label: identifier + ":" ending the line (trailing comment allowed).
    const codeOnly = toks.filter((t) => t.kind !== "com");
    if (codeOnly.length === 2 && codeOnly[0]!.kind === "id" && codeOnly[1]!.text === ":") {
      infos.push({ kind: "label", raw, toks, error: lexError });
      contPrev = false;
      continue;
    }

    // Continuation section start (outside bracket continuations; per the
    // v2 docs a leading "(" starts a section even after a trailing operator,
    // as in `Var :=` + `(` sections).
    const t = trimmed(raw);
    const isExprCont = parenDepth > 0 || contPrev || startsWithContOp(toks);
    if (parenDepth === 0 && isContSecStart(t)) {
      let end = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (CONTSEC_END_RE.test(lines[j]!)) {
          end = j;
          break;
        }
      }
      if (end === -1) {
        if (!error) error = `line ${i + 1}: unterminated continuation section`;
        infos.push({ kind: "code", raw, toks, error: lexError, cont: isExprCont });
      } else {
        infos.push({ kind: "contsec", raw });
        contsecEnd = end;
      }
      continue;
    }

    infos.push({
      kind: "code",
      raw,
      toks,
      error: lexError,
      cont: isExprCont,
      binaryStart: startsWithContOp(toks) && !contPrev,
    });
    parenDepth = Math.max(0, parenDepth + countParens(toks));
    contPrev = endsWithContOp(toks);
  }

  if (lexState.blockComment && !error) {
    error = "unterminated block comment";
  }
  // A line ending inside an open string literal directly above a
  // continuation section is the string form of the section (quotes inside
  // the section are auto-escaped), not an unterminated string. Comment lines
  // between them are allowed (comments may sit on the section's top line).
  for (let i = 0; i < infos.length; i++) {
    const info = infos[i]!;
    if (info.kind !== "code" || info.error !== "unterminated string literal") continue;
    for (let j = i + 1; j < infos.length; j++) {
      const next = infos[j]!;
      if (next.kind === "contsec") {
        info.error = undefined;
        break;
      }
      if (next.kind !== "comment" && next.kind !== "blank") break;
    }
  }
  return { infos, error };
}
