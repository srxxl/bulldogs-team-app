import { TEAM_SHEET } from "@/lib/positions";

const { minimum, side, full } = TEAM_SHEET;
const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
/** "One", "Five", "12": small counts read better as words at the start of a sentence. */
const count = (n: number) => words[n] ?? String(n);

/** Where a game's team sheet is at, in plain words, from how many players have said they're in. */
export function teamSheetMessage(yes: number): string {
  if (yes < minimum) {
    const short = minimum - yes;
    return `${count(short)} more and we can name a team. ${count(side - yes)} more for a full ${side}.`;
  }
  if (yes < side) return `We can name a team. ${count(side - yes)} more for a full ${side}.`;
  if (yes === side) return `A full ${side} on the ground. Nobody on the bench yet.`;
  if (yes < full) return `A full ${side} on the ground, with ${yes - side} on the bench so far.`;
  if (yes === full) return `A full team sheet: ${full} in.`;
  return `A full team sheet, with ${yes - full} more than can be named.`;
}
