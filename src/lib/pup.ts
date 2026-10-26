export const TRICKS = ["peek", "trot", "footy", "nap", "zoomies"] as const;
export type Trick = (typeof TRICKS)[number];

/** At most one appearance every few minutes, so he stays a surprise. */
export const PUP_COOLDOWN_MS = 3 * 60_000;
export const PUP_CHANCE = 0.5;

export type PupVisit = { trick: Trick; rtl: boolean; x: number; id: number };

/** Picks what the pup does this time. `rand` is injectable for tests. */
export function planVisit(rand: () => number = Math.random, forced?: string | null): PupVisit {
  const trick = (TRICKS as readonly string[]).includes(forced ?? "")
    ? (forced as Trick)
    : TRICKS[Math.floor(rand() * TRICKS.length)];
  return { trick, rtl: rand() < 0.5, x: 8 + Math.round(rand() * 76), id: Date.now() };
}

/** Whether a scheduled visit should happen, given the last one (ms timestamp) and a dice roll. */
export const shouldVisit = (now: number, last: number | null, roll: number) =>
  (last === null || now - last >= PUP_COOLDOWN_MS) && roll < PUP_CHANCE;
