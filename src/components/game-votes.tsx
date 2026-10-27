import { formatLongDay, formatTime } from "@/lib/time";
import type { Ballot } from "@/lib/votes";
import { type TallyRow, type VoteWindow, voteClosesAt } from "@/lib/votes";
import { Avatar } from "./avatar";
import { VoteForm } from "./vote-form";

type Candidate = { id: string; name: string; guernsey: number | null; image: string | null; played: boolean };

/**
 * Player's player for one game: players get the 3-2-1 ballot while voting is open; coaches don't vote
 * but see that game's results. Players never see tallies.
 */
export function GameVotes({
  eventId,
  startsAt,
  window,
  candidates,
  ballot,
  results,
}: {
  eventId: string;
  startsAt: Date;
  window: VoteWindow;
  candidates: Candidate[];
  ballot: Ballot | null;
  /** Coaches only; null for everyone else. */
  results: (TallyRow & { name: string; image: string | null })[] | null;
}) {
  const closes = voteClosesAt(startsAt);
  return (
    <div className="space-y-5">
      {window === "before" && <p className="text-ink/70">Votes open two hours after the bounce.</p>}
      {window === "open" && results && (
        <p className="text-ink/70">
          The players are voting now. It closes {formatLongDay(closes)} at {formatTime(closes)}.
        </p>
      )}
      {window === "open" && !results && (
        <>
          <p className="text-ink/70">
            Who were the best on ground? Your votes are private and close {formatLongDay(closes)} at{" "}
            {formatTime(closes)}.
          </p>
          {candidates.length < 3 ? (
            <p className="rounded-2xl bg-chalk p-4 text-sm text-ink/70">
              Votes go to players who said they were in for this game, and there aren't enough of them to pick a 3, 2
              and 1.
            </p>
          ) : (
            <VoteForm eventId={eventId} candidates={candidates} ballot={ballot} />
          )}
        </>
      )}
      {window === "closed" && (
        <p className="text-ink/70">Voting has closed.{ballot ? " Your votes were counted." : ""}</p>
      )}

      {results && window !== "before" && (
        <div className="rounded-2xl bg-chalk p-4">
          <h3 className="text-xl font-bold text-navy">
            Results <span className="font-sans text-sm font-medium text-ink/50">coaches only</span>
          </h3>
          {results.length === 0 ? (
            <p className="mt-1 text-sm text-ink/60">No votes yet.</p>
          ) : (
            <ol className="mt-2 space-y-1">
              {results.map((r, i) => (
                <li key={r.userId} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2">
                  <span className="display-num w-6 text-2xl font-black text-red">{i + 1}</span>
                  <Avatar name={r.name} src={r.image} size={30} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
                  <span className="display-num text-2xl font-black text-navy">{r.points}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
