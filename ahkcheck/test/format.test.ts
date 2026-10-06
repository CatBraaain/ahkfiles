import { describe, expect, it } from "vite-plus/test";
import { formatSource } from "../src/format.ts";
import { joinLines, splitLines } from "../src/fileio.ts";

function fmt(before: string): string {
  const result = formatSource(splitLines(before));
  expect(result.error).toBeUndefined();
  return joinLines(result.lines);
}

function fmtOnce(before: string, after: string) {
  expect(fmt(before)).toBe(after);
  // Formatting is idempotent.
  expect(fmt(after)).toBe(after);
}

describe("format rule 1: indentation", () => {
  it("indents by block depth with 4 spaces, never tabs", () => {
    fmtOnce("if x {\n\ty()\n        z()\n}\n", "if x {\n    y()\n    z()\n}\n");
  });

  it("keeps the relative indentation of continuation lines", () => {
    const src = "f(\n    a,\n        b\n)\n";
    fmtOnce(src, src);
  });

  it("keeps assignment continuation lines one level deeper", () => {
    const src = 'Games :=\n    "(a|b)"\n';
    fmtOnce(src, src);
  });

  it("keeps operator continuation lines", () => {
    const src = "x := a\n    && b\n";
    fmtOnce(src, src);
  });

  it("keeps continuation lines starting with is", () => {
    fmtOnce("x := value\n    is String\n", "x := value\n    is String\n");
    fmtOnce("x := value\n    is  String\n", "x := value\n    is String\n");
    fmtOnce("x := value\n    IS  String\n", "x := value\n    IS String\n");
  });

  it("keeps lines after trailing word operators as continuations", () => {
    fmtOnce("x := a and\n    b\n", "x := a and\n    b\n");
    fmtOnce("y := p or\n    q\n", "y := p or\n    q\n");
    fmtOnce("z := v is\n    String\n", "z := v is\n    String\n");
    fmtOnce("x := a AND\n\tb\n", "x := a AND\n    b\n");
  });

  it("keeps lines after trailing prefix not as continuations", () => {
    fmtOnce("x := not\n    y\n", "x := not\n    y\n");
    fmtOnce("x := not\n\tb\n", "x := not\n    b\n");
    fmtOnce("x := !\n    y\n", "x := !\n    y\n");
    fmtOnce("f(not\n  x)\n", "f(not\n  x)\n");
    fmtOnce("x := a and not\n  b\n", "x := a and not\n  b\n");
    fmtOnce("x := not  y\n", "x := not  y\n");
  });

  it("keeps lines starting with not as continuations", () => {
    fmtOnce("x := a\n    not b\n", "x := a\n    not b\n");
  });

  it("does not treat member word lookalikes at line ends as continuations", () => {
    fmtOnce(
      "f() {\n    y := obj.and\n        z := 1\n}\n",
      "f() {\n    y := obj.and\n    z := 1\n}\n",
    );
    fmtOnce(
      "f() {\n    y := obj.not\n        z := 1\n}\n",
      "f() {\n    y := obj.not\n    z := 1\n}\n",
    );
  });

  it("preserves expression continuation indentation relative to the new anchor", () => {
    fmtOnce(
      "f() {\n  x:=a\n      +b\n  y:=g(\n       a,\n    b\n  )\n}\n",
      "f() {\n    x := a\n        + b\n    y := g(\n         a,\n      b\n    )\n}\n",
    );
  });
});

