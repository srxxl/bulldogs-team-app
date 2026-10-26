export type Score = { goals: number; behinds: number };

export const points = (s: Score) => s.goals * 6 + s.behinds;
/** "7.5 (47)" */
export const formatScore = (s: Score) => `${s.goals}.${s.behinds} (${points(s)})`;

export type Result = "win" | "loss" | "draw";

export function resultOf(team: Score, opp: Score): Result {
  const diff = points(team) - points(opp);
  return diff > 0 ? "win" : diff < 0 ? "loss" : "draw";
}

type MaybeScored = {
  teamGoals: number | null;
  teamBehinds: number | null;
  oppGoals: number | null;
  oppBehinds: number | null;
};

/** Both scores if the game has a result recorded, else null. */
export function scoresOf(e: MaybeScored): { team: Score; opp: Score } | null {
  if (e.teamGoals == null || e.teamBehinds == null || e.oppGoals == null || e.oppBehinds == null) {
    return null;
  }
  return {
    team: { goals: e.teamGoals, behinds: e.teamBehinds },
    opp: { goals: e.oppGoals, behinds: e.oppBehinds },
  };
}

export type HeadToHead = {
  played: number;
  won: number;
  lost: number;
  drawn: number;
  for: number;
  against: number;
};

export function headToHead(games: MaybeScored[]): HeadToHead {
  const h: HeadToHead = {
    played: 0,
    won: 0,
    lost: 0,
    drawn: 0,
    for: 0,
    against: 0,
  };
  for (const g of games) {
    const s = scoresOf(g);
    if (!s) continue;
    h.played += 1;
    h.for += points(s.team);
    h.against += points(s.opp);
    const r = resultOf(s.team, s.opp);
    if (r === "win") h.won += 1;
    else if (r === "loss") h.lost += 1;
    else h.drawn += 1;
  }
  return h;
}
