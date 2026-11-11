import { describe, expect, it } from "vitest";
import {
  beg,
  fetchBall,
  fetchSpot,
  type MascotState,
  makeRoom,
  moveTo,
  nextSteps,
  PICKUP_MOUTH,
  reactToTap,
  type Step,
  settled,
  spin,
  TAP_ACTIONS,
  TURN_MS,
  turnSitting,
  withTransitions,
} from "./mascot";

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

  it("runs to a thrown footy, faster than walking, picks it up, shows it off and drops it", () => {
    const steps = fetchBall({ ...standing, x: 20, facing: "right" }, 80);
    expect(steps.map((s) => s.pose)).toEqual(["run", "pickup", "hold", "show", "drop"]);
    expect(steps[0].ms).toBeLessThan(moveTo({ ...standing, x: 20 }, 80)[0].ms);
    expect(steps.slice(1).every((s) => s.x === 80 && s.facing === "right")).toBe(true);
  });

  it("stops where its mouth meets the footy, whichever way it's running", () => {
    const stage = 400;
    const dog = 136;
    for (const [from, ball] of [
      [10, 300],
      [90, 60],
    ]) {
      const spot = fetchSpot({ ...standing, x: from }, ball, stage, dog);
      const left = (spot.dogX / 100) * (stage - dog);
      const mouth = spot.facing === "left" ? PICKUP_MOUTH * dog : (1 - PICKUP_MOUTH) * dog;
      expect(spot.facing).toBe(ball > from * 4 ? "right" : "left");
      expect(Math.abs(left + mouth - ball)).toBeLessThan(3);
      expect(spot.ballPx).toBeCloseTo(left + mouth);
    }
  });

  it("moves a footy thrown out of reach to where the dog can get it", () => {
    const spot = fetchSpot({ ...standing, x: 50 }, 2, 400, 136);
    expect(spot.dogX).toBe(0);
    expect(spot.ballPx).toBeCloseTo(PICKUP_MOUTH * 136);
  });

  it("spins all the way round and ends up facing the same way", () => {
    const steps = spin({ ...standing, facing: "left" });
    expect(steps.map((s) => s.pose)).toEqual(["turn", "stand", "turn", "stand"]);
    expect(steps.map((s) => s.facing)).toEqual(["right", "right", "left", "left"]);
    expect(steps.every((s) => s.x === 50)).toBe(true);
  });

  it("wakes up and sits when tapped while asleep", () => {
    expect(reactToTap({ ...standing, pose: "sleep" }, seq(0)).map((s) => s.pose)).toEqual(["sit"]);
  });

  it("begs, play-bows or barks when tapped, begging only when sitting", () => {
    expect(reactToTap({ ...standing, pose: "beg" }).map((s) => s.pose)).toEqual(["beg", "sitside"]);
    for (const pose of ["sit", "sitside"] as const) {
      expect(reactToTap({ ...standing, pose }, seq(0)).map((s) => s.pose)).toEqual(["sitside", "beg", "sitside"]);
      expect(reactToTap({ ...standing, pose }, seq(0.5)).map((s) => s.pose)).toEqual(["play"]);
      expect(reactToTap({ ...standing, pose }, seq(0.9)).map((s) => s.pose)).toEqual(["bark"]);
    }
    for (let i = 0; i < 50; i++) {
      for (const pose of ["stand", "walk", "bark", "sit", "sitside"] as const) {
        const action = reactToTap({ ...standing, pose }).find((s) => TAP_ACTIONS.has(s.pose));
        expect(action).toBeDefined();
        if (pose !== "sit" && pose !== "sitside") expect(action?.pose).not.toBe("beg");
      }
    }
  });

  it("only begs from sitting side-on", () => {
    const begFrom = (pose: MascotState["pose"]) => {
      const steps = beg({ ...standing, pose });
      return [...withTransitions({ ...standing, pose }, steps[0]), ...steps.slice(1)].map((s) => s.pose);
    };
    expect(begFrom("stand")).toEqual(["sitdown", "sitside", "beg", "sitside"]);
    expect(begFrom("sit")).toEqual(["sitside", "beg", "sitside"]);
    expect(begFrom("sleep")).toEqual(["getup", "sitside", "beg", "sitside"]);
    expect(withTransitions({ ...standing, pose: "beg" }, { ...standing, pose: "walk", ms: 1000 })[0].pose).toBe(
      "standup",
    );
  });

  it("sits down, lies down and gets back up through the in-betweens", () => {
    const poses = (from: MascotState["pose"], to: MascotState["pose"]) =>
      withTransitions({ ...standing, pose: from }, { ...standing, pose: to, ms: 1000 }).map((s) => s.pose);
    expect(poses("stand", "sit")).toEqual(["turnin", "facein", "sit"]);
    expect(poses("walk", "sleep")).toEqual(["turnin", "facein", "liedown", "sleep"]);
    expect(poses("sit", "sleep")).toEqual(["liedown", "sleep"]);
    expect(poses("sleep", "sit")).toEqual(["getup", "sit"]);
    expect(poses("sleep", "walk")).toEqual(["getup", "faceout", "turnout", "walk"]);
    expect(poses("sit", "bark")).toEqual(["faceout", "turnout", "bark"]);
    expect(poses("bark", "walk")).toEqual(["walk"]);
    expect(poses("stand", "sitside")).toEqual(["sitdown", "sitside"]);
    expect(poses("sitside", "walk")).toEqual(["standup", "walk"]);
    expect(poses("sitside", "sleep")).toEqual(["sitfront", "liedown", "sleep"]);
    expect(poses("sitside", "sit")).toEqual(["sit"]);
  });

  it("stands up facing the way it's sitting, then turns to walk the other way", () => {
    const sitting: MascotState = { pose: "sitside", x: 50, facing: "left" };
    const [turn, walk] = moveTo(sitting, 90);
    const steps = withTransitions(sitting, turn);
    expect(steps.map((s) => [s.pose, s.facing])).toEqual([
      ["standup", "left"],
      ["turn", "right"],
    ]);
    expect(walk).toMatchObject({ pose: "walk", facing: "right" });
  });

  it("turns round while sitting, through sitting front-on", () => {
    const side: MascotState = { pose: "sitside", x: 50, facing: "left" };
    expect(turnSitting(side, seq(0.9, 0.2)).map((s) => [s.pose, s.facing])).toEqual([
      ["sit", "left"],
      ["sitside", "right"],
    ]);
    expect(turnSitting({ ...side, pose: "sit" }, seq(0.5, 0.7))).toMatchObject([{ pose: "sitside", facing: "right" }]);
  });

  it("plays each in-between once on the way through", () => {
    const route = (from: MascotState["pose"], to: MascotState["pose"]) => {
      let at: MascotState = { ...standing, pose: from };
      const played: string[] = [];
      let queue = [{ ...standing, pose: to, ms: 1000 }];
      while (queue.length) {
        const [step, ...after] = withTransitions(at, queue.shift() as (typeof queue)[number]);
        queue = [...after, ...queue];
        played.push(step.pose);
        at = step;
      }
      return played;
    };
    expect(route("sleep", "walk")).toEqual(["getup", "faceout", "turnout", "walk"]);
    expect(route("show", "walk")).toEqual(["standup", "walk"]);
    expect(route("walk", "sleep")).toEqual(["turnin", "facein", "liedown", "sleep"]);
  });

  it("drops the footy sitting down, after showing it off or when tapped", () => {
    const fetched = fetchBall(standing, 50).map((s) => s.pose);
    expect(fetched.slice(-3)).toEqual(["hold", "show", "drop"]);
    expect(reactToTap({ ...standing, pose: "show" }).map((s) => s.pose)).toEqual(["drop"]);
    // holding it standing up, it sits down with the footy first
    const [down] = withTransitions({ ...standing, pose: "hold" }, reactToTap({ ...standing, pose: "hold" })[0]);
    expect(down).toMatchObject({ pose: "sitdown", ball: true });
  });

  it("keeps its spot and holds the footy through the in-betweens", () => {
    const [down] = withTransitions(
      { pose: "hold", x: 30, facing: "left" },
      { pose: "show", x: 30, facing: "left", ms: 2600 },
    );
    expect(down).toMatchObject({ pose: "sitdown", x: 30, facing: "left", ball: true });
  });

  it("settles into a resting pose to carry over to the next page", () => {
    expect(settled({ pose: "walk", x: 40, facing: "right" })).toEqual({ pose: "stand", x: 40, facing: "right" });
    expect(settled({ pose: "beg", x: 10, facing: "left" })).toEqual({ pose: "sitside", x: 10, facing: "left" });
    expect(settled({ pose: "liedown", x: 5, facing: "left" }).pose).toBe("sleep");
    expect(settled({ pose: "run", x: 70, facing: "left", ball: true }).pose).toBe("hold");
    expect(settled({ pose: "show", x: 30, facing: "left" }).pose).toBe("sit");
  });

  it("moves off the title before sitting or napping, but walks and fetches over it", () => {
    const here: MascotState = { pose: "stand", x: 10, facing: "right" };
    const sit: Step = { pose: "sitside", x: 10, facing: "right", ms: 3000 };
    const nap: Step = { pose: "sleep", x: 10, facing: "right", ms: 5000 };
    const steps = makeRoom(here, [sit, nap], 60, () => 0.5);
    // walks to 80 (half way between 60 and 100), then sits and naps there
    expect(steps.map((s) => [s.pose, Math.round(s.x)])).toEqual([
      ["walk", 80],
      ["sitside", 80],
      ["sleep", 80],
    ]);
    // walking over the title is fine, and so is anything already clear of it
    const walk: Step = { pose: "walk", x: 30, facing: "right", ms: 900 };
    expect(makeRoom(here, [walk], 60)).toEqual([walk]);
    expect(makeRoom({ ...here, x: 70 }, [{ ...sit, x: 70 }], 60)).toEqual([{ ...sit, x: 70 }]);
    // no title to keep clear of
    expect(makeRoom(here, [sit], 0)).toEqual([sit]);
  });

  it("does tricks at the far end when the title fills the row", () => {
    const here: MascotState = { pose: "stand", x: 10, facing: "right" };
    const sit: Step = { pose: "sitside", x: 10, facing: "right", ms: 3000 };
    const steps = makeRoom(here, [sit], 100, () => 0.5);
    expect(steps.map((s) => [s.pose, Math.round(s.x)])).toEqual([
      ["walk", 100],
      ["sitside", 100],
    ]);
  });
});
