import { roundNumber } from "@/lib/season-run";

const WEEK = 7 * 86400_000;

/**
 * Our byes: the round numbers missing between our games, each dated a week after the game before it (rounds
 * run weekly), so the fixture can show the gap. Cancelled games still count as having had a game that round.
 */
export function findByes(games: { round: string | null; startsAt: Date }[]): { round: string; startsAt: Date }[] {
  const byRound = new Map<number, Date>();
  for (const g of games) {
    const n = roundNumber(g.round);
    if (n != null && !byRound.has(n)) byRound.set(n, g.startsAt);
  }
  const numbers = [...byRound.keys()].sort((a, b) => a - b);
  const byes: { round: string; startsAt: Date }[] = [];
  for (let i = 1; i < numbers.length; i++) {
    const before = byRound.get(numbers[i - 1]) as Date;
    for (let n = numbers[i - 1] + 1; n < numbers[i]; n++) {
      byes.push({ round: `Round ${n}`, startsAt: new Date(before.getTime() + (n - numbers[i - 1]) * WEEK) });
    }
  }
  return byes;
}
