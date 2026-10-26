import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/ui";
import { VoteForm } from "@/components/vote-form";
import { formatLongDay, formatTime } from "@/lib/time";
import { voteClosesAt, voteWindow } from "@/lib/votes";
import { requireMember } from "@/server/auth/session";
import { getLineup, getMyBallot } from "@/server/queries/content";
import { getEvent } from "@/server/queries/events";
import { getSquad } from "@/server/queries/squad";

export const metadata: Metadata = { title: "Player's player votes" };

export default async function VotePage({ params }: PageProps<"/fixture/[id]/vote">) {
  const { id } = await params;
  const me = await requireMember();
  const [game, squad, ballot, lineup] = await Promise.all([
    getEvent(id),
    getSquad(),
    getMyBallot(id, me.id),
    getLineup(id),
  ]);
  if (game?.kind !== "game") notFound();
  const window = voteWindow(game.startsAt);

  // Players named on the team board come first; everyone else is still votable.
  const played = new Set(Object.values(lineup));
  const candidates = squad
    .filter((p) => p.id !== me.id && p.role !== "coach" && p.role !== "admin")
    .sort((a, b) => Number(played.has(b.id)) - Number(played.has(a.id)) || (a.guernsey ?? 99) - (b.guernsey ?? 99))
    .map((p) => ({
      id: p.id,
      name: p.displayName,
      guernsey: p.guernsey,
      image: p.image,
      played: played.has(p.id),
    }));

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/fixture/${id}`} className="font-semibold text-navy underline underline-offset-4">
          {game.title}
        </Link>
      </p>
      <PageHeader
        title="Player's player"
        intro={
          window === "open"
            ? `Who were the best on ground? Votes are private and close ${formatLongDay(voteClosesAt(game.startsAt))} at ${formatTime(voteClosesAt(game.startsAt))}.`
            : undefined
        }
      />
      {window === "before" && <EmptyState title="Not open yet">Votes open two hours after the bounce.</EmptyState>}
      {window === "closed" && (
        <EmptyState title="Voting has closed">
          {ballot ? "Your votes were counted." : "Votes for this game are closed."}
        </EmptyState>
      )}
      {window === "open" && <VoteForm eventId={id} candidates={candidates} ballot={ballot} />}
    </>
  );
}
