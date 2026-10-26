import { describe, expect, it } from "vitest";
import { dayKey, formatTime, fromLocalInput, monthGrid, perthAt, relativeDay, toLocalInput } from "./time";

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

describe("monthGrid", () => {
  it("builds Monday-first weeks for the Perth month", () => {
    // 1 May 2027 is a Saturday
    const weeks = monthGrid(new Date("2027-05-10T04:00:00Z"), new Date("2027-05-10T04:00:00Z"));
    expect(weeks[0].map((d) => d.key)).toEqual([
      "2027-04-26",
      "2027-04-27",
      "2027-04-28",
      "2027-04-29",
      "2027-04-30",
      "2027-05-01",
      "2027-05-02",
    ]);
    expect(weeks[0][5]).toMatchObject({ day: 1, inMonth: true });
    expect(
      weeks
        .flat()
        .filter((d) => d.isToday)
        .map((d) => d.key),
    ).toEqual(["2027-05-10"]);
    expect(weeks.at(-1)?.at(-1)?.key).toBe("2027-06-06");
  });

  it("keys instants by Perth date, not UTC", () => {
    expect(dayKey(new Date("2027-05-01T17:00:00Z"))).toBe("2027-05-02"); // 1am Perth
  });
});
