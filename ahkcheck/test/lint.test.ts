import { describe, expect, it } from "vite-plus/test";
import { lintLines } from "../src/lint.ts";
import { splitLines } from "../src/fileio.ts";

function lint(src: string) {
  return lintLines(splitLines(src));
}

function definitionSources(name: string): string[] {
  const headers = [
    `${name}(x) {\n    return x\n}\n`,
    `${name}(x) ; header\n; between\n{\n    return x\n}\n`,
    `${name}(x) => x\n`,
    `${name}(\n    x,\n    y := { text: ")", values: [1, 2] }\n) {\n    return x\n}\n`,
    `${name}(\n    x\n)\n{\n    return x\n}\n`,
    `${name}(\n    x\n)\n    => x\n`,
  ];
  return headers.flatMap((header) => [
    header,
    "class Tools {\n" +
      header
        .split("\n")
        .filter(Boolean)
        .map((line) => "    " + line)
        .join("\n") +
      "\n}\n",
    "class Tools {\n    static " + header.trimEnd().replaceAll("\n", "\n    ") + "\n}\n",
  ]);
}

function expectDefinitionCalls(name: string, rule: string) {
  const sources = [
    { source: `${name}(x := ${name}(1)) {\n    return ${name}(x)\n}\n`, callLines: [1, 2] },
    {
      source: `class Tools {\n    static ${name}(\n        x := { value: ${name}(1) }\n    ) => ${name}(x)\n}\n`,
      callLines: [3, 4],
    },
  ];
  for (const { source, callLines } of sources) {
    const findings = lint(source);
    expect(findings, source).toHaveLength(2);
    expect(
      findings.map((finding) => ({ line: finding.line, col: finding.col, rule: finding.rule })),
      source,
    ).toEqual(
      callLines.map((line) => ({
        line,
        col: source.split("\n")[line - 1]!.lastIndexOf(name) + 1,
        rule,
      })),
    );
  }
}

describe("lint: no-legacy-assign", () => {
  it("detects legacy assignment statements", () => {
    const findings = lint("x = 1\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ line: 1, col: 1, rule: "no-legacy-assign" });
    expect(findings[0]!.message).toContain(":=");
  });

  it("detects legacy assignment with percent deref only once", () => {
    const findings = lint("pos = %A_Index%\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("no-legacy-assign");
  });

  it("does not report comparisons or fat-arrow assignment", () => {
    expect(lint("x == 1\nx := 1\nif (x = 1) {\n}\n")).toHaveLength(0);
  });
});

describe("lint: no-command-call", () => {
  it("detects a comma after a function name in call statements", () => {
    for (const src of ["MsgBox, hello\n", "WinActivate, Untitled\n"]) {
      const findings = lint(src);
      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ line: 1, col: 1, rule: "no-command-call" });
    }
  });

  it("does not report v2 call syntax", () => {
    expect(lint('MsgBox hello\nMsgBox("x")\n')).toHaveLength(0);
  });
});

