/**
 * "Close your hoop": each week the skips and coaches pick a few pins, and you close your hoop by doing all of
 * them. Streaks are worked out from your logs, nothing is stored. All pure, so it's unit-tested.
 */

export type Board = "fitness" | "nutrition";

/** One week, from your point of view: what was picked, and what you logged. */
export type HoopWeek = {
  /** The Perth Monday, "2026-11-09". */
  week: string;
  picks: { pinId: string; board: Board }[];
  mine: { pinId: string; distanceM: number | null }[];
};

/** How far round your hoop you are this week. */
export function hoop(w: Pick<HoopWeek, "picks" | "mine">) {
  const done = new Set(w.mine.map((m) => m.pinId));
  const doneCount = w.picks.filter((p) => done.has(p.pinId)).length;
  return { total: w.picks.length, done: doneCount, closed: w.picks.length > 0 && doneCount === w.picks.length };
}

/** Weeks with nothing picked don't count either way: they neither break a streak nor add to it. */
const counted = (weeks: HoopWeek[]) =>
  weeks.filter((w) => w.picks.length > 0).sort((a, b) => (a.week < b.week ? 1 : -1));

/**
 * Weeks in a row you've closed your hoop, up to now. This week only counts once it's closed; until then a
 * streak that ran to last week is still alive.
 */
export function currentStreak(weeks: HoopWeek[], thisWeek: string): number {
  let n = 0;
  for (const w of counted(weeks)) {
    if (w.week > thisWeek) continue;
    if (hoop(w).closed) n++;
    else if (w.week === thisWeek) continue;
    else break;
  }
  return n;
}

/** Your longest run of closed hoops. */
export function bestStreak(weeks: HoopWeek[]): number {
  let best = 0;
  let run = 0;
  for (const w of counted(weeks).reverse()) {
    run = hoop(w).closed ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** Every Monday from `from` to `to` inclusive ("yyyy-MM-dd"), oldest first. */
export function weeksBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 7)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
