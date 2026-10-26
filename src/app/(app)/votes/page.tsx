import type { Metadata } from "next";
import { Avatar } from "@/components/avatar";
import { EmptyState, PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { tally } from "@/lib/votes";
import { requireRole } from "@/server/auth/session";
import { getVotesSince } from "@/server/queries/content";
import { getSetting } from "@/server/queries/settings";
import { getSquad } from "@/server/queries/squad";

export const metadata: Metadata = { title: "Player's player" };

export default async function VotesPage() {
  await requireRole("coach");
  const seasonStart = await getSetting("season_start");
  const [votes, squad] = await Promise.all([getVotesSince(new Date(seasonStart)), getSquad()]);
  const rows = tally(votes);
  const byId = new Map(squad.map((p) => [p.id, p]));
  const top = rows[0]?.points ?? 0;

  return (
    <>
      <PageHeader
        title="Player's player"
        intro={`Season tally since ${seasonStart}. Only coaches can see this, so keep it a surprise for presentation night.`}
      />
      {rows.length === 0 ? (
        <EmptyState title="No votes yet">Votes open two hours after each game.</EmptyState>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => {
            const p = byId.get(r.userId);
            if (!p) return null;
            return (
              <li
                key={r.userId}
                className={cn(
                  "flex items-center gap-4 rounded-2xl p-3 pr-5",
                  i === 0 ? "bg-navy text-white" : "bg-white",
                )}
              >
                <span className="display-num w-10 text-center text-4xl font-black">{i + 1}</span>
                <Avatar name={p.displayName} src={p.image} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.displayName}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-red" style={{ width: `${(r.points / top) * 100}%` }} />
                  </div>
                </div>
                <span className="hidden text-sm opacity-70 sm:block">{r.threes} best-on</span>
                <span className="display-num w-12 text-right text-4xl font-black">{r.points}</span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
