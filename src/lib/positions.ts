import type { Position } from "@/server/db/schema";

export const POSITIONS: { value: Position; label: string; plural: string }[] = [
  { value: "forward", label: "Forward", plural: "Forwards" },
  { value: "midfielder", label: "Midfielder", plural: "Midfielders" },
  { value: "ruck", label: "Ruck", plural: "Rucks" },
  { value: "defender", label: "Defender", plural: "Defenders" },
  { value: "utility", label: "Utility", plural: "Utilities" },
];

export const positionLabel = (p: Position) => POSITIONS.find((x) => x.value === p)?.label ?? p;

/**
 * Positions are laid out on a portrait ellipse in a 400 × 500 box (forwards at the top). Every ground on screen is
 * drawn on its side instead (forwards on the right): see `sideways`.
 */
export const GROUND = { width: 400, height: 500 } as const;

/** Where a position sits on the ground drawn on its side, forwards on the right (fractions of width and height). */
export const sideways = (s: { x: number; y: number }) => ({ x: 1 - s.y, y: s.x });
/** Position markers are circles this fraction of the ground's width. */
export const MARKER = 0.14;

/** Half the ground's width at height y (both as fractions), from the ellipse. */
const halfWidthAt = (y: number) => 0.5 * Math.sqrt(1 - ((y - 0.5) / 0.5) ** 2);
/** Left/right flank x at height y: pockets tuck in, flanks follow the boundary. */
const flank = (y: number, side: -1 | 1) => 0.5 + side * 0.62 * halfWidthAt(y);

/** One on-field position, with where it sits on the ground (fractions of width/height). */
export type FieldSlot = { id: string; label: string; short: string; x: number; y: number };

const FORWARD = 0.11;
const HALF_FORWARD = 0.26;
const HALF_BACK = 1 - HALF_FORWARD;
const BACK = 1 - FORWARD;

/**
 * The 18 AFL positions as they line up: forward line, half-forward line, the centre line (wings and centre)
 * with the followers (ruck, ruck-rover, rover) around the centre square, half-back line, back line.
 */
export const FIELD_SLOTS: FieldSlot[] = [
  { id: "FPL", label: "Forward pocket", short: "FP", x: flank(FORWARD, -1), y: FORWARD },
  { id: "FF", label: "Full forward", short: "FF", x: 0.5, y: FORWARD },
  { id: "FPR", label: "Forward pocket", short: "FP", x: flank(FORWARD, 1), y: FORWARD },
  { id: "HFFL", label: "Half forward flank", short: "HFF", x: flank(HALF_FORWARD, -1), y: HALF_FORWARD },
  { id: "CHF", label: "Centre half forward", short: "CHF", x: 0.5, y: HALF_FORWARD },
  { id: "HFFR", label: "Half forward flank", short: "HFF", x: flank(HALF_FORWARD, 1), y: HALF_FORWARD },
  { id: "WL", label: "Wing", short: "W", x: 0.15, y: 0.5 },
  { id: "R", label: "Ruck", short: "R", x: 0.5, y: 0.42 },
  { id: "RR", label: "Ruck rover", short: "RR", x: 0.36, y: 0.5 },
  { id: "RO", label: "Rover", short: "RO", x: 0.64, y: 0.5 },
  { id: "C", label: "Centre", short: "C", x: 0.5, y: 0.58 },
  { id: "WR", label: "Wing", short: "W", x: 0.85, y: 0.5 },
  { id: "HBFL", label: "Half back flank", short: "HBF", x: flank(HALF_BACK, -1), y: HALF_BACK },
  { id: "CHB", label: "Centre half back", short: "CHB", x: 0.5, y: HALF_BACK },
  { id: "HBFR", label: "Half back flank", short: "HBF", x: flank(HALF_BACK, 1), y: HALF_BACK },
  { id: "BPL", label: "Back pocket", short: "BP", x: flank(BACK, -1), y: BACK },
  { id: "FB", label: "Full back", short: "FB", x: 0.5, y: BACK },
  { id: "BPR", label: "Back pocket", short: "BP", x: flank(BACK, 1), y: BACK },
];

