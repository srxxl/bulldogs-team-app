/**
 * One item for the day (e.g. the recipe of the day on the Fitness hub). Each item gets a score from hashing the
 * Perth date with its id and the lowest wins, so everyone sees the same pick all day, it changes at midnight,
 * and adding or removing other items rarely changes today's pick.
 */
export function pickOfTheDay<T extends { id: string }>(items: readonly T[], day: string): T | undefined {
  let best: T | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const score = hash(`${day}:${item.id}`);
    if (score < bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

/** FNV-1a, 32-bit: small, stable and spread out enough for picking. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
