/**
 * Linter for AutoHotkey v2 source: detects v1.1-only syntax that is an error
 * or invalid in v2. Rules are based on the official "Changes from v1.1 to
 * v2.0" document. Strings, comments, triggers, literal hotstring replacements
 * and continuation sections are excluded; executable hotkey actions are linted.
 */

import { classifyLines, type LineInfo } from "./classify.ts";
import type { Tok } from "./lexer.ts";

export interface LintFinding {
  line: number;
  col: number;
  rule: string;
  message: string;
}

const LEGACY_IF: Record<string, string> = {
  ifequal: 'v1 legacy If removed in v2; use an if expression such as "if x = y"',
  ifnotequal: 'v1 legacy If removed in v2; use an if expression such as "if x != y"',
  ifgreater: 'v1 legacy If removed in v2; use an if expression such as "if x > y"',
  ifgreaterorequal: 'v1 legacy If removed in v2; use an if expression such as "if x >= y"',
  ifless: 'v1 legacy If removed in v2; use an if expression such as "if x < y"',
  iflessorequal: 'v1 legacy If removed in v2; use an if expression such as "if x <= y"',
  ifinstring: 'v1 legacy If removed in v2; use "if InStr(x, y)"',
  ifnotinstring: 'v1 legacy If removed in v2; use "if !InStr(x, y)"',
  ifexist: 'v1 legacy If removed in v2; use "if FileExist(x)"',
  ifnotexist: 'v1 legacy If removed in v2; use "if !FileExist(x)"',
  ifwinactive: 'v1 legacy If removed in v2; use "if WinActive(x)"',
  ifwinnotactive: 'v1 legacy If removed in v2; use "if !WinActive(x)"',
  ifwinexist: 'v1 legacy If removed in v2; use "if WinExist(x)"',
  ifwinnotexist: 'v1 legacy If removed in v2; use "if !WinExist(x)"',
  ifmsgbox: "v1 legacy If removed in v2; use the return value of MsgBox()",
};

const REMOVED_FUNCS: Record<string, string> = {
  asc: "removed in v2; use Ord()",
  autotrim: "removed in v2; use Trim()",
  comobjmissing: "removed in v2; use consecutive commas",
  comobjunwrap: "removed in v2; use ComObjValue()",
  comobjenwrap: "removed in v2; use ComObjFromPtr()",
  comobjerror: "removed in v2; handle COM failures with try/catch",
  controlsendraw: "removed in v2; use ControlSendText()",
  envdiv: 'removed in v2; use "/" or "/="',
  envmult: 'removed in v2; use "*" or "*="',
  envupdate: "removed in v2; use SendMessage()",
  exception: "removed in v2; use Error()",
  filereadline: "removed in v2; use FileOpen() or a file-reading loop",
  func: 'removed in v2; refer to the function directly (MyFunc instead of Func("MyFunc"))',
  gosub: "removed in v2; call a function or use SetTimer()",
  input: "removed in v2; use InputHook()",
  isbyref: "removed in v2; declare an explicit &parameter and pass &variable",
  isfunc: "removed in v2; use a direct function reference and test value is Func",
  menugethandle: "removed in v2; use Menu.Handle",
  menugetname: "removed in v2; use MenuFromHandle()",
  progress: "removed in v2; use the Gui class",
  sendraw: "removed in v2; use SendText()",
  setbatchlines: "removed in v2; omit this call (v2 runs without automatic sleeps)",
  setenv: 'removed in v2; use ":="',
  setformat: "removed in v2; use Format()",
  soundget: "removed in v2; use the Sound functions such as SoundGetVolume()",
  soundset: "removed in v2; use the Sound functions such as SoundSetVolume()",
  soundgetwavevolume: "removed in v2; use SoundGetVolume()",
  soundsetwavevolume: "removed in v2; use SoundSetVolume()",
  splashimage: "removed in v2; use the Gui class",
  splashtexton: "removed in v2; use the Gui class",
  splashtextoff: "removed in v2; use the Gui class",
  stringcasesense: "removed in v2; use StrCompare() or a CaseSense parameter",
  stringgetpos: "removed in v2; use InStr()",
  stringleft: "removed in v2; use SubStr()",
  stringlen: "removed in v2; use StrLen()",
  stringmid: "removed in v2; use SubStr()",
  stringright: "removed in v2; use SubStr()",
  stringtrimleft: "removed in v2; use SubStr()",
  stringtrimright: "removed in v2; use SubStr()",
  stringreplace: "removed in v2; use StrReplace()",
  stringsplit: "removed in v2; use StrSplit()",
  transform: "removed in v2; use math functions or operators",
  varsetcapacity: "removed in v2; use Buffer or VarSetStrCapacity()",
  wingetactivestats: "removed in v2; use WinGetTitle() and WinGetPos()",
  wingetactivetitle: "removed in v2; use WinGetTitle()",
};

