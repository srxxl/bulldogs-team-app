import type { Metadata } from "next";
import { getEvent } from "@/server/queries/events";
import { EventDetail } from "../../_event/event-detail";

export async function generateMetadata({ params }: PageProps<"/fixture/[id]">): Promise<Metadata> {
  const ev = await getEvent((await params).id);
  return { title: ev?.title ?? "Event" };
}

export default async function FixtureEventPage({ params }: PageProps<"/fixture/[id]">) {
  return <EventDetail id={(await params).id} section="fixture" />;
}
