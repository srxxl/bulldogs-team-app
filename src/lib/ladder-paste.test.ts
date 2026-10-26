import { describe, expect, it } from "vitest";
import { parseLadderPaste } from "./ladder-paste";

describe("parseLadderPaste", () => {
  it("parses tab-separated rows", () => {
    const text = [
      "Pos\tTeam\tP\tW\tL\tD\tB\tF\tA\t%\tPTS",
      "1\tBayswater (WC3)\t14\t12\t2\t0\t1\t620\t210\t295.24\t52",
      "2\tBrentwood Booragoon (WC3)\t14\t10\t4\t0\t1\t480\t300\t160.00\t44",
    ].join("\n");
    const r = parseLadderPaste(text);
    expect("rows" in r && r.rows[1]).toEqual({
      position: 2,
      team: "Brentwood Booragoon (WC3)",
      played: 14,
      won: 10,
      lost: 4,
      drawn: 0,
      pointsFor: 480,
      pointsAgainst: 300,
      percentage: 160,
      premiershipPoints: 44,
    });
  });

  it("parses one-cell-per-line copies with a form column", () => {
    const text = "#\nTeam\nP\nW\nL\nD\nPF\nPA\n%\nPTS\nForm\n1\nKingsway\n3\n3\n0\n0\n90\n30\n300%\n12\nW\nW\nW\n";
    const r = parseLadderPaste(text);
    expect("rows" in r && r.rows[0]).toMatchObject({
      team: "Kingsway",
      premiershipPoints: 12,
      percentage: 300,
    });
  });

  it("explains what went wrong", () => {
    expect(parseLadderPaste("hello")).toEqual({
      error: expect.stringMatching(/header/),
    });
  });
});
