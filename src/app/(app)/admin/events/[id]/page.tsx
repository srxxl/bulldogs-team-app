import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { PageHeader } from "@/components/ui";
import { toLocalInput } from "@/lib/time";
import { requireRole } from "@/server/auth/session";
import { getEvent } from "@/server/queries/events";

export const metadata: Metadata = { title: "Edit event" };

const str = (v: number | string | null) => (v == null ? "" : String(v));

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  await requireRole("coach");
  const ev = await getEvent((await params).id);
  if (!ev) notFound();
  return (
    <>
      <PageHeader title="Edit event" />
      <EventForm
        values={{
          id: ev.id,
          kind: ev.kind,
          title: ev.title,
          startsAt: toLocalInput(ev.startsAt),
          endsAt: ev.endsAt ? toLocalInput(ev.endsAt) : "",
          venueName: str(ev.venueName),
          venueAddress: str(ev.venueAddress),
          details: str(ev.details),
          round: str(ev.round),
          opponent: str(ev.opponent),
          isHome: ev.isHome == null ? "" : ev.isHome ? "home" : "away",
          isFinal: ev.isFinal,
          cancelled: ev.cancelled,
          teamGoals: str(ev.teamGoals),
          teamBehinds: str(ev.teamBehinds),
          oppGoals: str(ev.oppGoals),
          oppBehinds: str(ev.oppBehinds),
          synced: ev.playhqGameId !== null,
        }}
      />
    </>
  );
}
