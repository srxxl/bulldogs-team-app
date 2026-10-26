import { describe, expect, it } from "vitest";
import { greeting, type MascotState, nextStep, reactToTap } from "./mascot";

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};
const standing: MascotState = { pose: "stand", x: 50, facing: "right", say: null };

describe("mascot behaviour", () => {
  it("walks a real distance, faces where it's going and stays on stage", () => {
    for (let i = 0; i < 200; i++) {
      const step = nextStep({ ...standing, x: (i * 7) % 101 }, Math.random);
      expect(step.x).toBeGreaterThanOrEqual(0);
      expect(step.x).toBeLessThanOrEqual(100);
      if (step.pose === "walk") {
        expect(Math.abs(step.x - ((i * 7) % 101))).toBeGreaterThanOrEqual(20);
        expect(step.facing).toBe(step.x > (i * 7) % 101 ? "right" : "left");
      }
    }
  });

  it("doesn't repeat a resting pose twice in a row", () => {
    for (let i = 0; i < 200; i++) {
      const sitting: MascotState = { ...standing, pose: "sit" };
      expect(nextStep(sitting, Math.random).pose).not.toBe("sit");
    }
  });

  it("wakes up when tapped while asleep", () => {
    const step = reactToTap({ ...standing, pose: "sleep" }, seq(0));
    expect(step.pose).toBe("hop");
    expect(step.say).toMatch(/up/);
  });

  it("greets by first name", () => {
    expect(greeting("Mia").say).toBe("G'day, Mia!");
  });
});
