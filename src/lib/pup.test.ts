import { describe, expect, it } from "vitest";
import { PUP_COOLDOWN_MS, planVisit, shouldVisit, TRICKS } from "./pup";

describe("pup easter egg", () => {
  it("honours a forced trick and ignores unknown ones", () => {
    expect(planVisit(() => 0.99, "nap").trick).toBe("nap");
    expect(TRICKS).toContain(planVisit(() => 0.3, "backflip").trick);
  });

  it("keeps the pup inside the screen", () => {
    expect(planVisit(() => 0).x).toBe(8);
    expect(planVisit(() => 0.999).x).toBeLessThanOrEqual(84);
  });

  it("waits out the cooldown and only shows on a lucky roll", () => {
    expect(shouldVisit(1000, null, 0.1)).toBe(true);
    expect(shouldVisit(1000, null, 0.9)).toBe(false);
    expect(shouldVisit(PUP_COOLDOWN_MS - 1, 0, 0.1)).toBe(false);
    expect(shouldVisit(PUP_COOLDOWN_MS, 0, 0.1)).toBe(true);
  });
});
