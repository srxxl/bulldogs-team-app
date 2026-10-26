import { describe, expect, it } from "vitest";
import { upcomingTrainingSlots } from "./training";

describe("upcomingTrainingSlots", () => {
  it("returns Tue + Thu 6pm Perth sessions", () => {
    // Monday 3 May 2027, 9am Perth
    const slots = upcomingTrainingSlots(new Date("2027-05-03T01:00:00Z"), 14);
    expect(slots.map((s) => s.startsAt.toISOString())).toEqual([
      "2027-05-04T10:00:00.000Z",
      "2027-05-06T10:00:00.000Z",
      "2027-05-11T10:00:00.000Z",
      "2027-05-13T10:00:00.000Z",
    ]);
    expect(slots[0].endsAt.toISOString()).toBe("2027-05-04T11:30:00.000Z");
  });

  it("skips a session that has already started today", () => {
    const slots = upcomingTrainingSlots(new Date("2027-05-04T10:30:00Z"), 2);
    expect(slots).toEqual([]);
  });
});