describe("format rule 2: braces", () => {
  it("moves opening braces before header comments without changing their contents", () => {
    fmtOnce("if x ; keep  \t\n{\ny()\n}\n", "if x { ; keep  \t\n    y()\n}\n");
  });

  it("keeps brace comments on their own line when the brace moves", () => {
    fmtOnce("if x\n{ ; brace  \t\ny()\n}\n", "if x {\n    ; brace  \t\n    y()\n}\n");
  });

  it("joins else before closing-brace comments and retains else comments", () => {
    fmtOnce(
      "if x {\ny()\n} ; close  \t\nelse ; branch  \t\n{ ; opening  \t\nz()\n}\n",
      "if x {\n    y()\n} else { ; close  \t\n    ; branch  \t\n    ; opening  \t\n    z()\n}\n",
    );
  });

  it("joins commented catch and finally headers while preserving every comment token", () => {
    fmtOnce(
      "try ; try  \n{ ; first  \nf()\n} ; close  \ncatch Error as err ; catch  \n{ ; second  \ng(err)\n} ; caught  \nfinally ; finally  \n{ ; third  \nh()\n}\n",
      "try { ; try  \n    ; first  \n    f()\n} catch Error as err { ; close  \n    ; catch  \n    ; second  \n    g(err)\n} finally { ; caught  \n    ; finally  \n    ; third  \n    h()\n}\n",
    );
  });

  it("preserves multiple block and line comments without joining their text", () => {
    fmtOnce(
      "if x /* header  */ ; header end  \n{ /* open  */ /* another  */ ; brace end  \nf()\n} /* close  */ ; close end  \nelse /* else  */ if y ; else end  \n{ ; next  \ng()\n}\n",
      "if x { /* header  */ ; header end  \n    /* open  */ /* another  */ ; brace end  \n    f()\n} else  if y { /* close  */ ; close end  \n    /* else  */   ; else end  \n    ; next  \n    g()\n}\n",
    );
  });
  it("applies One True Brace style", () => {
    fmtOnce(
      "MyFunc(a)\n{\n    if (a > 0)\n    {\n        x := b\n    }\n    else\n    {\n        x := 0\n    }\n}\n",
      "MyFunc(a) {\n    if (a > 0) {\n        x := b\n    } else {\n        x := 0\n    }\n}\n",
    );
  });

  it("moves a brace under a hotkey definition onto the definition line", () => {
    fmtOnce('~a::\n{\n    Send("x")\n}\n', '~a:: {\n    Send("x")\n}\n');
  });

  it("applies OTB to class, catch and finally blocks", () => {
    fmtOnce(
      "class Worker\n{\nRun()\n{\ntry\n{\nf()\n}\ncatch Error as err\n{\ng(err)\n}\nfinally\n{\nh()\n}\n}\n}\n",
      "class Worker {\n    Run() {\n        try {\n            f()\n        } catch Error as err {\n            g(err)\n        } finally {\n            h()\n        }\n    }\n}\n",
    );
  });
});

