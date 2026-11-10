import { CalendarPlus, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { SessionPlan } from "@/components/session-plan";
import { EmptyState, PageHeader } from "@/components/ui";
import { canPlanSessions } from "@/lib/roles";
import { formatLongDay, formatTime, perthAt, relativeDay } from "@/lib/time";
import { TRAINING } from "@/lib/training";
import { requireMember } from "@/server/auth/session";
import { getDrillCatalog, getSessionDrillsFor } from "@/server/queries/drills";
import { getMyRsvps, getRsvps, getUpcoming } from "@/server/queries/events";

export const metadata: Metadata = { title: "Training" };

const SHOWN_FACES = 8;

/** Every upcoming session as one self-contained card: RSVP, who's coming and the drills. */
/** A session at the usual time and place, which the page intro already says. */
const usual = (s: { startsAt: Date; endsAt: Date | null; venueName: string | null }) =>
  formatTime(s.startsAt) === formatTime(perthAt(s.startsAt, TRAINING.startHour)) &&
  s.endsAt != null &&
  formatTime(s.endsAt) === formatTime(perthAt(s.endsAt, TRAINING.endHour, TRAINING.endMinute)) &&
  (s.venueName ?? TRAINING.venueName) === TRAINING.venueName;

export default async function TrainingPage() {
  const me = await requireMember();
  const planner = canPlanSessions(me);
  const sessions = await getUpcoming({ kind: "training", limit: 6 });
  const ids = sessions.map((s) => s.id);
  const [mine, rsvps, plans, catalog] = await Promise.all([
    getMyRsvps(me.id, ids),
    Promise.all(ids.map(getRsvps)),
    getSessionDrillsFor(ids),
    planner && ids.length ? getDrillCatalog() : [],
  ]);

  return (
    <>
      <PageHeader title="Training" intro={`Tuesdays and Thursdays, 6pm to 7:30pm at ${TRAINING.venueName}`} />
      {sessions.length === 0 ? (
        <EmptyState title="It's the off-season">Training polls start again when pre-season kicks off.</EmptyState>
      ) : (
        <ul className="grid items-start gap-4 lg:grid-cols-2">
          {sessions.map((s, i) => {
            const yes = rsvps[i].filter((p) => p.status === "yes");
            const no = rsvps[i].filter((p) => p.status === "no").length;
            return (
              <li
                key={s.id}
                id={`s-${s.id}`}
                className="scroll-mt-6 rounded-[28px] bg-white p-5 target:ring-4 target:ring-red/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-bold text-navy">{formatLongDay(s.startsAt)}</h2>
                    {/* only when it's not the usual time and place (that's in the page intro) */}
                    {!usual(s) && (
                      <p className="text-sm text-ink/60">
                        {formatTime(s.startsAt)}
                        {s.endsAt && ` to ${formatTime(s.endsAt)}`}, {s.venueName ?? TRAINING.venueName}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 pt-1.5 text-sm font-semibold text-red">{relativeDay(s.startsAt)}</span>
                </div>
                {s.details && <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{s.details}</p>}

                <div className="mt-4">
                  <RsvpButtons eventId={s.id} status={mine.get(s.id) ?? null} />
                </div>

                <details className="group mt-3">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-xl px-1 [&::-webkit-details-marker]:hidden">
                    <span className="flex -space-x-2" aria-hidden>
                      {yes.slice(0, SHOWN_FACES).map((p) => (
                        <Avatar key={p.userId} name={p.name} src={p.image} size={28} className="ring-2 ring-white" />
                      ))}
                    </span>
                    <span className="text-sm text-ink/70">
                      <span className="display-num mr-1 text-2xl font-bold text-navy">{yes.length}</span>
                      coming{no > 0 && `, ${no} can't`}
                    </span>
                  </summary>
                  <p className="px-1 pt-1 text-sm text-ink/70">
                    {yes.length ? yes.map((p) => p.name).join(", ") : "Nobody's said they're in yet."}
                  </p>
                </details>

                <div className="mt-3 border-t border-ink/10 pt-3">
                  <h3 className="mb-1 text-xl font-bold text-navy">Session plan</h3>
                  <SessionPlan eventId={s.id} drills={plans.get(s.id) ?? []} catalog={catalog} editable={planner} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1 border-t border-ink/10 pt-2 text-sm">
                  <a
                    href={`/fixture/${s.id}/calendar.ics`}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 font-semibold text-navy hover:bg-mist"
                  >
                    <CalendarPlus size={16} aria-hidden /> Add to calendar
                  </a>
                  {me.isAdmin && (
                    <Link
                      href={`/admin/events/${s.id}`}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 font-semibold text-navy hover:bg-mist"
                    >
                      <Pencil size={14} aria-hidden /> Edit
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