// The v1 Gui/Menu commands were replaced by classes of the same name; a
// call like Gui() or Menu() is valid v2, so only the comma command form is
// reported for these names.
const REMOVED_CLASS_COMMANDS: Record<string, string> = {
  gui: "v1 Gui command removed in v2; use the Gui class",
  guicontrol: "removed in v2; use Gui control objects",
  guicontrolget: "removed in v2; use Gui control objects",
  menu: "v1 Menu command removed in v2; use the Menu class",
};

const RENAMED_FUNCS: Record<string, string> = {
  comobjcreate: "renamed in v2; use ComObject()",
  comobjparameter: "renamed in v2; use ComValue()",
  drivespacefree: "renamed in v2; use DriveGetSpaceFree()",
  envadd: "renamed in v2; use DateAdd()",
  envsub: "renamed in v2; use DateDiff()",
  filecopydir: "renamed in v2; use DirCopy()",
  filecreatedir: "renamed in v2; use DirCreate()",
  filemovedir: "renamed in v2; use DirMove()",
  fileremovedir: "renamed in v2; use DirDelete()",
  fileselectfile: "renamed in v2; use FileSelect()",
  fileselectfolder: "renamed in v2; use DirSelect()",
  stringlower: "renamed in v2; use StrLower() or StrTitle()",
  stringupper: "renamed in v2; use StrUpper() or StrTitle()",
  urldownloadtofile: "renamed in v2; use Download()",
  winmenuselectitem: "renamed in v2; use MenuSelect()",
};

const REMOVED_DIRECTIVES: Record<string, string> = {
  "#commentflag": "removed in v2; use semicolon comments or /* ... */",
  "#delimiter": "removed in v2; use commas between function arguments",
  "#derefchar": "removed in v2; refer to variables directly in expressions",
  "#escapechar": "removed in v2; the escape character is always backtick",
  "#hotkeyinterval": "removed in v2; assign A_HotkeyInterval",
  "#hotkeymodifiertimeout": "removed in v2; assign A_HotkeyModifierTimeout",
  "#ifwinactive": "removed in v2; use #HotIf WinActive(...)",
  "#ifwinexist": "removed in v2; use #HotIf WinExist(...)",
  "#ifwinnotactive": "removed in v2; use #HotIf !WinActive(...)",
  "#ifwinnotexist": "removed in v2; use #HotIf !WinExist(...)",
  "#installkeybdhook": "removed in v2; call InstallKeybdHook()",
  "#installmousehook": "removed in v2; call InstallMouseHook()",
  "#keyhistory": "removed in v2; call KeyHistory(n)",
  "#ltrim": "removed in v2; use the LTrim option of continuation sections",
  "#maxhotkeysperinterval": "removed in v2; assign A_MaxHotkeysPerInterval",
  "#maxmem": "removed in v2; omit this directive (variable capacity has no artificial limit)",
  "#menumaskkey": "removed in v2; assign A_MenuMaskKey",
  "#noenv": "removed in v2; omit this directive and use EnvGet() for explicit environment reads",
};

// These statements can never be legacy assignments or command calls.
const STATEMENT_KEYWORDS = new Set([
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
]);

const LEGACY_ASSIGN_MSG = 'legacy assignment removed in v2; use ":=" such as "x := 1"';
const COMMAND_CALL_MSG =
  'command call syntax removed in v2; call the function without a comma such as "MsgBox hello" or "MsgBox(hello)"';

/** Distinguish call statements from assignment, member access and references. */
function isCallStatement(toks: Tok[]): boolean {
  const second = toks[1];
  if (!second) return true;
  if (second.text === "," || second.text === "(") return true;
  if (second.before === 0) return false;
  if (second.kind === "id" || second.kind === "num" || second.kind === "str") return true;
  return ["!", "~", "+", "-", "&", "%", "["].includes(second.text);
}

