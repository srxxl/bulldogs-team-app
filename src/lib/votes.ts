/** Player's player is open any time: before, during or after the game. */

export type Ballot = { three: string; two: string; one: string };

/** Returns an error message, or null if the ballot is valid. */
export function validateBallot(ballot: Ballot, voterId: string, eligible: Set<string>) {
  const picks = [ballot.three, ballot.two, ballot.one];
  if (picks.some((p) => !p)) return "Pick a player for 3, 2 and 1 votes";
  if (new Set(picks).size !== 3) return "Each vote has to go to a different player";
  if (picks.includes(voterId)) return "You can't vote for yourself";
  if (picks.some((p) => !eligible.has(p))) return "Votes can only go to players who played this game";
  return null;
}

export type TallyRow = {
  userId: string;
  points: number;
  threes: number;
  games: number;
};

/** Season leaderboard: points, then most 3-vote games as the tie-break. */
export function tally(rows: { eventId: string; nomineeId: string; points: number }[]): TallyRow[] {
  const byUser = new Map<string, { points: number; threes: number; games: Set<string> }>();
  for (const r of rows) {
    const t = byUser.get(r.nomineeId) ?? {
      points: 0,
      threes: 0,
      games: new Set<string>(),
    };
    t.points += r.points;
    if (r.points === 3) t.threes += 1;
    t.games.add(r.eventId);
    byUser.set(r.nomineeId, t);
  }
  return [...byUser]
    .map(([userId, t]) => ({
      userId,
      points: t.points,
      threes: t.threes,
      games: t.games.size,
    }))
    .sort((a, b) => b.points - a.points || b.threes - a.threes);
}
