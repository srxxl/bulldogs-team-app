import { describe, expect, it } from "vitest";
import { formatTime, fromLocalInput, perthAt, perthWeekStart, relativeDay, seasonStart, toLocalInput } from "./time";

describe("time", () => {
  it("starts the week on Monday in Perth", () => {
    // Tuesday 10 November 2026
    expect(perthWeekStart(new Date("2026-11-10T04:00:00Z"))).toBe("2026-11-09");
    // Sunday 11:30pm in Perth is still the same week
    expect(perthWeekStart(new Date("2026-11-15T15:30:00Z"))).toBe("2026-11-09");
    // 4:10pm Sunday UTC is already 12:10am Monday in Perth: a new week
    expect(perthWeekStart(new Date("2026-11-15T16:10:00Z"))).toBe("2026-11-16");
  });

  it("starts the season at midnight on 1 January in Perth", () => {
    // 4pm on 31 December UTC is already New Year's Day in Perth
    expect(seasonStart(new Date("2026-12-31T16:30:00Z")).toISOString()).toBe("2026-12-31T16:00:00.000Z");
    expect(seasonStart(new Date("2026-06-01T00:00:00Z")).toISOString()).toBe("2025-12-31T16:00:00.000Z");
  });

  it("round-trips datetime-local values in Perth time", () => {
    const d = fromLocalInput("2027-04-10T14:10");
    expect(d.toISOString()).toBe("2027-04-10T06:10:00.000Z");
    expect(toLocalInput(d)).toBe("2027-04-10T14:10");
    expect(formatTime(d)).toBe("2:10pm");
  });

  it("builds Perth wall-clock times regardless of server zone", () => {
    const d = perthAt(new Date("2027-04-13T02:00:00Z"), 18);
    expect(d.toISOString()).toBe("2027-04-13T10:00:00.000Z");
  });

  it("describes relative days on the Perth calendar", () => {
    const now = new Date("2027-04-10T15:00:00Z"); // 11pm Sat in Perth
    expect(relativeDay(new Date("2027-04-10T17:00:00Z"), now)).toBe("Tomorrow");
    expect(relativeDay(new Date("2027-04-15T02:00:00Z"), now)).toBe("In 5 days");
  });
});
