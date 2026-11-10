import { describe, expect, it } from "vitest";
import { gamesRun, type RunGame, roundNumber, seasonRun } from "./season-run";

const now = new Date("2026-10-28T00:00:00Z");
const game = (
  round: string | null,
  day: number,
  score: [number, number] | null = null,
  cancelled = false,
): RunGame => ({
  id: `${round}-${day}`,
  href: `/fixture/${round}-${day}`,
  round,
  startsAt: new Date(Date.UTC(2026, 9, day)),
  cancelled,
  score: score && { ours: score[0], theirs: score[1] },
});

describe("season run", () => {
  it("reads round numbers", () => {
    expect(roundNumber("Round 7")).toBe(7);
    expect(roundNumber("R12")).toBe(12);
    expect(roundNumber("Grand Final")).toBeNull();
    expect(roundNumber(null)).toBeNull();
  });

  it("lays out every round: results, byes, the next game and the rest", () => {
    const run = seasonRun(
      [
        game("Round 1", 3, [40, 33]),
        game("Round 2", 10, [20, 41]),
        game("Round 4", 24, [30, 30]),
        game("Round 5", 31),
        game("Round 6", 38),
        game("Grand Final", 50),
      ],
      now,
    );
    expect(run.map((s) => [s.label, s.kind])).toEqual([
      ["1", "played"],
      ["2", "played"],
      ["3", "bye"],
      ["4", "played"],
      ["5", "upcoming"],
      ["6", "upcoming"],
      ["GF", "upcoming"],
    ]);
    expect(run[0]).toMatchObject({ result: "W", margin: 7, opponent: null });
    expect(run[1]).toMatchObject({ result: "L", margin: -21 });
    expect(run[3]).toMatchObject({ result: "D", margin: 0 });
    expect(run.filter((s) => s.kind === "upcoming" && s.next).map((s) => s.label)).toEqual(["5"]);
  });

  it("leaves out cancelled games, and shows a past game with no score yet", () => {
    const run = seasonRun([game("Round 1", 3, null, true), game("Round 2", 10)], now);
    expect(run.map((s) => s.kind)).toEqual(["bye", "unscored"]);
  });

  it("lays out a run of games against one club in date order", () => {
    const run = gamesRun([game("Round 9", 20, [10, 30]), game("Round 2", 2, [50, 20])], (g) => g.round ?? "", now);
    expect(run.map((s) => s.label)).toEqual(["Round 2", "Round 9"]);
  });
});