describe("format rule 3: operator spacing", () => {
  it("spaces binary operators and assignment operators", () => {
    fmtOnce("x:=1+2*3\n", "x := 1 + 2 * 3\n");
  });

  it("keeps unary operators attached to their operand", () => {
    fmtOnce("y :=-z\nn := ! ok\ni := ++ j\n", "y := -z\nn := !ok\ni := ++j\n");
  });

  it("spaces the ternary operator", () => {
    fmtOnce("m := a?b:c\n", "m := a ? b : c\n");
  });

  it("keeps member access dots attached while spacing concat dots", () => {
    fmtOnce("x := a.b . c\n", "x := a.b . c\n");
    fmtOnce("y:=a.b.c\n", "y := a.b.c\n");
    fmtOnce("z := a. b\n", "z := a . b\n");
  });

  it.each([":=", "+=", "-=", "*=", "/=", "//=", ".=", "|=", "&=", "^=", ">>=", ">>>=", "<<="])(
    "spaces the %s assignment operator",
    (op) => fmtOnce(`x${op}2\n`, `x ${op} 2\n`),
  );

  it.each([
    "&&",
    "||",
    "+",
    "-",
    "*",
    "/",
    "//",
    "**",
    "=",
    "==",
    "!=",
    "!==",
    "~=",
    "<",
    ">",
    "<=",
    ">=",
    "&",
    "|",
    "^",
    "<<",
    ">>",
    ">>>",
  ])("spaces the %s binary operator", (op) => fmtOnce(`x:=a${op}b\n`, `x := a ${op} b\n`));

  it("spaces word binary operators like symbol binary operators", () => {
    fmtOnce("x := a  and   b\n", "x := a and b\n");
    fmtOnce("x := a\tor\tb\n", "x := a or b\n");
    fmtOnce("x := value  is   String\n", "x := value is String\n");
    fmtOnce("if (a  and  b) {\n    y()\n}\n", "if (a and b) {\n    y()\n}\n");
  });

  it.each(["AND", "And", "or", "OR", "is", "IS"])(
    "spaces the %s word binary operator case-insensitively",
    (word) => fmtOnce(`x := a  ${word}   b\n`, `x := a ${word} b\n`),
  );

  it("spaces word binary operators at continuation-line starts", () => {
    fmtOnce("x := a\n    and   b\n", "x := a\n    and b\n");
    fmtOnce("y := p\n\tor\tq\n", "y := p\n    or q\n");
  });

  it("keeps gaps around word-operator lookalikes outside binary position", () => {
    fmtOnce(
      'x := "a  and  b"\ny := obj.and\nz := obj.is\nis:=1\nfor k, v  in   pairs\nq := y  contains   z\n',
      'x := "a  and  b"\ny := obj.and\nz := obj.is\nis := 1\nfor k, v  in   pairs\nq := y  contains   z\n',
    );
  });

  it.each(["!", "-", "+", "~", "++", "--"])("attaches unary %s to its operand", (op) => {
    fmtOnce(`x:= ${op} y\nreturn ${op} z\n`, `x := ${op}y\nreturn ${op}z\n`);
  });

  it("keeps unary signs after throw attached to their operand", () => {
    fmtOnce("throw -x\nthrow +x\n", "throw -x\nthrow +x\n");
    fmtOnce("throw - x\nthrow +  y\n", "throw -x\nthrow +y\n");
  });

  it.each(["--", "++", "!", "~"])("attaches unary %s after throw", (op) => {
    fmtOnce(`throw ${op} x\n`, `throw ${op}x\n`);
  });

  it("leaves throw values other than unary signs unchanged", () => {
    fmtOnce('throw Error("bad")\n', 'throw Error("bad")\n');
  });

  it("attaches unary operators after word binary operators", () => {
    fmtOnce("x := a and -b\n", "x := a and -b\n");
    fmtOnce("x := a and -  b\n", "x := a and -b\n");
    fmtOnce("x := a or --  b\n", "x := a or --b\n");
    fmtOnce("x := value is  +y\n", "x := value is +y\n");
    fmtOnce("x := a AND -  b\n", "x := a AND -b\n");
    fmtOnce("x := a and ~  b\nx := f(a, b and !  c)\n", "x := a and ~b\nx := f(a, b and !c)\n");
    fmtOnce("x := a and\n    -  b\n", "x := a and\n    -b\n");
    fmtOnce("x := a AND\n    --  b\n", "x := a AND\n    --b\n");
  });

  it("keeps member word lookalikes binary before signs", () => {
    fmtOnce("x := obj.and -  b\ny := obj.is +  z\n", "x := obj.and - b\ny := obj.is + z\n");
  });

  it("attaches a prefix & to its operand", () => {
    fmtOnce("x := &  y\n", "x := &y\n");
    fmtOnce("x := &y\n", "x := &y\n");
    fmtOnce("f( & x )\n", "f(&x)\n");
    fmtOnce("f(&x, & y)\n", "f(&x, &y)\n");
    fmtOnce("f(a, & b)\n", "f(a, &b)\n");
    fmtOnce("MouseGetPos(& MouseX, &MouseY)\n", "MouseGetPos(&MouseX, &MouseY)\n");
    fmtOnce("MouseGetPos(&MouseX, &MouseY)\n", "MouseGetPos(&MouseX, &MouseY)\n");
  });

  it("spaces an infix & like other binary operators", () => {
    fmtOnce("a  &   b\n", "a & b\n");
    fmtOnce("a & b\n", "a & b\n");
    fmtOnce("a &b\n", "a & b\n");
    fmtOnce("x := mask &  flag\n", "x := mask & flag\n");
  });

  it("keeps && and &= tokens separate from &", () => {
    fmtOnce("x := a  &&   b\n", "x := a && b\n");
    fmtOnce("x := a &&b\n", "x := a && b\n");
    fmtOnce("x&=  2\n", "x &= 2\n");
  });

  it("keeps unary & after throw attached to its operand", () => {
    fmtOnce("throw &x\n", "throw &x\n");
    fmtOnce("throw & x\n", "throw &x\n");
  });

  it("resolves & at continuation-line starts by position", () => {
    fmtOnce("x := a\n    &   b\n", "x := a\n    & b\n");
    fmtOnce("x := a and\n    &  b\n", "x := a and\n    &b\n");
  });

  it("formats & inside hotkey actions within #HotIf", () => {
    fmtOnce(
      "#HotIf active\n    a::MouseGetPos(& x, &y)\n    b::m := a  &   b\n#HotIf\n",
      "#HotIf active\n    a::MouseGetPos(&x, &y)\n    b::m := a & b\n#HotIf\n",
    );
  });

  it("keeps gaps around the word not", () => {
    fmtOnce("x := not  y\nx := not z\nx := not(w)\n", "x := not  y\nx := not z\nx := not(w)\n");
  });

  it("applies the following token's rules after postfix operators", () => {
    fmtOnce("x++  +  z\n", "x++ + z\n");
    fmtOnce("x++ + z\n", "x++ + z\n");
    fmtOnce("y--  -  w\n", "y-- - w\n");
    fmtOnce("m := a ? b++  : c\n", "m := a ? b++ : c\n");
    fmtOnce("f(x++  ,  y)\n", "f(x++, y)\n");
    fmtOnce("x++  y\n", "x++  y\n");
  });

  it("keeps new v2 operators as single tokens", () => {
    fmtOnce(
      "x := a >>> b\ny := a >> b\nz := s ~= r\nw := a !== b\nv := a != b\nx >>= 1\ny >>>=  2\n",
      "x := a >>> b\ny := a >> b\nz := s ~= r\nw := a !== b\nv := a != b\nx >>= 1\ny >>>= 2\n",
    );
    fmtOnce("x := a  >>>   b\ns  ~=   r\na   !==   b\n", "x := a >>> b\ns ~= r\na !== b\n");
  });

  it("attaches postfix operators and spaces arrows", () => {
    fmtOnce("x ++\ny --\nf:=( a,b )=>a+b\n", "x++\ny--\nf := (a, b) => a + b\n");
  });
});

