import { cn } from "@/lib/cn";
import { formatDateOnly } from "@/lib/time";
import type { Ballot, TallyRow } from "@/lib/votes";
import { Avatar } from "./avatar";
import { VoteForm } from "./vote-form";

type Candidate = { id: string; name: string; guernsey: number | null; image: string | null; played: boolean };
export type NamedTally = TallyRow & { name: string; image: string | null };

/**
 * Player's player for one game, open any time: players get the 3-2-1 ballot; coaches don't vote but see
 * that game's results and the season tally. Players never see tallies.
 */
export function GameVotes({
  eventId,
  candidates,
  ballot,
  results,
  season,
}: {
  eventId: string;
  candidates: Candidate[];
  ballot: Ballot | null;
  /** Coaches only; null for everyone else. */
  results: NamedTally[] | null;
  /** Coaches only: every vote since the season started. */
  season: { start: string; rows: NamedTally[] } | null;
}) {
  return (
    <div className="space-y-5">
      {results ? null : candidates.length < 3 ? (
        <p className="rounded-2xl bg-chalk p-4 text-sm text-ink/70">
          Votes go to players who said they were in for this game, and there aren't enough of them to pick a 3, 2 and 1.
        </p>
      ) : (
        <VoteForm eventId={eventId} candidates={candidates} ballot={ballot} />
      )}

      {results && (
        <div className="rounded-2xl bg-chalk p-4">
          <h3 className="text-xl font-bold text-navy">
            This game <span className="font-sans text-sm font-medium text-ink/50">coaches only</span>
          </h3>
          {results.length === 0 ? (
            <p className="mt-1 text-sm text-ink/60">No votes yet.</p>
          ) : (
            <VoteRows rows={results} className="mt-2" />
          )}
        </div>
      )}

      {season && (
        <div className="rounded-2xl bg-chalk p-4">
          <h3 className="text-xl font-bold text-navy">
            Season{" "}
            <span className="font-sans text-sm font-medium text-ink/50">since {formatDateOnly(season.start)}</span>
          </h3>
          {season.rows.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">No votes yet.</p>
          ) : (
            <VoteRows rows={season.rows} bars className="mt-2" />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ranked vote results: place in red, face, name, points. `bars` adds a bar under each name against the leader.
 * Rows are white pills, for a chalk panel; `plain` drops the pills, for a white tile.
 */
export function VoteRows({
  rows,
  bars = false,
  plain = false,
  compact = false,
  className,
}: {
  rows: NamedTally[];
  bars?: boolean;
  plain?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const top = rows[0]?.points || 1;
  return (
    <ol className={cn("space-y-1", className)}>
      {rows.map((r, i) => (
        <li
          key={r.userId}
          className={cn(
            "flex items-center",
            plain ? "py-1" : "rounded-xl bg-white",
            compact ? "gap-2" : "gap-3",
            !plain && (compact ? "px-2.5 py-1.5" : "px-3 py-2"),
          )}
        >
          <span className={cn("display-num shrink-0 font-black text-red", compact ? "w-4 text-xl" : "w-6 text-2xl")}>
            {i + 1}
          </span>
          <Avatar name={r.name} src={r.image} size={compact ? 24 : 30} />
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate font-semibold", compact && "text-sm")}>{r.name}</span>
            {bars && (
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink/10">
                <span className="block h-full rounded-full bg-red" style={{ width: `${(r.points / top) * 100}%` }} />
              </span>
            )}
          </span>
          <span className={cn("display-num shrink-0 font-black text-navy", compact ? "text-xl" : "text-2xl")}>
            {r.points}
          </span>
        </li>
      ))}
    </ol>
  );
}
