/**
 * Behaviour for the home-screen bulldog, inspired by VS Code Pets: a few distinct states, random idling,
 * and a ball to chase. Pure, so it can be tested; the component just plays the steps in order.
 */

/**
 * Each pose is one drawing in `public/mascot/`. `turn` is the slight-turn stance the dog passes through
 * when it changes direction; `hold` trots with the footy in its mouth and `show` sits to show it off.
 */
export type Pose = "stand" | "turn" | "walk" | "run" | "sit" | "sleep" | "bark" | "play" | "hop" | "hold" | "show";
export type Facing = "left" | "right";

/** Front-on poses look the same either way, so they're never mirrored. */
export const FRONT_ON: ReadonlySet<Pose> = new Set(["sit", "show"]);

export type MascotState = { pose: Pose; x: number; facing: Facing };
export type Step = MascotState & { ms: number };

/** Horizontal position is 0–100 (% of the stage). Pace in ms per 1%. */
const WALK_PACE = 70;
const RUN_PACE = 22;
/** How long the dog holds the slight-turn stance when it changes direction. */
export const TURN_MS = 380;

type Rand = () => number;
const between = (rand: Rand, min: number, max: number) => min + rand() * (max - min);
const pick = <T>(rand: Rand, items: readonly T[]) => items[Math.floor(rand() * items.length)];
const clamp = (x: number) => Math.min(100, Math.max(0, Math.round(x)));
const other = (facing: Facing): Facing => (facing === "left" ? "right" : "left");

const WEIGHTS: [Pose, number][] = [
  ["walk", 34],
  ["stand", 14],
  ["sit", 16],
  ["sleep", 12],
  ["bark", 10],
  ["play", 10],
  ["turn", 4],
];

/**
 * Moving somewhere. If that means changing direction, the dog first turns through the slight-turn
 * stance, so it never snaps from facing one way to the other.
 */
export function moveTo(current: MascotState, to: number, pose: "walk" | "run" = "walk"): Step[] {
  const x = clamp(to);
  const facing: Facing = x === current.x ? current.facing : x > current.x ? "right" : "left";
  const pace = pose === "run" ? RUN_PACE : WALK_PACE;
  const move: Step = { pose, x, facing, ms: Math.max(300, Math.abs(x - current.x) * pace) };
  if (facing === current.facing) return [move];
  return [{ pose: "turn", x: current.x, facing, ms: TURN_MS }, move];
}

/** A full turn on the spot: round through the slight-turn stance, the other way, and back. */
export function spin(current: MascotState): Step[] {
  const base = { x: current.x };
  const away = other(current.facing);
  return [
    { ...base, pose: "turn", facing: away, ms: TURN_MS },
    { ...base, pose: "stand", facing: away, ms: 300 },
    { ...base, pose: "turn", facing: current.facing, ms: TURN_MS },
    { ...base, pose: "stand", facing: current.facing, ms: 900 },
  ];
}

/** What the dog does next on its own. Never repeats a resting pose twice in a row. */
export function nextSteps(current: MascotState, rand: Rand = Math.random): Step[] {
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

  const base = { x: current.x, facing: current.facing };
  switch (pose) {
    case "walk": {
      // Walk somewhere at least a fifth of the stage away, so it reads as a walk.
      let to = Math.round(between(rand, 0, 100));
      if (Math.abs(to - current.x) < 20) to = current.x > 50 ? current.x - 35 : current.x + 35;
      return moveTo(current, to);
    }
    case "sit":
      return [{ ...base, pose, ms: between(rand, 3500, 6000) }];
    case "sleep":
      return [{ ...base, pose, ms: between(rand, 6000, 10000) }];
    case "bark":
      return [{ ...base, pose, ms: 1800 }];
    case "play":
      return [{ ...base, pose, ms: between(rand, 1800, 3000) }];
    case "turn":
      return spin(current);
    default:
      return [{ ...base, pose: "stand", ms: between(rand, 1800, 3500) }];
  }
}

/** What happens when someone taps the dog. */
export function reactToTap(current: MascotState, rand: Rand = Math.random): Step[] {
  const base = { x: current.x, facing: current.facing };
  if (current.pose === "sleep") return [{ ...base, pose: "hop", ms: 1400 }];
  const trick = pick(rand, ["bark", "hop", "spin", "play", "sit"] as const);
  if (trick === "bark") return [{ ...base, pose: "bark", ms: 1800 }];
  if (trick === "hop") return [{ ...base, pose: "hop", ms: 1200 }];
  if (trick === "spin") return spin(current);
  if (trick === "play") return [{ ...base, pose: "play", ms: 2400 }];
  return [{ ...base, pose: "sit", ms: 3500 }];
}

/** Someone threw the footy to `ballX`: run to it (turning first if needed), pick it up, then sit and show it off. */
export function fetchBall(current: MascotState, ballX: number): Step[] {
  const run = moveTo(current, ballX, "run");
  const { x, facing } = run[run.length - 1];
  return [...run, { pose: "hold", x, facing, ms: 1400 }, { pose: "show", x, facing, ms: 2600 }];
}

/** The dog's opening move on the home screen: a hello bark. */
export const GREETING: Step = { pose: "bark", x: 12, facing: "right", ms: 2600 };
