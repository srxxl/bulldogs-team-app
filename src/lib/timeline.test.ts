import { describe, expect, it } from "vitest";
import { currentStep, DEFAULT_TIMELINE, isDefault, scheduled, timelineFor, timelineSchema } from "./timeline";

// 2:10pm Perth
const bounce = new Date("2026-11-14T06:10:00Z");

describe("timeline", () => {
  it("starts an hour and a half before bounce and ends at bounce", () => {
    const s = scheduled(DEFAULT_TIMELINE, bounce);
    expect(s[0]).toMatchObject({ label: "Arrive", at: new Date("2026-11-14T04:40:00Z") });
    expect(s.at(-1)).toMatchObject({ label: "Bounce", at: bounce, until: null });
    expect(s[1].until).toEqual(s[2].at);
  });

  it("falls back to the default when a game has none or a broken one", () => {
    expect(timelineFor(null)).toEqual(DEFAULT_TIMELINE);
    expect(timelineFor([{ label: "", minutesBefore: 5 }])).toEqual(DEFAULT_TIMELINE);
    const own = [
      { label: "Bounce", minutesBefore: 0 },
      { label: "Arrive", minutesBefore: 60 },
    ];
    expect(timelineFor(own).map((s) => s.label)).toEqual(["Arrive", "Bounce"]);
    expect(isDefault(timelineFor(own))).toBe(false);
    expect(isDefault([...DEFAULT_TIMELINE].reverse())).toBe(true);
  });

  it("knows which step is on now", () => {
    expect(currentStep(DEFAULT_TIMELINE, bounce, new Date("2026-11-14T04:30:00Z"))).toBeNull();
    expect(currentStep(DEFAULT_TIMELINE, bounce, new Date("2026-11-14T04:40:00Z"))).toBe(0);
    // 1:12pm: coach talk started at 1:10pm
    expect(DEFAULT_TIMELINE[currentStep(DEFAULT_TIMELINE, bounce, new Date("2026-11-14T05:12:00Z")) ?? 0].label).toBe(
      "Coach",
    );
    expect(currentStep(DEFAULT_TIMELINE, bounce, new Date("2026-11-14T06:20:00Z"))).toBeNull();
  });

  it("rejects steps after bounce or without a name", () => {
    expect(timelineSchema.safeParse([{ label: "Party", minutesBefore: -10 }]).success).toBe(false);
    expect(timelineSchema.safeParse([{ label: " ", minutesBefore: 10 }]).success).toBe(false);
    expect(timelineSchema.safeParse([]).success).toBe(false);
  });
});
