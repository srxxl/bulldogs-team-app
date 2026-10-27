import { describe, expect, it } from "vitest";
import { fetchBall, type MascotState, moveTo, nextSteps, reactToTap, spin, TURN_MS } from "./mascot";

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};
const standing: MascotState = { pose: "stand", x: 50, facing: "right" };

describe("mascot behaviour", () => {
  it("walks a real distance, faces where it's going and stays on stage", () => {
    for (let i = 0; i < 200; i++) {
      const from = { ...standing, x: (i * 7) % 101 };
      const steps = nextSteps(from, Math.random);
      const last = steps[steps.length - 1];
      expect(last.x).toBeGreaterThanOrEqual(0);
      expect(last.x).toBeLessThanOrEqual(100);
      if (last.pose === "walk") {
        expect(Math.abs(last.x - from.x)).toBeGreaterThanOrEqual(20);
        expect(last.facing).toBe(last.x > from.x ? "right" : "left");
      }
    }
  });

  it("turns through the slight-turn stance before changing direction", () => {
    const steps = moveTo({ ...standing, facing: "right" }, 10);
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ pose: "turn", facing: "left", x: 50, ms: TURN_MS });
    expect(steps[1]).toMatchObject({ pose: "walk", facing: "left", x: 10 });
  });

  it("doesn't turn when it keeps going the same way", () => {
    expect(moveTo({ ...standing, facing: "right" }, 90)).toHaveLength(1);
  });

  it("doesn't repeat a resting pose twice in a row", () => {
    for (let i = 0; i < 200; i++) {
      const sitting: MascotState = { ...standing, pose: "sit" };
      expect(nextSteps(sitting, Math.random).at(-1)?.pose).not.toBe("sit");
    }
  });

  it("runs to a thrown footy, faster than walking, picks it up and shows it off", () => {
    const steps = fetchBall({ ...standing, x: 20, facing: "right" }, 80);
    expect(steps.map((s) => s.pose)).toEqual(["run", "hold", "show"]);
    expect(steps[0].ms).toBeLessThan(moveTo({ ...standing, x: 20 }, 80)[0].ms);
    expect(steps[1]).toMatchObject({ x: 80 });
    expect(steps[2]).toMatchObject({ x: 80 });
  });

  it("spins all the way round and ends up facing the same way", () => {
    const steps = spin({ ...standing, facing: "left" });
    expect(steps.map((s) => s.pose)).toEqual(["turn", "stand", "turn", "stand"]);
    expect(steps.map((s) => s.facing)).toEqual(["right", "right", "left", "left"]);
    expect(steps.every((s) => s.x === 50)).toBe(true);
  });

  it("wakes up when tapped while asleep", () => {
    const [step] = reactToTap({ ...standing, pose: "sleep" }, seq(0));
    expect(step.pose).toBe("hop");
  });
});
