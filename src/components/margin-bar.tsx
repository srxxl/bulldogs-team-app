import { contrast, teamTheme } from "@/lib/club-colours";

const NAVY = "#28357c";
/** A margin this big (in points) fills its half of the bar. */
const FULL = 60;

/**
 * A game's winning margin on the navy game header: home on the left, away on the right (as in the fixture),
 * with a bar growing from the middle towards the winner, as long as the margin. Our bar is solid white; theirs
 * is whichever of their colours shows on navy, or their main colour outlined in white.
 */
export function MarginBar({
  opponent,
  isHome,
  ours,
  theirs,
}: {
  opponent: string;
  isHome: boolean | null;
  ours: number;
  theirs: number;
}) {
  const margin = Math.abs(ours - theirs);
  const weWon = ours > theirs;
  const theme = teamTheme(opponent);
  // their own colour that shows on navy (not white, which is ours here); if none does, their main colour
  // with a white outline, so it's still visible and never mistaken for our bar
  const shows = theme.colours.find((c) => contrast(c, NAVY) >= 2 && contrast(c, "#ffffff") >= 1.5);
  const theirBar = shows ? { background: shows } : { background: theme.primary, boxShadow: "inset 0 0 0 2px #ffffff" };
  const usOnLeft = isHome !== false;
  const winnerOnLeft = weWon === usOnLeft;
  const left = usOnLeft ? "Bulldogs" : opponent;
  const right = usOnLeft ? opponent : "Bulldogs";
  const winner = weWon ? "Bulldogs" : opponent;
  const width = `${(Math.min(margin, FULL) / FULL) * 50}%`;
  const label = margin === 0 ? "A draw" : `${winner} by ${margin}`;

  return (
    <figure className="mt-5 max-w-xl" aria-label={`Winning margin: ${label}`}>
      <div className="mb-1.5 flex justify-between text-sm text-powder">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div className="relative h-3 rounded-full bg-white/15">
        {margin > 0 && (
          <div
            className="absolute inset-y-0 rounded-full"
            style={{
              [winnerOnLeft ? "right" : "left"]: "50%",
              width,
              ...(weWon ? { background: "#ffffff" } : theirBar),
            }}
          />
        )}
        <div className="absolute -inset-y-1 left-1/2 w-0.5 -translate-x-1/2 rounded bg-white/60" />
      </div>
      <figcaption className={winnerOnLeft ? "mt-1.5 text-left" : "mt-1.5 text-right"}>
        <span className="font-display text-xl font-bold">{label}</span>
      </figcaption>
    </figure>
  );
}