describe("lint: no-legacy-if", () => {
  it.each([
    ["IfEqual", "if x = y"],
    ["IfNotEqual", "if x != y"],
    ["IfGreater", "if x > y"],
    ["IfGreaterOrEqual", "if x >= y"],
    ["IfLess", "if x < y"],
    ["IfLessOrEqual", "if x <= y"],
    ["IfInString", "InStr"],
    ["IfNotInString", "!InStr"],
    ["IfExist", "FileExist"],
    ["IfNotExist", "!FileExist"],
    ["IfWinActive", "WinActive"],
    ["IfWinNotActive", "!WinActive"],
    ["IfWinExist", "WinExist"],
    ["IfWinNotExist", "!WinExist"],
    ["IfMsgBox", "return value"],
  ])("reports %s once with its expression replacement", (name, replacement) => {
    const findings = lint(name.toUpperCase() + ", x, y\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("no-legacy-if");
    expect(findings[0]!.message).toContain(replacement);
  });

  it.each(["IfEqual", "IfWinActive", "IfExist"])(
    "does not lint %s as a variable or reference",
    (name) => {
      expect(
        lint(
          `${name} := 1\n${name} += 1\nx := ${name}\nx := [${name}]\n${name}[1] := 2\n${name}.value := 2\n`,
        ),
      ).toEqual([]);
    },
  );
  it("detects v1 legacy If statements case-insensitively", () => {
    const findings = lint("IfEqual, x, 1\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ line: 1, col: 1, rule: "no-legacy-if" });

    const lower = lint("ifwinactive ahk_class x\n");
    expect(lower[0]!.rule).toBe("no-legacy-if");
  });

  it("suggests the v2 equivalent", () => {
    expect(lint("IfExist, C:\\a.txt\n")[0]!.message).toContain("FileExist");
  });
});

describe("lint: no-removed-builtin", () => {
  it.each([
    ["Asc", "Ord()"],
    ["AutoTrim", "Trim()"],
    ["ComObjMissing", "consecutive commas"],
    ["ComObjUnwrap", "ComObjValue()"],
    ["ComObjEnwrap", "ComObjFromPtr()"],
    ["ComObjError", "try/catch"],
    ["ControlSendRaw", "ControlSendText()"],
    ["EnvDiv", "/="],
    ["EnvMult", "*="],
    ["EnvUpdate", "SendMessage()"],
    ["Exception", "Error()"],
    ["FileReadLine", "FileOpen()"],
    ["Func", "refer to the function directly"],
    ["Gosub", "call a function"],
    ["Input", "InputHook()"],
    ["IsByRef", "&parameter"],
    ["IsFunc", "is Func"],
    ["MenuGetHandle", "Menu.Handle"],
    ["MenuGetName", "MenuFromHandle()"],
    ["Progress", "Gui class"],
    ["SendRaw", "SendText()"],
    ["SetBatchLines", "omit this call"],
    ["SetEnv", ":="],
    ["SetFormat", "Format()"],
    ["SoundGet", "SoundGetVolume()"],
    ["SoundSet", "SoundSetVolume()"],
    ["SoundGetWaveVolume", "SoundGetVolume()"],
    ["SoundSetWaveVolume", "SoundSetVolume()"],
    ["SplashImage", "Gui class"],
    ["SplashTextOn", "Gui class"],
    ["SplashTextOff", "Gui class"],
    ["StringCaseSense", "StrCompare()"],
    ["StringGetPos", "InStr()"],
    ["StringLeft", "SubStr()"],
    ["StringLen", "StrLen()"],
    ["StringMid", "SubStr()"],
    ["StringRight", "SubStr()"],
    ["StringTrimLeft", "SubStr()"],
    ["StringTrimRight", "SubStr()"],
    ["StringReplace", "StrReplace()"],
    ["StringSplit", "StrSplit()"],
    ["Transform", "math functions"],
    ["VarSetCapacity", "Buffer"],
    ["WinGetActiveStats", "WinGetTitle()"],
    ["WinGetActiveTitle", "WinGetTitle()"],
    ["Gui", "Gui class"],
    ["GuiControl", "control objects"],
    ["GuiControlGet", "control objects"],
    ["Menu", "Menu class"],
  ])("reports %s once with an alternative", (name, replacement) => {
    const findings = lint(name + ", x\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("no-removed-builtin");
    expect(findings[0]!.message).toContain(replacement);
  });

  it.each(["Asc", "Gosub", "SetFormat"])("does not lint %s outside call position", (name) => {
    expect(
      lint(
        `${name} := 1\n${name} += 1\nx := ${name}\nx := [${name}]\n${name}[1] := 2\n${name}.value := 2\n${name}++\nx := ${name} (1)\n`,
      ),
    ).toEqual([]);
  });

  it.each(["Asc", "Gosub", "SetFormat"])(
    "retains command and function call positives for %s",
    (name) => {
      for (const source of [
        `${name}, x\n`,
        `${name} x\n`,
        `${name}(x)\n`,
        `${name} (x)\n`,
        `x := ${name}(y)\n`,
        `${name}\n`,
      ]) {
        expect(lint(source), source).toHaveLength(1);
        expect(lint(source)[0]!.rule, source).toBe("no-removed-builtin");
      }
    },
  );
  it.each(["Asc", "Gosub", "SetFormat"])("does not lint %s definition headers", (name) => {
    for (const source of definitionSources(name)) expect(lint(source), source).toEqual([]);
  });

  it.each(["Asc", "Gosub", "SetFormat"])(
    "retains calls in %s defaults and definition bodies",
    (name) => {
      expectDefinitionCalls(name, "no-removed-builtin");
    },
  );

  it("detects removed builtins in command position", () => {
    for (const src of [
      "SetFormat, float, 0.2\n",
      "Gosub, Label\n",
      "StringSplit, arr, ,\n",
      "EnvDiv, x, 2\n",
    ]) {
      const findings = lint(src);
      expect(findings).toHaveLength(1);
      expect(findings[0]!.rule).toBe("no-removed-builtin");
    }
  });

  it("detects removed builtins in call position", () => {
    const findings = lint("y := Asc(c)\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ line: 1, col: 6, rule: "no-removed-builtin" });
  });

  it("reports removed builtins instead of the command-call comma", () => {
    const findings = lint("EnvDiv, x, 2\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("no-removed-builtin");
  });

  it("reports the v1 Gui command only in comma form", () => {
    expect(lint("x := Gui()\n")).toHaveLength(0);
    const findings = lint("Gui, Add, Text,, x\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("no-removed-builtin");
  });
});

describe("lint: no-renamed-builtin", () => {
  it.each([
    ["ComObjCreate", "ComObject"],
    ["ComObjParameter", "ComValue"],
    ["DriveSpaceFree", "DriveGetSpaceFree"],
    ["EnvAdd", "DateAdd"],
    ["EnvSub", "DateDiff"],
    ["FileCopyDir", "DirCopy"],
    ["FileCreateDir", "DirCreate"],
    ["FileMoveDir", "DirMove"],
    ["FileRemoveDir", "DirDelete"],
    ["FileSelectFile", "FileSelect"],
    ["FileSelectFolder", "DirSelect"],
    ["StringLower", "StrLower"],
    ["StringUpper", "StrUpper"],
    ["UrlDownloadToFile", "Download"],
    ["WinMenuSelectItem", "MenuSelect"],
  ])("reports %s once with the renamed builtin", (name, replacement) => {
    const findings = lint(name + ", x\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("no-renamed-builtin");
    expect(findings[0]!.message).toContain(replacement);
  });

  it.each(["FileCopyDir", "EnvAdd", "ComObjCreate"])(
    "does not lint %s outside call position",
    (name) => {
      expect(
        lint(
          `${name} := 1\n${name} += 1\nx := ${name}\nx := [${name}]\n${name}[1] := 2\n${name}.value := 2\n${name}++\nx := ${name} (1)\n`,
        ),
      ).toEqual([]);
    },
  );

  it.each(["FileCopyDir", "EnvAdd", "ComObjCreate"])(
    "retains command and function call positives for %s",
    (name) => {
      for (const source of [
        `${name}, x\n`,
        `${name} x\n`,
        `${name}(x)\n`,
        `${name} (x)\n`,
        `x := ${name}(y)\n`,
        `${name}\n`,
      ]) {
        expect(lint(source), source).toHaveLength(1);
        expect(lint(source)[0]!.rule, source).toBe("no-renamed-builtin");
      }
    },
  );
  it.each(["FileCopyDir", "EnvAdd", "ComObjCreate"])(
    "does not lint %s definition headers",
    (name) => {
      for (const source of definitionSources(name)) expect(lint(source), source).toEqual([]);
    },
  );

  it.each(["FileCopyDir", "EnvAdd", "ComObjCreate"])(
    "retains calls in %s defaults and definition bodies",
    (name) => {
      expectDefinitionCalls(name, "no-renamed-builtin");
    },
  );

  it("detects renamed builtins", () => {
    const findings = lint("FileCopyDir, a, b\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("no-renamed-builtin");
    expect(findings[0]!.message).toContain("DirCopy");

    const call = lint('EnvAdd(t, 1, "days")\n');
    expect(call).toHaveLength(1);
    expect(call[0]!.rule).toBe("no-renamed-builtin");
  });
});

describe("lint: no-removed-directive", () => {
  it.each([
    ["#CommentFlag", "semicolon"],
    ["#Delimiter", "commas"],
    ["#DerefChar", "directly"],
    ["#EscapeChar", "backtick"],
    ["#HotkeyInterval", "A_HotkeyInterval"],
    ["#HotkeyModifierTimeout", "A_HotkeyModifierTimeout"],
    ["#IfWinActive", "#HotIf WinActive"],
    ["#IfWinExist", "#HotIf WinExist"],
    ["#IfWinNotActive", "#HotIf !WinActive"],
    ["#IfWinNotExist", "#HotIf !WinExist"],
    ["#InstallKeybdHook", "InstallKeybdHook()"],
    ["#InstallMouseHook", "InstallMouseHook()"],
    ["#KeyHistory", "KeyHistory(n)"],
    ["#LTrim", "LTrim option"],
    ["#MaxHotkeysPerInterval", "A_MaxHotkeysPerInterval"],
    ["#MaxMem", "omit this directive"],
    ["#MenuMaskKey", "A_MenuMaskKey"],
    ["#NoEnv", "EnvGet()"],
  ])("reports %s once with an alternative", (name, replacement) => {
    const findings = lint(name + "\n");
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("no-removed-directive");
    expect(findings[0]!.message).toContain(replacement);
  });

  it("detects removed directives", () => {
    expect(lint("#NoEnv\n")[0]!.rule).toBe("no-removed-directive");
    const findings = lint("#IfWinActive ahk_exe x.exe\n");
    expect(findings[0]!.rule).toBe("no-removed-directive");
    expect(findings[0]!.message).toContain("#HotIf");
  });
});

describe("lint: no-renamed-directive", () => {
  it("detects #If and suggests #HotIf", () => {
    const findings = lint('#If WinActive("a")\n');
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ line: 1, col: 1, rule: "no-renamed-directive" });
    expect(findings[0]!.message).toContain("#HotIf");
  });

  it("does not report #HotIf", () => {
    expect(lint('#HotIf WinActive("a")\n')).toHaveLength(0);
  });
});

describe("lint: positions", () => {
  it("reports line and column of each finding", () => {
    const findings = lint("a := 1\nx = 1\n#NoEnv\n");
    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatchObject({ line: 2, col: 1, rule: "no-legacy-assign" });
    expect(findings[1]).toMatchObject({ line: 3, col: 1, rule: "no-removed-directive" });
  });
});

describe("lint: suppressed areas", () => {
  it("does not report inside strings and comments", () => {
    expect(lint('MsgBox("x = 1")\n')).toHaveLength(0);
    expect(lint("; x = 1\n")).toHaveLength(0);
    expect(lint("/*\nx = 1\nGosub, a\n*/\n")).toHaveLength(0);
    expect(lint('s := "MsgBox, hello"\n')).toHaveLength(0);
  });

  it("does not report valid double-deref expressions", () => {
    expect(lint("f := %myvar%()\nx := %name%\n")).toHaveLength(0);
  });

  it("does not report percent variables in #Include / #DllLoad", () => {
    expect(lint("#Include %A_ScriptDir%\\lib.ahk\n")).toHaveLength(0);
    expect(lint("#DllLoad %A_ScriptDir%\\x.dll\n")).toHaveLength(0);
  });

  it("does not report hotkey / hotstring definition lines", () => {
    expect(lint('+5:: Send("{$}")\n')).toHaveLength(0);
    expect(lint("::btw::by the way\n")).toHaveLength(0);
    expect(lint(':ox:nme:: SendInput("{Text}" . EMAIL)\n')).toHaveLength(0);
  });

  it("does not report method calls with removed-looking names", () => {
    expect(lint("x := obj.Transform()\n")).toHaveLength(0);
  });
});

describe("lint: executable definition actions", () => {
  it("lints inline hotkey statements at their original positions", () => {
    expect(lint("    %::x = 1\n")[0]).toMatchObject({ line: 1, col: 8, rule: "no-legacy-assign" });
    expect(lint("a::MsgBox, hello\n")[0]).toMatchObject({
      line: 1,
      col: 4,
      rule: "no-command-call",
    });
    expect(lint("a::y := Asc(c)\n")[0]).toMatchObject({
      line: 1,
      col: 9,
      rule: "no-removed-builtin",
    });
  });

  it("does not lint literal hotstring replacement text", () => {
    expect(lint('::percent%::x = 1 "unterminated /*\n::cmd::MsgBox, hello\n')).toEqual([]);
  });

  it("lints executable X hotstring actions but not X0 replacement text", () => {
    expect(lint(":X:go::MsgBox, hello\n")[0]).toMatchObject({
      line: 1,
      col: 8,
      rule: "no-command-call",
    });
    expect(lint(":X0:go::MsgBox, hello\n")).toEqual([]);
  });

  it("lints normal multiline definition bodies", () => {
    expect(lint("a:: {\n    x = 1\n}\n")[0]).toMatchObject({
      line: 2,
      col: 5,
      rule: "no-legacy-assign",
    });
  });

  it("does not lint continuation-section text", () => {
    expect(lint('s := "\n(\nx = 1\nMsgBox, hello\n)"\n')).toEqual([]);
  });
});

describe("lint: untokenizable ranges", () => {
  it("continues past lines with tokenize errors", () => {
    const findings = lint('s := "unterminated\nx = 1\n');
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ line: 2, col: 1, rule: "no-legacy-assign" });
  });
});
