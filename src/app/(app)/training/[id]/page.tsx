import type { Metadata } from "next";
import { formatLongDay } from "@/lib/time";
import { getEvent } from "@/server/queries/events";
import { EventDetail } from "../../_event/event-detail";

export async function generateMetadata({ params }: PageProps<"/training/[id]">): Promise<Metadata> {
  const ev = await getEvent((await params).id);
  return { title: ev ? `Training, ${formatLongDay(ev.startsAt)}` : "Training" };
}

export default async function TrainingSessionPage({ params }: PageProps<"/training/[id]">) {
  return <EventDetail id={(await params).id} section="training" />;
}
