/**
 * A season (or a run of games) as slots for the round-by-round margin chart on a team's page: each played
 * game's margin from our side (up for a win, down for a loss), byes where a round number is missing,
 * games still to come, and the next one.
 */

export type RunGame = {
  id: string;
  /** Where the round's slot links: the game's page for ours, the opponent's page for other clubs' games. */
  href: string;
  round: string | null;
  startsAt: Date;
  cancelled: boolean;
  /** Our points and theirs, if the result is in. */
  score: { ours: number; theirs: number } | null;
  /** Who we played (shown on the round's slot). */
  opponent?: string | null;
};

type GameSlot = { key: string; label: string; id: string; href: string; opponent: string | null };
export type RunSlot =
  | (GameSlot & { kind: "played"; margin: number; result: "W" | "L" | "D" })
  | { kind: "bye"; key: string; label: string }
  | (GameSlot & { kind: "upcoming"; next: boolean })
  | (GameSlot & { kind: "unscored" });

/** The round number in a name like "Round 7" or "R7" (null for finals and anything without one). */
export const roundNumber = (round: string | null) => {
  const m = round?.match(/\d+/);
  return m ? Number(m[0]) : null;
};

function slotFor(g: RunGame, label: string, now: Date, isNext: boolean): RunSlot {
  const base = { key: g.id, label, id: g.id, href: g.href, opponent: g.opponent ?? null };
  if (g.score) {
    const margin = g.score.ours - g.score.theirs;
    return { ...base, kind: "played", margin, result: margin > 0 ? "W" : margin < 0 ? "L" : "D" };
  }
  if (g.startsAt >= now) return { ...base, kind: "upcoming", next: isNext };
  return { ...base, kind: "unscored" };
}

/**
 * Our season round by round: a slot for every round from 1 to the last numbered one (a bye where we have no
 * game that round), then any finals in date order. Cancelled games are left out.
 */
export function seasonRun(games: RunGame[], now = new Date()): RunSlot[] {
  const live = games.filter((g) => !g.cancelled).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const next = live.find((g) => !g.score && g.startsAt >= now)?.id;
  const numbered = new Map<number, RunGame>();
  for (const g of live) {
    const n = roundNumber(g.round);
    if (n != null && !numbered.has(n)) numbered.set(n, g);
  }
  const last = Math.max(0, ...numbered.keys());
  const slots: RunSlot[] = [];
  for (let n = 1; n <= last; n++) {
    const g = numbered.get(n);
    slots.push(g ? slotFor(g, String(n), now, g.id === next) : { kind: "bye", key: `bye-${n}`, label: String(n) });
  }
  for (const g of live.filter((g) => roundNumber(g.round) == null)) {
    // finals by their initials: "Grand Final" is GF, "Semi Final" SF
    const initials = (g.round ?? "Final")
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    slots.push(slotFor(g, initials, now, g.id === next));
  }
  return slots;
}

/** A run of games in date order, each labelled by `label` (for our history against one club). */
export function gamesRun(games: RunGame[], label: (g: RunGame) => string, now = new Date()): RunSlot[] {
  const live = games.filter((g) => !g.cancelled).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const next = live.find((g) => !g.score && g.startsAt >= now)?.id;
  return live.map((g) => slotFor(g, label(g), now, g.id === next));
}
