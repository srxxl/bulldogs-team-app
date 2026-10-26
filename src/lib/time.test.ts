import { describe, expect, it } from "vitest";
import { formatTime, fromLocalInput, perthAt, relativeDay, toLocalInput } from "./time";

describe("time", () => {
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
