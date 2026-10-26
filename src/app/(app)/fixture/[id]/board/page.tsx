import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LineupBoard } from "@/components/lineup-board";
import { PageHeader } from "@/components/ui";
import { canLead } from "@/lib/roles";
import { formatDay } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getLineup } from "@/server/queries/content";
import { getEvent, getRsvps } from "@/server/queries/events";
import { getSquad } from "@/server/queries/squad";

export const metadata: Metadata = { title: "Team board" };

export default async function BoardPage({ params }: PageProps<"/fixture/[id]/board">) {
  const { id } = await params;
  const me = await requireMember();
  const [ev, squad, rsvps, lineup] = await Promise.all([getEvent(id), getSquad(), getRsvps(id), getLineup(id)]);
  if (ev?.kind !== "game") notFound();

  const status = new Map(rsvps.map((r) => [r.userId, r.status]));
  const players = squad
    .filter((p) => p.role !== "coach" || status.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.displayName,
      guernsey: p.guernsey,
      image: p.image,
      position: p.position,
      status: status.get(p.id) ?? null,
    }));

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/fixture/${id}`} className="font-semibold text-navy underline underline-offset-4">
          {ev.title}
        </Link>
        <span className="text-ink/60">, {formatDay(ev.startsAt)}</span>
      </p>
      <PageHeader
        title="Team board"
        intro={
          canLead(me.role)
            ? "Set the starting positions for this week. Everyone can see it once it's saved."
            : "Where everyone's starting this week."
        }
      />
      <LineupBoard eventId={id} players={players} initial={lineup} editable={canLead(me.role)} />
    </>
  );
}
