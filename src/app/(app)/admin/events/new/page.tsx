import type { Metadata } from "next";
import { EventForm } from "@/components/event-form";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Add event" };

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add event" />
      <EventForm
        values={{
          kind: "game",
          title: "",
          startsAt: "",
          endsAt: "",
          venueName: "",
          venueAddress: "",
          details: "",
          round: "",
          opponent: "",
          isHome: "",
          isFinal: false,
          cancelled: false,
          teamGoals: "",
          teamBehinds: "",
          oppGoals: "",
          oppBehinds: "",
          synced: false,
        }}
      />
    </>
  );
}
