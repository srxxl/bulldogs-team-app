import { describe, expect, it } from "vitest";
import { teamSheetMessage } from "./team-sheet";

describe("team sheet message", () => {
  it("counts down to naming a team, then to a full 18", () => {
    expect(teamSheetMessage(13)).toBe("One more and we can name a team. Five more for a full 18.");
    expect(teamSheetMessage(0)).toBe("14 more and we can name a team. 18 more for a full 18.");
    expect(teamSheetMessage(15)).toBe("We can name a team. Three more for a full 18.");
  });

  it("then fills the bench up to the full team sheet", () => {
    expect(teamSheetMessage(18)).toBe("A full 18 on the ground. Nobody on the bench yet.");
    expect(teamSheetMessage(20)).toBe("A full 18 on the ground, with 2 on the bench so far.");
    expect(teamSheetMessage(22)).toBe("A full team sheet: 22 in.");
    expect(teamSheetMessage(24)).toBe("A full team sheet, with 2 more than can be named.");
  });
});
