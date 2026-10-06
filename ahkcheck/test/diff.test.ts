import { describe, expect, it } from "vite-plus/test";
import { splitKeepEnds, unifiedDiff } from "../src/diff.ts";

describe("splitKeepEnds", () => {
  it("keeps endings and exposes a missing final newline", () => {
    expect(splitKeepEnds("")).toEqual([]);
    expect(splitKeepEnds("\n")).toEqual(["\n"]);
    expect(splitKeepEnds("a\nb\n")).toEqual(["a\n", "b\n"]);
    expect(splitKeepEnds("a\r\nb\r\n")).toEqual(["a\r\n", "b\r\n"]);
    expect(splitKeepEnds("a\nb")).toEqual(["a\n", "b"]);
  });
});

describe("unifiedDiff", () => {
  it("returns [] for equal inputs", () => {
    expect(unifiedDiff(["a\n", "b\n"], ["a\n", "b\n"], "f.ahk")).toEqual([]);
  });

  it("renders a single-line replacement with a count-1 range", () => {
    expect(unifiedDiff(["x:=1\n"], ["x := 1\n"], "f.ahk")).toEqual([
      "--- f.ahk",
      "+++ f.ahk",
      "@@ -1 +1 @@",
      "-x:=1",
      "+x := 1",
    ]);
  });

  it("renders 3-line context around a middle change", () => {
    const a = ["l1\n", "l2\n", "l3\n", "l4\n", "l5\n", "l6\n", "l7\n", "l8\n", "l9\n", "l10\n"];
    const b = [...a];
    b[4] = "changed\n";
    expect(unifiedDiff(a, b, "f.ahk")).toEqual([
      "--- f.ahk",
      "+++ f.ahk",
      "@@ -2,7 +2,7 @@",
      " l2",
      " l3",
      " l4",
      "-l5",
      "+changed",
      " l6",
      " l7",
      " l8",
    ]);
  });

  it("marks a missing final newline on the removed side", () => {
    expect(unifiedDiff(["x := 1"], ["x := 1\n"], "f.ahk")).toEqual([
      "--- f.ahk",
      "+++ f.ahk",
      "@@ -1 +1 @@",
      "-x := 1",
      "\\ No newline at end of file",
      "+x := 1",
    ]);
  });

  it("appends a line with leading context", () => {
    expect(unifiedDiff(["a\n"], ["a\n", "b\n"], "f.ahk")).toEqual([
      "--- f.ahk",
      "+++ f.ahk",
      "@@ -1 +1,2 @@",
      " a",
      "+b",
    ]);
  });

  it("renders an empty old side as a zero range", () => {
    expect(unifiedDiff([], ["a\n", "b\n"], "f.ahk")).toEqual([
      "--- f.ahk",
      "+++ f.ahk",
      "@@ -0,0 +1,2 @@",
      "+a",
      "+b",
    ]);
  });

  it("keeps a CR so CRLF-vs-LF differences stay visible", () => {
    expect(unifiedDiff(["x := 1\r\n"], ["x := 1\n"], "f.ahk")).toEqual([
      "--- f.ahk",
      "+++ f.ahk",
      "@@ -1 +1 @@",
      "-x := 1\r",
      "+x := 1",
    ]);
  });

  it("splits distant changes into separate hunks", () => {
    const a = ["c\n", ...Array.from({ length: 10 }, (_, i) => `x${i + 1}\n`), "d\n"];
    const b = [...a];
    b[1] = "y\n";
    b[10] = "z\n";
    expect(unifiedDiff(a, b, "f.ahk")).toEqual([
      "--- f.ahk",
      "+++ f.ahk",
      "@@ -1,5 +1,5 @@",
      " c",
      "-x1",
      "+y",
      " x2",
      " x3",
      " x4",
      "@@ -8,5 +8,5 @@",
      " x7",
      " x8",
      " x9",
      "-x10",
      "+z",
      " d",
    ]);
  });
});
