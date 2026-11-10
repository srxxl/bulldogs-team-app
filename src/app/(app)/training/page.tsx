import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Morph, morphName } from "@/components/morph";
import { EmptyState, PageHeader } from "@/components/ui";
import { formatLongDay, relativeDay } from "@/lib/time";
import { TRAINING } from "@/lib/training";
import { requireMember } from "@/server/auth/session";
import { getSessionDrillsFor } from "@/server/queries/drills";
import { getRsvps, getUpcoming } from "@/server/queries/events";
import { usual, whenWhere } from "./session";

export const metadata: Metadata = { title: "Training" };

const SHOWN_FACES = 6;

/**
 * Every upcoming session as a simple card: the day, who's coming, and the drills by number and name. Tap one and
 * it grows into the session's own page (RSVP, the full plan, add to calendar).
 */
export default async function TrainingPage() {
  await requireMember();
  const sessions = await getUpcoming({ kind: "training", limit: 6 });
  const ids = sessions.map((s) => s.id);
  const [rsvps, plans] = await Promise.all([Promise.all(ids.map(getRsvps)), getSessionDrillsFor(ids)]);

  return (
    <>
      <PageHeader title="Training" intro={`Tuesdays and Thursdays, 6pm to 7:30pm at ${TRAINING.venueName}`} />
      {sessions.length === 0 ? (
        <EmptyState title="It's the off-season">Training polls start again when pre-season kicks off.</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {sessions.map((s, i) => {
            const yes = rsvps[i].filter((p) => p.status === "yes");
            const drills = plans.get(s.id) ?? [];
            return (
              <li key={s.id}>
                <Morph name={morphName.session(s.id)}>
                  <Link
                    href={`/training/${s.id}`}
                    className="flex h-full flex-col gap-3 rounded-[28px] bg-white p-5 transition-colors hover:bg-mist"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-3xl font-bold text-navy">{formatLongDay(s.startsAt)}</h2>
                        {!usual(s) && <p className="text-sm text-ink/60">{whenWhere(s)}</p>}
                      </div>
                      <span className="shrink-0 pt-1.5 text-sm font-semibold text-red">{relativeDay(s.startsAt)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex -space-x-2" aria-hidden>
                        {yes.slice(0, SHOWN_FACES).map((p) => (
                          <Avatar key={p.userId} name={p.name} src={p.image} size={28} className="ring-2 ring-white" />
                        ))}
                      </span>
                      <span className="text-sm text-ink/70">
                        <span className="display-num mr-1 text-2xl font-bold text-navy">{yes.length}</span>
                        coming
                      </span>
                    </div>
                    {/* the plan at a glance: each drill's number and name */}
                    {drills.length > 0 && (
                      <ol className="space-y-1 border-t border-ink/10 pt-3">
                        {drills.map((d, n) => (
                          <li key={d.id} className="flex items-baseline gap-3">
                            <span className="display-num w-5 shrink-0 text-xl font-black text-red">{n + 1}</span>
                            <span className="min-w-0 truncate font-semibold text-navy">{d.title}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </Link>
                </Morph>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
