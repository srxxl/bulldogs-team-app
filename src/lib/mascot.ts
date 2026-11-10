/**
 * Behaviour for the home-screen bulldog, inspired by VS Code Pets: a few distinct states, random idling,
 * and a ball to chase. Pure, so it can be tested; the component just plays the steps in order.
 */

/**
 * Each pose is one drawing in `public/mascot/`. `turn` is the slight-turn stance the dog passes through
 * when it changes direction; `pickup` lowers its head to the footy and lifts it; `hold` stands with the
 * footy in its mouth and `show` sits to show it off. `pickup` plays once, start to finish. `beg` sits up
 on its haunches with its front paws up, and only from sitting side-on.
 */
export type Pose =
  | "stand"
  | "turn"
  | "walk"
  | "run"
  | "sit"
  | "sitside"
  | "sleep"
  | "bark"
  | "play"
  | "beg"
  | "pickup"
  | "hold"
  | "show"
  | "drop"
  // in-betweens, added by `withTransitions` whenever the dog changes posture: turning to face you to
  // sit front-on (slight turn, then front-on standing) and back; sitting down side-on and back; and
  // turning from sitting side-on to front-on, to lie down
  | "turnin"
  | "facein"
  | "faceout"
  | "turnout"
  | "sitdown"
  | "standup"
  | "sitfront"
  | "liedown"
  | "getup";
export type Facing = "left" | "right";

/** Front-on poses look the same either way, so they're never mirrored. */
export const FRONT_ON: ReadonlySet<Pose> = new Set(["sit", "sitfront", "show", "drop", "liedown", "getup"]);

/** `ball`: it has the footy in its mouth (for the in-betweens around fetching). */
export type MascotState = { pose: Pose; x: number; facing: Facing; ball?: boolean };
export type Step = MascotState & { ms: number };

/** Horizontal position is 0–100 (% of the stage). Pace in ms per 1%. */
const WALK_PACE = 100;
const RUN_PACE = 22;
/** How long the dog holds the slight-turn stance when it changes direction. */
export const TURN_MS = 380;
/** The pick-up animation's length (it's keyed to this in the drawing). */
export const PICKUP_MS = 1500;
/** How long it begs for. */
export const BEG_MS = 2600;
/** Sitting while the footy falls out of its mouth and bounces to a stop (see .mascot-ball-drop). */
export const DROP_MS = 1300;
/** The in-betweens' lengths (the drawings are keyed to these). */
export const SETTLE_MS: Record<
  "turnin" | "facein" | "faceout" | "turnout" | "sitdown" | "standup" | "sitfront" | "liedown" | "getup",
  number
> = {
  turnin: 200,
  facein: 300,
  faceout: 260,
  turnout: 180,
  sitdown: 800,
  standup: 550,
  sitfront: 350,
  liedown: 500,
  getup: 450,
};
/** Where the footy lies when the dog picks it up: this far across the drawing from the side it faces. */
export const PICKUP_MOUTH = 118 / 1254;

type Rand = () => number;
const between = (rand: Rand, min: number, max: number) => min + rand() * (max - min);
const pick = <T>(rand: Rand, items: readonly T[]) => items[Math.floor(rand() * items.length)];
const clamp = (x: number) => Math.min(100, Math.max(0, Math.round(x)));
const other = (facing: Facing): Facing => (facing === "left" ? "right" : "left");

