import { contrast, teamTheme } from "@/lib/club-colours";
import { cn } from "@/lib/cn";
import { points, type Score } from "@/lib/score";

const NAVY = "#28357c";
/** A margin this big (in points) fills its half of the bar. */
const FULL = 60;

/**
 * A played game's score on the navy game header, home on the left and away on the right (as in the fixture):
 * each team's points big at its own end with goals and behinds beside them, and the margin bar between them
 * growing from the middle towards the winner. The winner's points are bright, the other side's quieter. Our bar
 * is solid white; theirs is whichever of their colours shows on navy, or their main colour outlined in white.
 */
export function MarginBar({
  opponent,
  isHome,
  us,
  them,
}: {
  opponent: string;
  isHome: boolean | null;
  us: Score;
  them: Score;
}) {
  const ours = points(us);
  const theirs = points(them);
  const margin = Math.abs(ours - theirs);
  const weWon = ours > theirs;
  const theme = teamTheme(opponent);
  // their own colour that shows on navy (not white, which is ours here); if none does, their main colour
  // with a white outline, so it's still visible and never mistaken for our bar
  const shows = theme.colours.find((c) => contrast(c, NAVY) >= 2 && contrast(c, "#ffffff") >= 1.5);
  const theirBar = shows ? { background: shows } : { background: theme.primary, boxShadow: "inset 0 0 0 2px #ffffff" };
  const usOnLeft = isHome !== false;
  const winnerOnLeft = weWon === usOnLeft;
  const width = `${(Math.min(margin, FULL) / FULL) * 50}%`;
  const result = margin === 0 ? "Drew" : `${weWon ? "Won" : "Lost"} by ${margin}`;

  const side = (name: string, s: Score, won: boolean, right: boolean) => (
    <div className={cn("min-w-0", right && "text-right")}>
      <p className="truncate text-sm text-powder">{name}</p>
      <p className={cn("flex items-baseline gap-2", right && "flex-row-reverse")}>
        <span className={cn("display-num text-5xl font-extrabold md:text-6xl", !won && margin > 0 && "text-white/55")}>
          {points(s)}
        </span>
        <span className="text-sm text-powder tabular-nums">
          {s.goals}.{s.behinds}
        </span>
      </p>
    </div>
  );

  return (
    <figure
      className="mt-5 grid max-w-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-4"
      aria-label={`${result}, ${ours} to ${theirs}`}
    >
      {usOnLeft ? side("Bulldogs", us, weWon, false) : side(opponent, them, !weWon, false)}
      {/* the bar sits level with the bottom of the big numbers */}
      <div className="pb-3" aria-hidden>
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
      </div>
      {usOnLeft ? side(opponent, them, !weWon, true) : side("Bulldogs", us, weWon, true)}
    </figure>
  );
}
