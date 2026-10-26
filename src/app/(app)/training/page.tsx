import type { Metadata } from "next";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { formatLongDay, formatTime, relativeDay } from "@/lib/time";
import { TRAINING } from "@/lib/training";
import { requireMember } from "@/server/auth/session";
import { getMyRsvps, getRsvps, getUpcoming } from "@/server/queries/events";

export const metadata: Metadata = { title: "Training" };

export default async function TrainingPage() {
  const me = await requireMember();
  const sessions = await getUpcoming({ kind: "training", limit: 6 });
  const ids = sessions.map((s) => s.id);
  const [mine, rsvps] = await Promise.all([getMyRsvps(me.id, ids), Promise.all(ids.map(getRsvps))]);

  return (
    <>
      <PageHeader
        title="Training"
        intro={`Tuesdays and Thursdays, 6pm to 7:30pm at ${TRAINING.venueName}. Let the coaches know if you're coming so they can plan the session.`}
      >
        <ButtonLink href="/training/drills" variant="outline">
          Drills
        </ButtonLink>
      </PageHeader>
      {sessions.length === 0 ? (
        <EmptyState title="It's the off-season">Training polls start again when pre-season kicks off.</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sessions.map((s, i) => {
            const people = rsvps[i];
            const yes = people.filter((p) => p.status === "yes");
            return (
              <li key={s.id} className="rounded-[28px] bg-white p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-3xl font-bold text-navy">{formatLongDay(s.startsAt)}</h2>
                  <span className="shrink-0 text-sm font-semibold text-red">{relativeDay(s.startsAt)}</span>
                </div>
                <p className="mb-4 text-sm text-ink/60">
                  {formatTime(s.startsAt)}
                  {s.endsAt && ` to ${formatTime(s.endsAt)}`}
                  {s.details && `. ${s.details}`}
                </p>
                <RsvpButtons eventId={s.id} status={mine.get(s.id) ?? null} />
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