describe("format rule 4: commas", () => {
  it("puts one space after a comma and none before", () => {
    fmtOnce('f(a,b)\ng("x" ,"y")\n', 'f(a, b)\ng("x", "y")\n');
  });
});

describe("format rule 5: parentheses", () => {
  it("preserves gaps outside operator, comma, bracket-interior and brace rules", () => {
    const source =
      'MsgBox    "ok"\nf (1)\nf\t(1)\nx := a   b\nx := a\t\tb\nreturn    x\ncase  1 :   f()\nx := a[1]    [2]\nf()    ; comment  \t\n';
    fmtOnce(source, source);
  });

  it("changes specified gaps without changing unrelated gaps on the same line", () => {
    fmtOnce('MsgBox\t\t( 1+2 ) ,  "ok"\n', 'MsgBox\t\t(1 + 2), "ok"\n');
    fmtOnce("f ( a+b )\n", "f (a + b)\n");
    fmtOnce('x := "a"    "b"\n', 'x := "a"    "b"\n');
  });
  it("removes spaces just inside parentheses", () => {
    fmtOnce("if ( a > 0 ) {\n    x := ( 1 )\n}\n", "if (a > 0) {\n    x := (1)\n}\n");
  });

  it("removes interior square bracket spaces", () => {
    fmtOnce("x:=a[ 1 ]\ny:=[ a,b ]\n", "x := a[1]\ny := [a, b]\n");
  });

  it("preserves object contents, including nested expressions and spaces", () => {
    fmtOnce(
      "x:={ x :1+ 2, y: { z : 3 } }\nf( { a : 1,b:2 } )\n",
      "x := { x :1+ 2, y: { z : 3 } }\nf({ a : 1,b:2 })\n",
    );
  });

  it("preserves multiline object whitespace and blank lines", () => {
    const object = "{\n  x :1+ 2,   \n\n\n  y: { z : 3 }\n }";
    fmtOnce(
      "f() {\nx:=" + object + "\ny:=2\n}\n",
      "f() {\n    x := " + object + "\n    y := 2\n}\n",
    );
  });
});

