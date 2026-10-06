# ahkcheck

Formatter / linter CLI for AutoHotkey v2 (`.ahk`) scripts. It formats source
according to fixed style rules and reports v1.1-only syntax that is an error
or invalid in AutoHotkey v2. No external dependencies; runs on Bun.

## Usage

```console
# Check formatting need + lint findings without writing (exit 1 on problems)
ahkcheck [path ...]

# Rewrite files with the formatting rules, print each processed file
ahkcheck --write [path ...]   # short form: -w

# Print unified diffs of pending formatting without writing (exit 1 on diffs)
ahkcheck --diff [path ...]

# Print lint findings only
ahkcheck --lint [path ...]

# Print help
ahkcheck -h | --help
```

You can also invoke the same CLI directly by folder path with Bun 1.4.2:

```console
bun /path/to/ahkcheck [path ...]
bun /path/to/ahkcheck --write [path ...]
bun /path/to/ahkcheck --lint [path ...]
```

Both entries have the same arguments, output and exit codes. Relative paths and
omitted paths refer to the caller's current directory, not the CLI folder.
Options may appear anywhere; `--write`, `--diff` and `--lint` are mutually
exclusive.

`<path>` accepts files, directories (searched recursively for `*.ahk`) and
glob patterns (`*`, `**`, `?`). Without arguments the current directory is
used. Directory and glob traversal excludes `.git`. Empty directory/glob
matches and invalid UTF-8 are processing errors.

The check output follows Prettier conventions: `Checking formatting...` and
the success line go to stdout, unformatted files are listed as `[warn]` lines
on stderr followed by a summary pointing at `--write`, and lint findings are
printed as `path:line:col rule-id message` on stdout.

```console
$ ahkcheck Main/
Checking formatting...
[warn] Main/HotKeys/GlobalHotkey.ahk
[warn] Code style issues found in the above file. Run ahkcheck with --write to fix.
Main/Modules/Utils.ahk:12:1 no-legacy-assign legacy assignment removed in v2; use ":=" such as "x := 1"

$ ahkcheck --diff Main/
--- Main/HotKeys/GlobalHotkey.ahk
+++ Main/HotKeys/GlobalHotkey.ahk
@@ -121,7 +121,7 @@
 ...

$ ahkcheck --write Main/
Main/HotKeys/GlobalHotkey.ahk 12ms
Main/Modules/Utils.ahk 9ms (unchanged)

$ ahkcheck --lint Main/ ScreenLock/
Main/Modules/Utils.ahk:12:1 no-legacy-assign legacy assignment removed in v2; use ":=" such as "x := 1"
```

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | success (check/lint/diff: no problems found; write: completed) |
| 1 | check, lint or diff found problems |
| 2 | processing error (path, option conflict, UTF-8, read/write failure, or lexical error in check/write/diff) |

`--write` only writes files it could tokenize completely. BOM presence is
preserved; all line endings become LF, including CRLF-only files and preserved
regions. Every processed file is listed as `<path> <duration>ms`, with
`(unchanged)` appended when the content was already correct. Processing errors
go to stderr, one line per error prefixed with `[error]`; other files
continue, with final exit code 2. Lint continues through tokenizable ranges
and lexical errors alone do not change its 0/1 exit code. `--diff` prints a
unified diff (3-line context, git-style `@@` ranges, `\ No newline at end of
file` markers) for every file whose formatted result differs, including
line-ending-only changes and missing final newlines, without writing.

## Format rules (summary)

- 4-space indentation by block depth, no tabs
- One True Brace style (`} else {`), closing braces on their own line
- Single spaces around binary/assignment/logical/ternary operators; unary
  operators stay attached
- One space after commas, none before; no spaces just inside `()`/`[]`
- Object literal contents and spaces remain as written
- Consecutive blank lines collapse to one; no trailing whitespace; the file
  ends with a single newline; empty files remain empty
- Strings, comments, continuation sections, hotstring lines, hotkey key
  parts and directive values are never rewritten. Preservation also applies
  to their whitespace and blank lines, overriding ordinary formatting rules
  except LF normalization
- Directives and labels start at column 0; `#HotIf` directives always start
  at column 0. Active (conditional) `#HotIf` regions indent every following
  line one level — hotkey/hotstring definitions, statements, function
  definitions, labels, comments and other directives — with multiline bodies
  two levels. A bare `#HotIf` ends the region: content returns to column 0
  and bodies to one level
- Expression continuations retain their indentation relative to the newly
  indented statement. Gaps outside the specified spacing rules stay as written,
  including the gap before an inline hotkey action. OTB brace spacing still applies
- OTB moves code before trailing comments without changing comment tokens;
  comments on a line whose code moved remain on that line

## Lint rules

| Rule | Detects |
| --- | --- |
| `no-legacy-assign` | `x = 1` legacy assignment |
| `no-command-call` | `MsgBox, hello` command call syntax |
| `no-legacy-if` | v1 `IfEqual` / `IfWinActive` and similar legacy If statements |
| `no-removed-builtin` | calls to built-ins removed in v2 (`Gosub`, `StringSplit`, ...) |
| `no-renamed-builtin` | calls using v1 names (`FileCopyDir`, `EnvAdd`, ...) |
| `no-removed-directive` | directives removed in v2 (`#NoEnv`, `#IfWinActive`, ...) |
| `no-renamed-directive` | `#If` (renamed to `#HotIf`) |

Findings are printed as `path:line:col rule-id message` where the message
includes the v2 replacement or an alternative approach. Strings, comments,
triggers, literal hotstring replacements and valid double-deref expressions
(`f := %myvar%()`) are not reported. Executable inline hotkey and `X` hotstring
bodies are linted; hotstring definition lines retain their content during fmt.
Function and method definition names are not calls. Calls inside default parameter
expressions and definition bodies are still checked.

## Development

`vp fmt` excludes `README.md`. Format Markdown with Prettier and the
`prettier-markdown-table` plugin.

```console
vp fmt    # format sources
vp lint   # lint + type check
vp test   # run the test suite
```
