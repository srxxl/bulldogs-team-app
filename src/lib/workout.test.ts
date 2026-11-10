import { describe, expect, it } from "vitest";
import { formatDistance, formatDuration, formatPace, parseDuration, teamTotals } from "./workout";

describe("workout", () => {
  it("reads times the way people type them", () => {
    expect(parseDuration("32")).toBe(32 * 60);
    expect(parseDuration("32:15")).toBe(32 * 60 + 15);
    expect(parseDuration(" 1:02:30 ")).toBe(3600 + 150);
    expect(parseDuration("5:75")).toBeNull();
    expect(parseDuration("half an hour")).toBeNull();
    expect(parseDuration("")).toBeNull();
  });

  it("shows distances in km, or metres under a kilometre", () => {
    expect(formatDistance(5230)).toBe("5.2 km");
    expect(formatDistance(10000)).toBe("10 km");
    expect(formatDistance(800)).toBe("800 m");
  });

  it("shows times and pace", () => {
    expect(formatDuration(1935)).toBe("32:15");
    expect(formatDuration(3750)).toBe("1:02:30");
    expect(formatPace(5000, 1860)).toBe("6:12 /km");
    expect(formatPace(300, 120)).toBeNull();
  });

  it("adds up the team's week", () => {
    expect(
      teamTotals([
        { userId: "a", distanceM: 5000, durationS: 1800 },
        { userId: "b", distanceM: null, durationS: 2400 },
        { userId: "a", distanceM: 3000, durationS: null },
      ]),
    ).toEqual({ people: 2, distanceM: 8000, durationS: 4200 });
  });
});