describe("format rule 6: blank lines", () => {
  it("compresses consecutive blank lines to one", () => {
    fmtOnce("a := 1\n\n\n\nb := 2\n", "a := 1\n\nb := 2\n");
  });

  it("keeps a leading blank while compressing consecutive leading blanks", () => {
    fmtOnce("\n\n\nx:=1\n\n\n", "\nx := 1\n");
  });
});

describe("format rule 7: trailing whitespace", () => {
  it("removes trailing whitespace", () => {
    fmtOnce("a := 1   \nb := 2\t\n", "a := 1\nb := 2\n");
  });
});

describe("format rule 8: final newline", () => {
  it("ends the file with a single newline", () => {
    expect(fmt("a := 1")).toBe("a := 1\n");
    expect(fmt("a := 1\n")).toBe("a := 1\n");
  });

  it("keeps empty files unchanged", () => {
    fmtOnce("", "");
  });
});

describe("format rule 9: preserved content", () => {
  it("keeps string literal contents", () => {
    fmtOnce('s := "a,b  :=  ( c )"\n', 's := "a,b  :=  ( c )"\n');
  });

  it("keeps comment contents", () => {
    fmtOnce("x := 1 ; keep   this   spacing\n", "x := 1 ; keep   this   spacing\n");
  });

  it("keeps continuation sections verbatim", () => {
    const src = 's := "\n(LTrim\n    keep   this\n    and  this\n)"\n';
    fmtOnce(src, src);
  });

  it("keeps hotstring definition lines verbatim", () => {
    const src = ':ox?:/ndash::  Send("–")\n::btw::by the   way\n';
    fmtOnce(src, src);
  });

  it("keeps hotkey key parts and formats their action", () => {
    fmtOnce('`; & q::Send("{Q}")\n', '`; & q::Send("{Q}")\n');
    fmtOnce('+q::Send( "^{Left}" )\n', '+q::Send("^{Left}")\n');
  });

  it.each(["", " ", "    ", "\t", " \t  "])("keeps the inline hotkey action gap %j", (gap) => {
    const source = `a::${gap}MsgBox("ok")\n`;
    fmtOnce(source, source);
  });

  it.each(["", "    ", "\t"])("formats action internals without replacing the gap %j", (gap) => {
    fmtOnce(`a::${gap}x:=f( 1,2 )\n`, `a::${gap}x := f(1, 2)\n`);
  });

  it("keeps directive values", () => {
    fmtOnce("    #SingleInstance  Force\n", "#SingleInstance  Force\n");
    fmtOnce('    #HotIf  !WinActive("x")\n', '#HotIf  !WinActive("x")\n');
  });

  it("preserves block comments including blank and trailing whitespace", () => {
    const comment = "  /*  keep  \n\n\n  x = 1\t\n  */   \n";
    fmtOnce("f() {\n" + comment + "x:=1\n}\n", "f() {\n" + comment + "    x := 1\n}\n");
  });

  it("preserves trailing whitespace in line comments", () => {
    fmtOnce("x:=1 ; keep  \t\n; keep  \t\n", "x := 1 ; keep  \t\n; keep  \t\n");
  });

  it("preserves all continuation-section blank lines and trailing spaces", () => {
    const section = 's := "\n(LTrim\n  content   \n\n\n  more\t\n)"\n';
    fmtOnce(section, section);
  });

  it("preserves hotstring replacement text even when it resembles invalid AHK", () => {
    const src = '::text::x = 1  "unterminated /*   \t\n::next::MsgBox, hello\n';
    fmtOnce(src, src);
  });

  it("keeps percent triggers and formats executable hotkey actions", () => {
    fmtOnce("%::x:=1+2\n::percent%::100%  \n", "%::x := 1 + 2\n::percent%::100%  \n");
  });
});

