/**
 * Formatter for AutoHotkey v2 source.
 *
 * Applies the ahkcheck formatting rules: 4-space indentation by block depth,
 * One True Brace style, single spaces around binary operators and after
 * commas, no extra spaces just inside parentheses/brackets, blank line
 * compression, trailing whitespace removal and a single final newline.
 * Strings, comments, continuation sections, hotstring definition lines,
 * hotkey key parts and directive values are preserved.
 */

import { splitHotDefinition, lexLine, type Tok } from "./lexer.ts";
import { classifyLines, type LineInfo } from "./classify.ts";

export interface FormatResult {
  lines: string[];
  error?: string;
}

const INDENT = "    ";
const UNARY_ONLY = new Set(["!", "~"]);
// `&` also sits in BIN_OPS: analyzeTokens resolves it by position, so a
// prefix `&` (VarRef) attaches to its operand while an infix one keeps
// the binary one-space padding on both sides.
const MAYBE_PREFIX = new Set(["-", "+", "++", "--", "~", "&"]);
const KEYWORD_BEFORE_PAREN = new Set([
  "if",
  "else",
  "while",
  "for",
  "until",
  "switch",
  "case",
  "default",
  "return",
  "break",
  "continue",
  "try",
  "catch",
  "finally",
  "global",
  "local",
  "static",
  "class",
  "throw",
]);
// `in` and `contains` are reserved for future use in v2, not operators.
const WORD_BIN_OPS = new Set(["and", "or", "is"]);
const BIN_OPS = new Set([
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
  ">>>=",
  "<<=",
  "&&",
  "||",
  "==",
  "!=",
  "!==",
  "~=",
  "<=",
  ">=",
  "<<",
  ">>",
  ">>>",
  "**",
  "//",
  "??",
  "=",
  "<",
  ">",
  ".",
  "+",
  "-",
  "*",
  "/",
  "&",
  "|",
  "^",
]);

function codeToks(toks: Tok[] | undefined): Tok[] {
  return toks ? toks.filter((t) => t.kind !== "com") : [];
}

function hasComment(info: LineInfo): boolean {
  return !!info.toks?.some((t) => t.kind === "com");
}

function leadingWs(raw: string): number {
  const ws = /^[ \t]*/.exec(raw)![0];
  let n = 0;
  for (const c of ws) n += c === "\t" ? 4 : 1;
  return n;
}

function countLeadingCloses(toks: Tok[]): number {
  let n = 0;
  for (const t of toks) {
    if (t.kind === "op" && t.text === "}") n++;
    else break;
  }
  return n;
}

function netBraces(toks: Tok[]): number {
  let n = 0;
  for (const t of toks) {
    if (t.kind !== "op") continue;
    if (t.text === "{") n++;
    else if (t.text === "}") n--;
  }
  return n;
}

/** Move code before trailing comments; leave each comment on its source line. */
function moveOtbCode(prev: LineInfo, info: LineInfo): LineInfo | undefined {
  const code = codeToks(info.toks);
  let moved = info.raw;
  for (const tok of [...(info.toks ?? [])].reverse()) {
    if (tok.kind === "com")
      moved = moved.slice(0, tok.col - 1) + moved.slice(tok.col - 1 + tok.text.length);
  }
  const last = codeToks(prev.toks).at(-1);
  const end = last ? last.col - 1 + last.text.length : splitHotDefinition(prev.raw)!.offset;
  prev.raw = prev.raw.slice(0, end) + " " + moved.trim() + prev.raw.slice(end);
  const definition = prev.kind === "hotkey" ? splitHotDefinition(prev.raw) : undefined;
  prev.toks = lexLine(definition?.action ?? prev.raw, { blockComment: false }).toks;
  if (definition) for (const tok of prev.toks) tok.col += definition.offset;
  if (!hasComment(info)) return undefined;
  let comments = info.raw;
  for (const tok of [...code].reverse()) {
    comments = comments.slice(0, tok.col - 1) + comments.slice(tok.col - 1 + tok.text.length);
  }
  return { kind: "comment", raw: comments, toks: lexLine(comments, { blockComment: false }).toks };
}

