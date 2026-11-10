import { describe, expect, it } from "vitest";
import { bestStreak, currentStreak, type HoopWeek, hoop, weeksBetween } from "./hoops";

const week = (w: string, picks: string[], mine: string[], km = 0): HoopWeek => ({
  week: w,
  picks: picks.map((pinId) => ({ pinId, board: pinId.startsWith("n") ? "nutrition" : "fitness" })),
  mine: mine.map((pinId, i) => ({ pinId, distanceM: i === 0 ? km * 1000 : null })),
});

describe("hoops", () => {
  it("closes when every pick is done", () => {
    expect(hoop(week("2026-11-09", ["a", "b", "n1"], ["a", "n1"]))).toEqual({ total: 3, done: 2, closed: false });
    expect(hoop(week("2026-11-09", ["a", "b"], ["b", "a"])).closed).toBe(true);
    expect(hoop(week("2026-11-09", [], [])).closed).toBe(false);
  });

  it("counts a streak back from now, keeping it alive until this week is done", () => {
    const weeks = [
      week("2026-10-19", ["a"], []),
      week("2026-10-26", ["b"], ["b"]),
      // nothing picked: neither breaks nor adds
      week("2026-11-02", [], []),
      week("2026-11-02", ["c"], ["c"]),
      week("2026-11-09", ["d", "e"], ["d"]),
    ];
    expect(currentStreak(weeks, "2026-11-09")).toBe(2);
    weeks[4] = week("2026-11-09", ["d", "e"], ["d", "e"]);
    expect(currentStreak(weeks, "2026-11-09")).toBe(3);
    expect(currentStreak([week("2026-11-02", ["a"], []), week("2026-11-09", ["b"], [])], "2026-11-09")).toBe(0);
  });

  it("finds the best run", () => {
    const weeks = ["10-05", "10-12", "10-19", "10-26", "11-02"].map((d, i) =>
      week(`2026-${d}`, ["x"], i === 2 ? [] : ["x"]),
    );
    expect(bestStreak(weeks)).toBe(2);
  });

  it("lists the Mondays between two weeks", () => {
    expect(weeksBetween("2026-10-19", "2026-11-09")).toEqual(["2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09"]);
  });
});
