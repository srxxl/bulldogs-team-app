import { ChevronRight, ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { EmptyState, PageHeader } from "@/components/ui";
import { formatLongDay, formatTime, relativeDay } from "@/lib/time";
import { TRAINING } from "@/lib/training";
import { requireMember } from "@/server/auth/session";
import { getDrillCounts } from "@/server/queries/drills";
import { getMyRsvps, getRsvps, getUpcoming } from "@/server/queries/events";

export const metadata: Metadata = { title: "Training" };

export default async function TrainingPage() {
  const me = await requireMember();
  const sessions = await getUpcoming({ kind: "training", limit: 6 });
  const ids = sessions.map((s) => s.id);
  const [mine, rsvps, drills] = await Promise.all([
    getMyRsvps(me.id, ids),
    Promise.all(ids.map(getRsvps)),
    getDrillCounts(ids),
  ]);

  return (
    <>
      <PageHeader
        title="Training"
        intro={`Tuesdays and Thursdays, 6pm to 7:30pm at ${TRAINING.venueName}. Let the coaches know if you're coming, and tap a session to see the drills.`}
      />
      {sessions.length === 0 ? (
        <EmptyState title="It's the off-season">Training polls start again when pre-season kicks off.</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sessions.map((s, i) => {
            const people = rsvps[i];
            const yes = people.filter((p) => p.status === "yes");
            return (
              <li key={s.id} className="rounded-[28px] bg-white p-5">
                <Link href={`/training/${s.id}`} className="group flex items-baseline justify-between gap-3">
                  <h2 className="text-3xl font-bold text-navy group-hover:underline">{formatLongDay(s.startsAt)}</h2>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-red">
                    {relativeDay(s.startsAt)}
                    <ChevronRight size={16} aria-hidden />
                  </span>
                </Link>
                <p className="mb-4 text-sm text-ink/60">
                  {formatTime(s.startsAt)}
                  {s.endsAt && ` to ${formatTime(s.endsAt)}`}
                  {s.details && `. ${s.details}`}
                </p>
                <RsvpButtons eventId={s.id} status={mine.get(s.id) ?? null} />
                <Link
                  href={`/training/${s.id}#drills`}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-chalk px-3 py-2 text-sm font-semibold text-navy hover:bg-mist"
                >
                  <ClipboardList size={16} aria-hidden />
                  {drills.get(s.id) ? `${drills.get(s.id)} drills planned` : "No drills planned yet"}
                </Link>
                <p className="mt-4 text-sm text-ink/70">
                  <span className="display-num mr-1 text-2xl font-bold text-navy">{yes.length}</span>
                  coming
                  {yes.length > 0 && `: ${yes.map((p) => p.name.split(" ")[0]).join(", ")}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
