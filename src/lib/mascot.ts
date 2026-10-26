/** Behaviour for the home-screen bulldog. Pure, so it can be tested; the component just plays it. */

export type Pose = "stand" | "walk" | "sit" | "sleep" | "bark" | "sniff" | "hop" | "spin";
export type Facing = "left" | "right";

export type MascotState = { pose: Pose; x: number; facing: Facing; say: string | null };
export type Step = MascotState & { ms: number };

/** Horizontal position is 0–100 (% of the stage). Walking pace in ms per 1%. */
const PACE = 70;

type Rand = () => number;
const between = (rand: Rand, min: number, max: number) => min + rand() * (max - min);
const pick = <T>(rand: Rand, items: readonly T[]) => items[Math.floor(rand() * items.length)];

const WEIGHTS: [Pose, number][] = [
  ["walk", 34],
  ["stand", 16],
  ["sit", 18],
  ["sleep", 12],
  ["bark", 10],
  ["sniff", 10],
];

const BARKS = ["Woof!", "Ruff!", "Go Doggies!", "Woof woof!"];

/** What the dog does next. Never repeats a non-walking pose twice in a row. */
export function nextStep(current: MascotState, rand: Rand = Math.random): Step {
  const options = WEIGHTS.filter(([pose]) => pose === "walk" || pose !== current.pose);
  const total = options.reduce((sum, [, w]) => sum + w, 0);
  let roll = rand() * total;
  let pose: Pose = "stand";
  for (const [p, w] of options) {
    roll -= w;
    if (roll < 0) {
      pose = p;
      break;
    }
  }

  const base = { x: current.x, facing: current.facing, say: null };
  switch (pose) {
    case "walk": {
      // Walk somewhere at least a fifth of the stage away, so it reads as a walk.
      let to = Math.round(between(rand, 0, 100));
      if (Math.abs(to - current.x) < 20)
        to = current.x > 50 ? Math.max(0, current.x - 35) : Math.min(100, current.x + 35);
      return { pose, x: to, facing: to > current.x ? "right" : "left", say: null, ms: Math.abs(to - current.x) * PACE };
    }
    case "sit":
      return { ...base, pose, ms: between(rand, 3500, 6000) };
    case "sleep":
      return { ...base, pose, ms: between(rand, 6000, 10000) };
    case "bark":
      return { ...base, pose, say: pick(rand, BARKS), ms: 1800 };
    case "sniff":
      return { ...base, pose, ms: 2400 };
    default:
      return { ...base, pose: "stand", ms: between(rand, 1800, 3500) };
  }
}

/** What happens when someone taps the dog. */
export function reactToTap(current: MascotState, rand: Rand = Math.random): Step {
  const base = { x: current.x, facing: current.facing };
  if (current.pose === "sleep") return { ...base, pose: "hop", say: "Huh? I'm up!", ms: 1400 };
  const trick = pick(rand, ["bark", "hop", "spin", "sit"] as const);
  if (trick === "bark") return { ...base, pose: "bark", say: pick(rand, BARKS), ms: 1800 };
  if (trick === "hop") return { ...base, pose: "hop", say: "Yip!", ms: 1200 };
  if (trick === "spin") return { ...base, pose: "spin", say: null, ms: 900 };
  return { ...base, pose: "sit", say: "Pat me?", ms: 3500 };
}

/** The dog's opening line on the home screen. */
export const greeting = (firstName: string): Step => ({
  pose: "bark",
  x: 12,
  facing: "right",
  say: `G'day, ${firstName}!`,
  ms: 2600,
});
