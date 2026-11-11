import { describe, expect, it } from "vitest";
import { pickOfTheDay } from "./daily";

const items = Array.from({ length: 12 }, (_, i) => ({ id: `recipe-${i}` }));

describe("pickOfTheDay", () => {
  it("is nothing when there's nothing to pick", () => {
    expect(pickOfTheDay([], "2026-11-11")).toBeUndefined();
  });

  it("is the same all day, whatever order the items come in", () => {
    const a = pickOfTheDay(items, "2026-11-11");
    expect(pickOfTheDay([...items].reverse(), "2026-11-11")).toBe(a);
  });

  it("changes from day to day", () => {
    const days = Array.from({ length: 14 }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`);
    const picks = new Set(days.map((d) => pickOfTheDay(items, d)?.id));
    expect(picks.size).toBeGreaterThan(5);
  });

  it("keeps today's pick when another item is added, unless the new one wins", () => {
    const today = pickOfTheDay(items, "2026-11-11");
    const added = { id: "recipe-new" };
    const after = pickOfTheDay([...items, added], "2026-11-11");
    expect([today, added]).toContain(after);
  });
});
