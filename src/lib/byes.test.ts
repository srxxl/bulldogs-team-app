import { describe, expect, it } from "vitest";
import { findByes } from "./byes";

const sat = (day: number) => new Date(Date.UTC(2026, 9, day, 4, 20));

describe("byes", () => {
  it("finds the rounds we don't play, dated the week after the game before", () => {
    const byes = findByes([
      { round: "Round 1", startsAt: sat(3) },
      { round: "Round 2", startsAt: sat(10) },
      { round: "Round 4", startsAt: sat(24) },
      { round: "Grand Final", startsAt: sat(31) },
    ]);
    expect(byes).toEqual([{ round: "Round 3", startsAt: sat(17) }]);
  });

  it("finds back-to-back byes, and none in a full run", () => {
    expect(
      findByes([
        { round: "Round 1", startsAt: sat(3) },
        { round: "Round 4", startsAt: sat(24) },
      ]).map((b) => b.round),
    ).toEqual(["Round 2", "Round 3"]);
    expect(
      findByes([
        { round: "Round 1", startsAt: sat(3) },
        { round: "Round 2", startsAt: sat(10) },
      ]),
    ).toEqual([]);
  });
});
