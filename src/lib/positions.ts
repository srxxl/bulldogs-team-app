import type { Position } from "@/server/db/schema";

export const POSITIONS: { value: Position; label: string; plural: string }[] = [
  { value: "forward", label: "Forward", plural: "Forwards" },
  { value: "midfielder", label: "Midfielder", plural: "Midfielders" },
  { value: "ruck", label: "Ruck", plural: "Rucks" },
  { value: "defender", label: "Defender", plural: "Defenders" },
  { value: "utility", label: "Utility", plural: "Utilities" },
];

export const positionLabel = (p: Position) => POSITIONS.find((x) => x.value === p)?.label ?? p;

/** On-field slots, laid out top (forward line) to bottom (back line) on the board. */
export type FieldSlot = {
  id: string;
  label: string;
  short: string;
  row: number;
  col: number;
};

export const FIELD_SLOTS: FieldSlot[] = [
  { id: "FPL", label: "Forward pocket", short: "FP", row: 0, col: 0 },
  { id: "FF", label: "Full forward", short: "FF", row: 0, col: 1 },
  { id: "FPR", label: "Forward pocket", short: "FP", row: 0, col: 2 },
  { id: "HFFL", label: "Half forward flank", short: "HFF", row: 1, col: 0 },
  { id: "CHF", label: "Centre half forward", short: "CHF", row: 1, col: 1 },
  { id: "HFFR", label: "Half forward flank", short: "HFF", row: 1, col: 2 },
  { id: "WL", label: "Wing", short: "W", row: 2, col: 0 },
  { id: "C", label: "Centre", short: "C", row: 2, col: 1 },
  { id: "WR", label: "Wing", short: "W", row: 2, col: 2 },
  { id: "RR", label: "Ruck rover", short: "RR", row: 3, col: 0 },
  { id: "R", label: "Ruck", short: "R", row: 3, col: 1 },
  { id: "RO", label: "Rover", short: "RO", row: 3, col: 2 },
  { id: "HBFL", label: "Half back flank", short: "HBF", row: 4, col: 0 },
  { id: "CHB", label: "Centre half back", short: "CHB", row: 4, col: 1 },
  { id: "HBFR", label: "Half back flank", short: "HBF", row: 4, col: 2 },
  { id: "BPL", label: "Back pocket", short: "BP", row: 5, col: 0 },
  { id: "FB", label: "Full back", short: "FB", row: 5, col: 1 },
  { id: "BPR", label: "Back pocket", short: "BP", row: 5, col: 2 },
];

/** The ground is drawn as a portrait ellipse in a 400 × 500 box (forwards at the top). */
export const GROUND = { width: 400, height: 500 } as const;
/** Position markers are circles this fraction of the ground's width. */
export const MARKER = 0.16;

const ROW_Y = [0.13, 0.28, 0.43, 0.57, 0.72, 0.87];
const SPREAD = 0.62;

/**
 * Where a field slot sits on the ground, as fractions of width/height.
 * Flank columns follow the curve of the boundary: wide at the wings, tucked in at the pockets.
 */
export function fieldPosition(slot: Pick<FieldSlot, "row" | "col">) {
  const y = ROW_Y[slot.row];
  const halfWidth = 0.5 * Math.sqrt(1 - ((y - 0.5) / 0.5) ** 2);
  return { x: 0.5 + (slot.col - 1) * SPREAD * halfWidth, y };
}

export const BENCH_SLOTS = Array.from({ length: 8 }, (_, i) => `I${i + 1}`);
export const ALL_SLOTS = new Set([...FIELD_SLOTS.map((s) => s.id), ...BENCH_SLOTS]);

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

/** The lines of the ground, top (forwards) to bottom (backs), for labels. */
export const LINES = ["Forward line", "Half forward", "Centre", "Followers", "Half back", "Back line"] as const;

export type AutoFillPlayer = { id: string; position: Position; secondaryPosition: Position | null; available: boolean };

/**
 * Fills empty spots with players who said they're in, matching their main position first, then their
 * second position, then anyone left. Keeps everyone already placed. Leftovers go to the bench.
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
  for (const slot of BENCH_SLOTS) {
    if (!next[slot] && free.length) take(slot, () => true);
  }
  return next;
}
