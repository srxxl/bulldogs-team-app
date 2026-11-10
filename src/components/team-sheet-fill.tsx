import { cn } from "@/lib/cn";
import { TEAM_SHEET } from "@/lib/positions";
import { teamSheetMessage } from "@/lib/team-sheet";

const MARKS = [TEAM_SHEET.minimum, TEAM_SHEET.side, TEAM_SHEET.full];

/**
 * How full a game's team sheet is: a slot per place up to the 22 on a team sheet, filled red for each player
 * who's said they're in, the next one needed outlined in red. The minimum to name a team, a full side and
 * a full team sheet are marked underneath, with a line saying where we're at.
 */
export function TeamSheetFill({ yes }: { yes: number }) {
  return (
    <figure className="m-0 rounded-2xl bg-navy p-4 text-white md:p-5">
      <p className="flex items-baseline gap-2">
        <span className="display-num text-6xl font-extrabold">{yes}</span>
        <span className="font-display text-xl font-bold">{yes === 1 ? "player in" : "players in"}</span>
      </p>
      <div className="mt-4" role="img" aria-label={`${yes} of ${TEAM_SHEET.full} places filled`}>
        <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${TEAM_SHEET.full}, minmax(0, 1fr))` }}>
          {Array.from({ length: TEAM_SHEET.full }, (_, i) => {
            const place = i + 1;
            return (
              <li
                key={place}
                className={cn(
                  "h-5 rounded-[5px] border-2",
                  place <= yes
                    ? "border-red bg-red"
                    : place === yes + 1
                      ? "border-red"
                      : place <= TEAM_SHEET.side
                        ? "border-powder/80"
                        : "border-powder/35",
                )}
              />
            );
          })}
        </ol>
        {/* 14, 18 and 22 under their slots */}
        <div className="relative mt-1.5 h-4 text-xs text-powder">
          {MARKS.map((m) => (
            <span
              key={m}
              className="absolute -translate-x-1/2 tabular-nums"
              style={{ left: `${((m - 0.5) / TEAM_SHEET.full) * 100}%` }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-white/90">{teamSheetMessage(yes)}</figcaption>
    </figure>
  );
}