describe("format: conditional definitions", () => {
  it("indents definitions and bodies inside active #HotIf regions", () => {
    fmtOnce(
      '#HotIf WinActive("a")\n    ~s:: {\n        Send("1")\n    }\n    #HotIf\n',
      '#HotIf WinActive("a")\n    ~s:: {\n        Send("1")\n    }\n#HotIf\n',
    );
  });

  it.each(["", "    ", "\t"])("keeps action gaps %j through active and bare #HotIf", (gap) => {
    const source = `#HotIf active\n    a::${gap}MsgBox("ok")\n#HotIf\nb::${gap}MsgBox("ok")\n`;
    fmtOnce(source, source);
  });

  it.each(["", "    ", "\t"])(
    "applies OTB brace spacing rather than inline gap preservation for %j",
    (gap) => {
      fmtOnce(`a::${gap}{\nx:=1\n}\n`, "a:: {\n    x := 1\n}\n");
      fmtOnce(
        `#HotIf active\na::${gap}\n{\nx:=1\n}\n#HotIf\n`,
        "#HotIf active\n    a:: {\n        x := 1\n    }\n#HotIf\n",
      );
    },
  );

  it("formats word operators and unary signs in hotkey actions inside #HotIf", () => {
    fmtOnce(
      "#HotIf active\n    a::x := y or --  z\n    b::x := y and -z\n#HotIf\n",
      "#HotIf active\n    a::x := y or --z\n    b::x := y and -z\n#HotIf\n",
    );
  });

  it("keeps stacked hotkey definitions", () => {
    const src = "^t::\n^l:: {\n    Send(A_ThisHotkey)\n}\n";
    fmtOnce(src, src);
  });

  it("resets definition and body indentation at bare #HotIf", () => {
    fmtOnce(
      "#HotIf active\na::\nb::\n{\nx:=1\nif x {\ny:=2\n}\n}\n::text::literal   \n#HotIf ; reset\nc:: {\nz:=3\n}\n",
      "#HotIf active\n    a::\n    b:: {\n        x := 1\n        if x {\n            y := 2\n        }\n    }\n    ::text::literal   \n#HotIf ; reset\nc:: {\n    z := 3\n}\n",
    );
  });

  it("indents statements, comments, labels and directives inside active #HotIf regions", () => {
    fmtOnce(
      [
        '#HotIf WinActive("a")',
        "global g := 0",
        "; comment",
        "#InputLevel 1",
        "f() {",
        "return g",
        "}",
        "mylabel:",
        "g := 1",
        "#HotIf",
        "g := 2",
      ].join("\n") + "\n",
      [
        '#HotIf WinActive("a")',
        "    global g := 0",
        "    ; comment",
        "    #InputLevel 1",
        "    f() {",
        "        return g",
        "    }",
        "    mylabel:",
        "    g := 1",
        "#HotIf",
        "g := 2",
      ].join("\n") + "\n",
    );
  });

  it("returns to column 0 between regions and re-indents in the next one", () => {
    fmtOnce(
      "#HotIf a\ng := 1\n#HotIf\ng := 2\n#HotIf b\ng := 3\n#HotIf\n",
      "#HotIf a\n    g := 1\n#HotIf\ng := 2\n#HotIf b\n    g := 3\n#HotIf\n",
    );
  });

  it("formats multiline hotstring bodies without rewriting definition lines", () => {
    fmtOnce(
      "#HotIf active\n:X:go::\n{\nx:=1\n}\n#HotIf\n",
      "#HotIf active\n    :X:go::\n    {\n        x := 1\n    }\n#HotIf\n",
    );
  });

  it("unindents labels and directives without losing directive values", () => {
    fmtOnce(
      "f() {\n    Label:\n      #Include  %A_ScriptDir%\\lib.ahk   \nx:=1\n}\n",
      "f() {\nLabel:\n#Include  %A_ScriptDir%\\lib.ahk   \n    x := 1\n}\n",
    );
  });
});

describe("format: spec sample", () => {
  it("formats the spec example", () => {
    fmtOnce(
      "MyFunc(a,b) {\n    if (a>0) {\n        x:=b\n    } else {\n        x:=0\n    }\n    return x\n}\n",
      "MyFunc(a, b) {\n    if (a > 0) {\n        x := b\n    } else {\n        x := 0\n    }\n    return x\n}\n",
    );
  });
});

describe("format: tokenize errors", () => {
  it("refuses files with unterminated strings", () => {
    const result = formatSource(splitLines('s := "abc\nx := 1\n'));
    expect(result.error).toBeDefined();
    expect(result.lines).toEqual(['s := "abc', "x := 1"]);
  });
});