/**
 * PFL women (all grades) play 18-a-side with at most 22 on the team sheet (2026 By-Laws; Laws of
 * Australian Football 5.1), so the interchange is 4. Emergencies are the club's 2 named back-ups:
 * not on the team sheet, they step in if someone pulls out.
 */
export const BENCH_SLOTS = ["I1", "I2", "I3", "I4"];
/** Players needed to name a team, to field a full side, and the most on the team sheet. */
export const TEAM_SHEET = { minimum: 14, side: 18, full: 22 } as const;
export const EMERGENCY_SLOTS = ["E1", "E2"];
export const ALL_SLOTS = new Set([...FIELD_SLOTS.map((s) => s.id), ...BENCH_SLOTS, ...EMERGENCY_SLOTS]);

/** Validates a lineup map (slot → userId): known slots, each player at most once. */
export function validateLineup(lineup: Record<string, string>): string | null {
  const seen = new Set<string>();
  for (const [slot, userId] of Object.entries(lineup)) {
    if (!ALL_SLOTS.has(slot)) return `Unknown position ${slot}`;
    if (seen.has(userId)) return "A player can only be in one spot";
    seen.add(userId);
  }
  return null;
}

/** Which kind of player suits each slot, best first. */
const SLOT_PREFERENCE: Record<string, Position[]> = {
  FPL: ["forward", "utility"],
  FF: ["forward", "utility"],
  FPR: ["forward", "utility"],
  HFFL: ["forward", "midfielder", "utility"],
  CHF: ["forward", "utility", "ruck"],
  HFFR: ["forward", "midfielder", "utility"],
  WL: ["midfielder", "utility"],
  C: ["midfielder", "utility"],
  WR: ["midfielder", "utility"],
  RR: ["midfielder", "ruck", "utility"],
  R: ["ruck", "utility", "midfielder"],
  RO: ["midfielder", "utility"],
  HBFL: ["defender", "midfielder", "utility"],
  CHB: ["defender", "utility", "ruck"],
  HBFR: ["defender", "midfielder", "utility"],
  BPL: ["defender", "utility"],
  FB: ["defender", "utility"],
  BPR: ["defender", "utility"],
};

export type AutoFillPlayer = { id: string; position: Position; secondaryPosition: Position | null; available: boolean };

/**
 * Fills empty spots with players who said they're in, matching their main position first, then their
 * second position, then anyone left. Keeps everyone already placed. Leftovers go to the bench, then emergencies.
 */
export function autoFill(lineup: Record<string, string>, players: AutoFillPlayer[]): Record<string, string> {
  const next = { ...lineup };
  const placed = new Set(Object.values(next));
  const free = players.filter((p) => p.available && !placed.has(p.id));
  const take = (slot: string, match: (p: AutoFillPlayer) => boolean) => {
    const i = free.findIndex(match);
    if (i === -1) return false;
    next[slot] = free[i].id;
    free.splice(i, 1);
    return true;
  };

  const empty = FIELD_SLOTS.map((s) => s.id).filter((id) => !next[id]);
  // Hand out the best matches across the whole ground before any second choices:
  // main position by preference rank, then second position by rank, then anyone left.
  for (const key of ["position", "secondaryPosition"] as const) {
    for (let rank = 0; rank < 3; rank++) {
      for (const slot of empty) {
        const pos = SLOT_PREFERENCE[slot][rank];
        if (!next[slot] && pos) take(slot, (p) => p[key] === pos);
      }
    }
  }
  for (const slot of empty) if (!next[slot]) take(slot, () => true);
  for (const slot of [...BENCH_SLOTS, ...EMERGENCY_SLOTS]) {
    if (!next[slot] && free.length) take(slot, () => true);
  }
  return next;
}
