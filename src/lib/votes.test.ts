import { describe, expect, it } from "vitest";
import { tally, validateBallot, voteWindow } from "./votes";

const start = new Date("2027-05-01T06:00:00Z");
const h = (n: number) => new Date(start.getTime() + n * 3600_000);

describe("voteWindow", () => {
  it("opens two hours after the bounce and closes four days later", () => {
    expect(voteWindow(start, h(1))).toBe("before");
    expect(voteWindow(start, h(2))).toBe("open");
    expect(voteWindow(start, h(2 + 95))).toBe("open");
    expect(voteWindow(start, h(2 + 96))).toBe("closed");
  });
});

describe("validateBallot", () => {
  const squad = new Set(["a", "b", "c", "me"]);
  it("accepts three different teammates", () => {
    expect(validateBallot({ three: "a", two: "b", one: "c" }, "me", squad)).toBeNull();
  });
  it("rejects duplicates, self votes and outsiders", () => {
    expect(validateBallot({ three: "a", two: "a", one: "c" }, "me", squad)).toMatch(/different/);
    expect(validateBallot({ three: "me", two: "a", one: "b" }, "me", squad)).toMatch(/yourself/);
    expect(validateBallot({ three: "x", two: "a", one: "b" }, "me", squad)).toMatch(/played this game/);
    expect(validateBallot({ three: "", two: "a", one: "b" }, "me", squad)).toMatch(/Pick/);
  });
});

describe("tally", () => {
  it("sorts by points then 3-vote count", () => {
    const rows = [
      { eventId: "g1", nomineeId: "a", points: 3 },
      { eventId: "g1", nomineeId: "b", points: 2 },
      { eventId: "g2", nomineeId: "b", points: 1 },
      { eventId: "g2", nomineeId: "c", points: 3 },
    ];
    expect(tally(rows).map((r) => [r.userId, r.points, r.games])).toEqual([
      ["a", 3, 1],
      ["c", 3, 1],
      ["b", 3, 2],
    ]);
  });
});
