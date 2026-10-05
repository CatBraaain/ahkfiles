# ahkcheck

Formatter / linter CLI for AutoHotkey v2 (`.ahk`) scripts. It formats source
according to fixed style rules and reports v1.1-only syntax that is an error
or invalid in AutoHotkey v2. No external dependencies; runs on Bun.

## Usage

```console
# Check formatting need + lint findings without writing (exit 1 on problems)
ahkcheck [path ...]

# Rewrite files with the formatting rules, print the formatted count
ahkcheck fmt [path ...]

# Print lint findings only
ahkcheck lint [path ...]

# Print help
ahkcheck -h | --help
```

You can also invoke the same CLI directly by folder path with Bun 1.4.2:

```console
bun /path/to/ahkcheck [path ...]
bun /path/to/ahkcheck fmt [path ...]
bun /path/to/ahkcheck lint [path ...]
```

Both entries have the same arguments, output and exit codes. Relative paths and
omitted paths refer to the caller's current directory, not the CLI folder.

`<path>` accepts files, directories (searched recursively for `*.ahk`) and
glob patterns (`*`, `**`, `?`). Without arguments the current directory is
used. Directory and glob traversal excludes `.git`. Empty directory/glob
matches and invalid UTF-8 are processing errors.

```console
$ ahkcheck Main/
Main/HotKeys/GlobalHotkey.ahk
Main/Modules/Utils.ahk:12:1 no-legacy-assign legacy assignment removed in v2; use ":=" such as "x := 1"

$ ahkcheck fmt Main/
formatted 2 files

$ ahkcheck lint Main/ ScreenLock/
Main/Modules/Utils.ahk:12:1 no-legacy-assign legacy assignment removed in v2; use ":=" such as "x := 1"
```

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | success (default/lint: no problems found) |
| 1 | default mode or lint found problems |
| 2 | processing error (path, UTF-8, read/write failure, or lexical error in default/fmt) |

`fmt` only writes files it could tokenize completely. BOM presence is preserved;
all line endings become LF, including CRLF-only files and preserved regions.
Line-ending-only changes count in both default checks and the fmt summary. Processing errors go to stderr, one
line per error; other files continue, with final exit code 2. Lint continues
through tokenizable ranges and lexical errors alone do not change its 0/1 exit
code. The fmt summary is always `formatted N files`, counting changes only.

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
- Directives and labels start at column 0. Active `#HotIf` regions indent
  hotkey/hotstring definitions one level and multiline bodies two levels;
  bare `#HotIf` resets definitions to column 0 and bodies to one level
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