/** Join block braces and else/catch/finally without merging comment tokens. */
function joinOtb(infos: LineInfo[]): LineInfo[] {
  const out: LineInfo[] = [];
  const objects: ObjectState = { depth: 0, parens: 0 };
  for (const info of infos) {
    const inObject = objects.depth > 0;
    if (info.kind === "code") protectObjects(info.toks ?? [], info.raw, objects, info.cont);
    if (
      info.kind === "blank" ||
      info.kind === "comment" ||
      info.kind === "blockcomment" ||
      info.kind === "contsec"
    ) {
      out.push(info);
      continue;
    }
    const first = codeToks(info.toks)[0];
    const prev = out.findLast((line) => !["blank", "comment", "blockcomment"].includes(line.kind));
    if (
      info.kind === "code" &&
      !inObject &&
      objects.depth === 0 &&
      first?.text === "{" &&
      codeToks(info.toks).length === 1 &&
      prev !== undefined &&
      (prev.kind === "code" ||
        (prev.kind === "hotkey" && !splitHotDefinition(prev.raw)?.hotstring)) &&
      !prev.cont
    ) {
      const comments = moveOtbCode(prev, info);
      if (comments) out.push(comments);
      continue;
    }
    if (
      info.kind === "code" &&
      !inObject &&
      objects.depth === 0 &&
      first?.kind === "id" &&
      ["else", "catch", "finally"].includes(first.text.toLowerCase()) &&
      prev !== undefined &&
      prev.kind === "code" &&
      !prev.cont &&
      codeToks(prev.toks).at(-1)?.text === "}"
    ) {
      const comments = moveOtbCode(prev, info);
      if (comments) out.push(comments);
      continue;
    }
    out.push(info);
  }
  return out;
}

interface Spacing {
  prefix: boolean[];
  postfix: boolean[];
  memberDot: boolean[];
  ternaryColon: boolean[];
  wordOp: boolean[];
}

/** Resolve unary/prefix vs binary usage and member-access dots per token. */
function flags(n: number): boolean[] {
  return Array.from({ length: n }, () => false);
}

function analyzeTokens(toks: Tok[], binaryStart: boolean): Spacing {
  const n = toks.length;
  const prefix: boolean[] = flags(n);
  const postfix: boolean[] = flags(n);
  const memberDot: boolean[] = flags(n);
  const ternaryColon: boolean[] = flags(n);
  const wordOp: boolean[] = flags(n);
  let ternaryDepth = 0;

  const operandEnd = (i: number): boolean => {
    const t = toks[i]!;
    // Word operators do not end an operand: a sign right after and/or/is is
    // unary, so it must attach to the operand below instead of spacing as
    // a binary operator.
    if (t.kind === "id") return !KEYWORD_BEFORE_PAREN.has(t.text.toLowerCase()) && !wordOp[i];
    if (t.kind === "num" || t.kind === "str" || t.kind === "object") return true;
    if (t.kind === "op" && (t.text === ")" || t.text === "]" || t.text === "}")) return true;
    return postfix[i] === true;
  };

  for (let i = 0; i < n; i++) {
    const t = toks[i]!;
    if (t.kind === "op" && t.text === "." && t.before === 0) {
      const next = i + 1 < n ? toks[i + 1]! : undefined;
      memberDot[i] = next !== undefined && next.before === 0;
    }
    if (t.kind === "id" && WORD_BIN_OPS.has(t.text.toLowerCase())) {
      // A word operator is binary between operands or at the head of a
      // continuation line; elsewhere (member names, plain identifiers) the
      // original gaps stay.
      wordOp[i] = i === 0 ? binaryStart : operandEnd(i - 1);
    }
    if (t.kind !== "op") continue;
    if (t.text === "?") {
      ternaryDepth++;
    } else if (t.text === ":") {
      // A colon with a pending "?" closes a ternary; otherwise it is an
      // object/switch key colon such as `{key: value}` or `case 1:`.
      ternaryColon[i] = ternaryDepth > 0;
      if (ternaryDepth > 0) ternaryDepth--;
    }
    if (UNARY_ONLY.has(t.text)) {
      prefix[i] = true;
    } else if (MAYBE_PREFIX.has(t.text)) {
      prefix[i] = i === 0 ? !binaryStart : !operandEnd(i - 1);
    }
    if ((t.text === "++" || t.text === "--") && i > 0 && operandEnd(i - 1)) {
      postfix[i] = true;
      prefix[i] = false;
    }
  }
  return { prefix, postfix, memberDot, ternaryColon, wordOp };
}

