import { describe, expect, it } from "vitest";
import { formatScore, headToHead } from "./score";

describe("score", () => {
  it("formats goals.behinds (points)", () => {
    expect(formatScore({ goals: 7, behinds: 5 })).toBe("7.5 (47)");
  });

  it("builds a head-to-head record, skipping unplayed games", () => {
    const h = headToHead([
      { teamGoals: 5, teamBehinds: 4, oppGoals: 3, oppBehinds: 2 },
      { teamGoals: 2, teamBehinds: 1, oppGoals: 2, oppBehinds: 1 },
      { teamGoals: null, teamBehinds: null, oppGoals: null, oppBehinds: null },
    ]);
    expect(h).toEqual({
      played: 2,
      won: 1,
      lost: 0,
      drawn: 1,
      for: 47,
      against: 33,
    });
  });
});