function definitionNames(infos: LineInfo[]): Set<Tok> {
  const candidates = new Set<Tok>();
  const tokens: Tok[] = [];
  for (const info of infos) {
    const code = (info.toks ?? []).filter((tok) => tok.kind !== "com");
    tokens.push(...code);
    if (info.kind !== "code" || info.cont) continue;
    const start = code[0]?.text.toLowerCase() === "static" ? 1 : 0;
    const name = code[start];
    const open = code[start + 1];
    if (name?.kind === "id" && open?.text === "(" && open.before === 0) candidates.add(name);
  }
  const definitions = new Set<Tok>();
  for (let i = 0; i < tokens.length; i++) {
    const name = tokens[i]!;
    if (!candidates.has(name)) continue;
    let depth = 0;
    for (let j = i + 1; j < tokens.length; j++) {
      const tok = tokens[j]!;
      if (tok.kind !== "op") continue;
      if (tok.text === "(") depth++;
      if (tok.text !== ")" || --depth !== 0) continue;
      const next = tokens[j + 1];
      if (next?.kind === "op" && (next.text === "{" || next.text === "=>")) definitions.add(name);
      break;
    }
  }
  return definitions;
}

/**
 * Lint one source file. The whole file is scanned; lines that could not be
 * tokenized are skipped, so findings are reported for the parseable ranges.
 */
export function lintLines(lines: string[]): LintFinding[] {
  const { infos } = classifyLines(lines);
  const definitions = definitionNames(infos);
  const findings: LintFinding[] = [];
  const reported = new Set<string>();

  const push = (line: number, col: number, rule: string, message: string) => {
    const key = `${line}:${col}`;
    if (reported.has(key)) return;
    reported.add(key);
    findings.push({ line, col, rule, message });
  };

  for (let i = 0; i < infos.length; i++) {
    const info = infos[i]!;
    const lineNo = i + 1;

    if (info.kind === "directive") {
      const toks = (info.toks ?? []).filter((t) => t.kind !== "com");
      if (toks.length >= 2 && toks[0]!.text === "#" && toks[1]!.kind === "id") {
        const name = `#${toks[1]!.text}`.toLowerCase();
        if (name in REMOVED_DIRECTIVES) {
          push(lineNo, toks[0]!.col, "no-removed-directive", REMOVED_DIRECTIVES[name]!);
        } else if (name === "#if") {
          push(lineNo, toks[0]!.col, "no-renamed-directive", "renamed in v2; use #HotIf");
        }
      }
      continue;
    }

    if ((info.kind !== "code" && info.kind !== "hotkey") || info.toks === undefined) continue;
    const toks = info.toks.filter((t) => t.kind !== "com");
    if (toks.length === 0) continue;
    const first = toks[0]!;

    if (
      !info.cont &&
      first.kind === "id" &&
      !definitions.has(first) &&
      !STATEMENT_KEYWORDS.has(first.text.toLowerCase())
    ) {
      const name = first.text.toLowerCase();
      const second = toks[1];
      const comma = second?.kind === "op" && second.text === ",";
      if (second?.kind === "op" && second.text === "=") {
        push(lineNo, first.col, "no-legacy-assign", LEGACY_ASSIGN_MSG);
      } else if (isCallStatement(toks) && name in LEGACY_IF) {
        push(lineNo, first.col, "no-legacy-if", LEGACY_IF[name]!);
      } else if (isCallStatement(toks) && name in REMOVED_FUNCS) {
        push(lineNo, first.col, "no-removed-builtin", REMOVED_FUNCS[name]!);
      } else if (name in REMOVED_CLASS_COMMANDS && comma) {
        push(lineNo, first.col, "no-removed-builtin", REMOVED_CLASS_COMMANDS[name]!);
      } else if (isCallStatement(toks) && name in RENAMED_FUNCS) {
        push(lineNo, first.col, "no-renamed-builtin", RENAMED_FUNCS[name]!);
      } else if (comma) {
        push(lineNo, first.col, "no-command-call", COMMAND_CALL_MSG);
      }
    }

    // Removed / renamed built-ins used in call position inside expressions.
    for (let j = 0; j < toks.length; j++) {
      const tok = toks[j]!;
      if (tok.kind !== "id" || definitions.has(tok)) continue;
      const next = toks[j + 1];
      if (next?.kind !== "op" || next.text !== "(" || next.before !== 0) continue;
      const prev = toks[j - 1];
      if (prev?.kind === "op" && prev.text === ".") continue;
      const name = tok.text.toLowerCase();
      if (name in REMOVED_FUNCS) {
        push(lineNo, tok.col, "no-removed-builtin", REMOVED_FUNCS[name]!);
      } else if (name in RENAMED_FUNCS) {
        push(lineNo, tok.col, "no-renamed-builtin", RENAMED_FUNCS[name]!);
      }
    }
  }
  return findings;
}