/** Only gaps governed by a format rule get a replacement. */
function sepBefore(toks: Tok[], sp: Spacing, i: number): number | undefined {
  const prev = toks[i - 1]!;
  const cur = toks[i]!;
  if (cur.kind === "com" || prev.kind === "com") return undefined;
  const p = prev.text;
  const c = cur.text;
  if (prev.kind === "op" && (p === "(" || p === "[")) return 0;
  if (cur.kind === "op" && (c === ")" || c === "]")) return 0;
  if (cur.kind === "op" && c === ",") {
    // Consecutive commas denote an omitted parameter: keep one space between
    // them so `f(a, , b)` does not collapse to `f(a,, b)`.
    return prev.kind === "op" && p === "," ? 1 : 0;
  }
  if (prev.kind === "op" && p === ",") return 1;
  if (sp.memberDot[i] || sp.memberDot[i - 1]) return 0;
  // Double-deref "%name%" and backtick escapes keep their original gaps.
  if (
    (cur.kind === "op" && (c === "%" || c === "#" || c.startsWith("`"))) ||
    (prev.kind === "op" && (p === "%" || p === "#" || p.startsWith("`")))
  ) {
    return undefined;
  }
  if (cur.kind === "op" && (c === "++" || c === "--") && !sp.prefix[i]) return 0;
  // The token after a postfix ++/-- follows the ordinary rules for its own
  // kind (binary spacing, ternary colon, comma, ...); unspecified gaps stay.
  if (prev.kind === "op" && sp.prefix[i - 1]) return 0;
  if (sp.wordOp[i] || sp.wordOp[i - 1]) return 1;
  if (cur.kind === "op" && c === "{") {
    if (prev.kind === "op" && (p === "(" || p === "[" || p === "," || p === "{")) return 0;
    return 1;
  }
  if (
    prev.kind === "op" &&
    p === "}" &&
    cur.kind === "id" &&
    ["else", "catch", "finally"].includes(c.toLowerCase())
  )
    return 1;
  if (cur.kind === "op" && c === ":") return sp.ternaryColon[i] ? 1 : undefined;
  if (prev.kind === "op" && p === ":") return sp.ternaryColon[i - 1] ? 1 : undefined;
  if (cur.kind === "op" && (c === "?" || c === "=>")) return 1;
  if (prev.kind === "op" && (p === "?" || p === "=>")) return 1;
  if (cur.kind === "op" && BIN_OPS.has(c) && !sp.prefix[i]) return 1;
  if (prev.kind === "op" && BIN_OPS.has(p)) return 1;
  return undefined;
}

/** Rebuild a single code line from its tokens with canonical spacing. */
export function formatTokens(toks: Tok[], raw: string, binaryStart = false): string {
  const sp = analyzeTokens(toks, binaryStart);
  let out = "";
  for (let i = 0; i < toks.length; i++) {
    if (i > 0) {
      const spaces = sepBefore(toks, sp, i);
      const prev = toks[i - 1]!;
      out +=
        spaces === undefined
          ? raw.slice(prev.col - 1 + prev.text.length, toks[i]!.col - 1)
          : " ".repeat(spaces);
    }
    out += toks[i]!.text;
  }
  return out;
}

interface ObjectState {
  depth: number;
  parens: number;
}

/** Protect raw object spans; their braces are not statement blocks. */
function protectObjects(toks: Tok[], raw: string, state: ObjectState, continuation = false): Tok[] {
  const out: Tok[] = [];
  const code = codeToks(toks);
  let start = state.depth > 0 ? 0 : -1;
  let first: Tok | undefined;
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i]!;
    const prev = toks[i - 1];
    if (tok.kind === "op" && tok.text === "{") {
      const isObject =
        state.depth > 0 ||
        state.parens > 0 ||
        (prev?.kind === "op" && ![")", "]", "}"].includes(prev.text)) ||
        tok !== code.at(-1) ||
        (i === 0 && continuation);
      if (isObject) {
        if (state.depth === 0) {
          start = tok.col - 1;
          first = tok;
        }
        state.depth++;
      }
    } else if (tok.kind === "op" && tok.text === "}" && state.depth > 0) {
      state.depth--;
      if (state.depth === 0) {
        out.push({
          kind: "object",
          text: raw.slice(start, tok.col),
          col: start + 1,
          before: first?.before ?? 0,
        });
        start = -1;
        first = undefined;
        continue;
      }
    }
    if (tok.kind === "op") {
      if (tok.text === "(" || tok.text === "[") state.parens++;
      if (tok.text === ")" || tok.text === "]") state.parens = Math.max(0, state.parens - 1);
    }
    if (start < 0) out.push(tok);
  }
  if (start >= 0) {
    out.push({
      kind: "object",
      text: raw.slice(start),
      col: start + 1,
      before: first?.before ?? 0,
    });
  }
  return out;
}

interface OutputLine {
  text: string;
  preserved: boolean;
}

