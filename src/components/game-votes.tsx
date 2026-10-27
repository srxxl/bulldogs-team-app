import type { Ballot, TallyRow } from "@/lib/votes";
import { Avatar } from "./avatar";
import { VoteForm } from "./vote-form";

type Candidate = { id: string; name: string; guernsey: number | null; image: string | null; played: boolean };

/**
 * Player's player for one game, open any time: players get the 3-2-1 ballot; coaches don't vote but see
 * that game's results. Players never see tallies.
 */
export function GameVotes({
  eventId,
  candidates,
  ballot,
  results,
}: {
  eventId: string;
  candidates: Candidate[];
  ballot: Ballot | null;
  /** Coaches only; null for everyone else. */
  results: (TallyRow & { name: string; image: string | null })[] | null;
}) {
  return (
    <div className="space-y-5">
      {results ? (
        <p className="text-ink/70">The players vote here. Their votes stay private; only coaches see the results.</p>
      ) : (
        <>
          <p className="text-ink/70">
            Who were the best on ground? Your votes are private, and you can change them any time.
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

      {results && (
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