const WEIGHTS: [Pose, number][] = [
  ["walk", 34],
  ["stand", 14],
  ["sit", 9],
  ["sitside", 9],
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

/**
 * Turning round while sitting: from side-on it turns to face you, and maybe on round to sit side-on the
 * other way; from front-on it turns to either side. It stands up later facing wherever it ends up.
 */
export function turnSitting(current: MascotState, rand: Rand = Math.random): Step[] {
  const base = { x: current.x };
  const stay = between(rand, 2500, 4500);
  if (current.pose === "sit")
    return [{ ...base, pose: "sitside", facing: pick(rand, ["left", "right"] as const), ms: stay }];
  const front: Step = { ...base, pose: "sit", facing: current.facing, ms: rand() < 0.5 ? 450 : stay };
  if (front.ms === stay) return [front];
  return [front, { ...base, pose: "sitside", facing: other(current.facing), ms: stay }];
}

/** What the dog does next on its own. Never repeats a resting pose twice in a row. */
export function nextSteps(current: MascotState, rand: Rand = Math.random): Step[] {
  if ((current.pose === "sit" || current.pose === "sitside") && rand() < 0.3) return turnSitting(current, rand);
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
    case "sitside":
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

/**
 * Begging, which it only does from sitting side-on: it sits side-on (sitting down first if it's standing,
 * or turning if it's sitting front-on), sits up and begs, then drops back to sitting side-on.
 */
export function beg(current: MascotState): Step[] {
  const base = { x: current.x, facing: current.facing };
  // already begging: it just keeps on (paws still up)
  if (current.pose === "beg")
    return [
      { ...base, pose: "beg", ms: BEG_MS },
      { ...base, pose: "sitside", ms: 1500 },
    ];
  return [
    { ...base, pose: "sitside", ms: 450 },
    { ...base, pose: "beg", ms: BEG_MS },
    { ...base, pose: "sitside", ms: 1500 },
  ];
}

/** What a tap can make the dog do. Anything else (sitting, turning, walking) it only does on its own. */
export const TAP_ACTIONS: ReadonlySet<Pose> = new Set(["beg", "play", "bark"]);

/**
 * What happens when someone taps the dog: one of the tap actions, at random. Sitting, it begs, or gets up
 * to bark or play-bow; standing, it barks or play-bows (it only begs from sitting). Asleep, it wakes up
 * and sits; begging, it keeps on begging.
 */
export function reactToTap(current: MascotState, rand: Rand = Math.random): Step[] {
  const base = { x: current.x, facing: current.facing };
  if (current.pose === "sleep") return [{ ...base, pose: "sit", ms: 2500 }];
  // holding the footy: it sits and drops it first (it can't do tricks with its mouth full)
  if (current.pose === "hold" || current.pose === "show") return [{ ...base, pose: "drop", ms: DROP_MS }];
  if (current.pose === "beg") return beg(current);
  const sitting = posture(current.pose) === "sit" || posture(current.pose) === "side";
  const trick = sitting ? pick(rand, ["beg", "play", "bark"] as const) : pick(rand, ["play", "bark"] as const);
  if (trick === "beg") return beg(current);
  if (trick === "play") return [{ ...base, pose: "play", ms: 2400 }];
  return [{ ...base, pose: "bark", ms: 1800 }];
}

/**
 * Someone threw the footy and the dog should stop at `dogX` (see `fetchSpot`): run there (turning first if
 * needed), pick it up, then sit and show it off, and drop it when it's had enough.
 */
export function fetchBall(current: MascotState, dogX: number): Step[] {
  const run = moveTo(current, dogX, "run");
  const { x, facing } = run[run.length - 1];
  return [
    ...run,
    { pose: "pickup", x, facing, ms: PICKUP_MS },
    { pose: "hold", x, facing, ms: 1400 },
    { pose: "show", x, facing, ms: 2600 },
    { pose: "drop", x, facing, ms: DROP_MS },
  ];
}

/**
 * Where the dog stops to pick up a footy thrown at `ballPx`, so its mouth meets the ball, and where the
 * footy should land to match (the dog can't reach right to the edges). Sizes are in px: the stage is
 * `stageW` wide, the dog `dogW`; the dog's x is 0–100 with its box running from x% of (stage - dog).
 */
export function fetchSpot(current: MascotState, ballPx: number, stageW: number, dogW: number) {
  const room = Math.max(1, stageW - dogW);
  const toX = (left: number) => Math.min(100, Math.max(0, Math.round((left / room) * 100)));
  const mouth = (facing: Facing) => (facing === "left" ? PICKUP_MOUTH : 1 - PICKUP_MOUTH) * dogW;
  // Facing follows the way it runs, so pick the spot that agrees with its direction.
  const right = toX(ballPx - mouth("right"));
  const left = toX(ballPx - mouth("left"));
  const facing: Facing = right > current.x ? "right" : left < current.x ? "left" : current.facing;
  const dogX = facing === "right" ? right : left;
  return { dogX, facing, ballPx: (dogX / 100) * room + mouth(facing) };
}

/** Standing, sitting front-on, sitting side-on, or lying down. */
type Posture = "stand" | "sit" | "side" | "lie";
/** What a pose leaves the dog doing: the in-betweens end in the posture they lead to. */
const POSTURE: Partial<Record<Pose, Posture>> = {
  sit: "sit",
  show: "sit",
  drop: "sit",
  facein: "sit",
  sitfront: "sit",
  getup: "sit",
  sitside: "side",
  beg: "side",
  sitdown: "side",
  sleep: "lie",
  liedown: "lie",
};
const posture = (pose: Pose): Posture => POSTURE[pose] ?? "stand";

/**
 * The step, led by whatever in-betweens get the dog there from where it is. Standing to sitting front-on
 * turns to face you then sits; to sitting side-on it sits down side-on. It stands up the way it sat, so
 * always facing the way it's sitting. Lying down is from front-on (turning to face you first if it's
 * side-on), and it gets up front-on. With the footy it sits down and stands up side-on (there's no
 * front-on standing drawing holding it). In-betweens keep its spot and the way it faces, and the footy.
 */
export function withTransitions(current: MascotState, next: Step): Step[] {
  // an in-between is already on its way somewhere (getting up then standing up shouldn't stand up twice)
  if (next.pose in SETTLE_MS) return [next];
  const ball =
    !!current.ball ||
    current.pose === "hold" ||
    current.pose === "show" ||
    next.pose === "show" ||
    next.pose === "drop";
  type Settle = keyof typeof SETTLE_MS;
  const down: Settle[] = ball ? ["sitdown"] : ["turnin", "facein"];
  const up: Settle[] = ball ? ["standup"] : ["faceout", "turnout"];
  const route: Record<Posture, Record<Posture, Settle[]>> = {
    stand: { stand: [], sit: down, side: ["sitdown"], lie: [...down, "liedown"] },
    sit: { stand: up, sit: [], side: [], lie: ["liedown"] },
    side: { stand: ["standup"], sit: [], side: [], lie: ["sitfront", "liedown"] },
    lie: { stand: ["getup", ...up], sit: ["getup"], side: ["getup"], lie: [] },
  };
  const lead = route[posture(current.pose)][posture(next.pose)].map(
    (pose): Step => ({ pose, x: current.x, facing: current.facing, ms: SETTLE_MS[pose], ...(ball && { ball }) }),
  );
  return [...lead, next];
}

/** The dog's opening move on the home screen: a hello bark. */
export const GREETING: Step = { pose: "bark", x: 12, facing: "right", ms: 2600 };