function emitLines(infos: LineInfo[]): OutputLine[] {
  const out: OutputLine[] = [];
  const objects: ObjectState = { depth: 0, parens: 0 };
  let depth = 0;
  let hotIf = false;
  let bodyBase = 0;
  let pendingDefinition = false;
  let anchorOrig = 0;
  let anchorNext = 0;
  let anchorActive = false;
  const push = (text: string, preserved = false) => out.push({ text, preserved });

  for (const info of infos) {
    if (objects.depth > 0 && info.kind !== "code") {
      push(info.raw, true);
      continue;
    }
    switch (info.kind) {
      case "blank":
        push("");
        break;
      case "comment":
        push(INDENT.repeat(depth + bodyBase) + info.raw.trimStart(), true);
        break;
      case "blockcomment":
      case "contsec":
        push(info.raw, true);
        anchorActive = false;
        break;
      case "directive": {
        const directive = /^#HotIf\b(.*)$/i.exec(info.raw.trimStart());
        if (directive) {
          const tokens = lexLine(directive[1]!, { blockComment: false }).toks;
          hotIf = codeToks(tokens).length > 0;
        }
        push(info.raw.trimStart(), true);
        anchorActive = false;
        break;
      }
      case "label":
        push(hasComment(info) ? info.raw.trimStart() : info.raw.trim());
        anchorActive = false;
        break;
      case "hotkey": {
        const definition = splitHotDefinition(info.raw)!;
        const indent = hotIf ? INDENT : "";
        anchorActive = false;
        bodyBase = hotIf ? 1 : 0;
        pendingDefinition = definition.action.trim() === "";
        if (definition.hotstring) {
          push(indent + info.raw.trimStart(), true);
          // Executable hotstrings still introduce a normal multiline body.
          depth += netBraces(info.toks ?? []);
          if (depth === 0 && !pendingDefinition) bodyBase = 0;
          break;
        }
        const tokens = lexLine(definition.action, { blockComment: false }).toks;
        const protectedTokens = protectObjects(tokens, definition.action, objects);
        const action = formatTokens(protectedTokens, definition.action);
        anchorOrig = leadingWs(info.raw);
        anchorNext = indent.length;
        anchorActive = action !== "";
        const gap =
          protectedTokens[0]?.text === "{"
            ? " "
            : definition.action.slice(0, (tokens[0]?.col ?? 1) - 1);
        push(
          indent + definition.key + (action ? gap + action : ""),
          tokens.some((t) => t.kind === "com"),
        );
        depth = Math.max(0, depth + netBraces(protectedTokens));
        if (depth === 0 && !pendingDefinition) bodyBase = 0;
        break;
      }
      case "code": {
        if (pendingDefinition) {
          pendingDefinition = false;
          if (codeToks(info.toks)[0]?.text !== "{") bodyBase = 0;
        }
        const beganInObject = objects.depth > 0;
        const all = protectObjects(info.toks ?? [], info.raw, objects, info.cont);
        const code = codeToks(all);
        let indent: string;
        if (beganInObject) {
          indent = "";
        } else if (info.cont === true && anchorActive) {
          const rel = leadingWs(info.raw) - anchorOrig;
          indent = " ".repeat(Math.max(0, anchorNext + rel));
        } else {
          const closes = countLeadingCloses(code);
          indent = INDENT.repeat(Math.max(0, depth - closes) + bodyBase);
          anchorOrig = leadingWs(info.raw);
          anchorNext = indent.length;
          anchorActive = true;
        }
        push(
          indent + formatTokens(all, info.raw, info.binaryStart),
          beganInObject || objects.depth > 0 || hasComment(info),
        );
        depth = Math.max(0, depth + netBraces(code));
        if (depth === 0) bodyBase = 0;
        break;
      }
    }
  }
  return out;
}

function compressBlanks(lines: OutputLine[]): string[] {
  const out: OutputLine[] = [];
  for (const line of lines) {
    const prev = out.at(-1);
    if (line.text === "" && !line.preserved && prev?.text === "" && !prev.preserved) continue;
    out.push(line);
  }
  while (out.length > 1 && out.at(-1)?.text === "" && !out.at(-1)?.preserved) out.pop();
  return out.map((line) => line.text);
}

/**
 * Format one source file. Tokenization failures leave the entire input unchanged.
 */
export function formatSource(lines: string[]): FormatResult {
  const { infos, error } = classifyLines(lines);
  if (error) return { lines, error };
  for (const info of infos) {
    if (info.error !== undefined) return { lines, error: info.error };
  }
  return { lines: compressBlanks(emitLines(joinOtb(infos))) };
}
