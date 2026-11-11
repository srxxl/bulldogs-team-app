import { CalendarPlus, MapPin, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";
import { Morph, morphName } from "@/components/morph";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { SessionPlan } from "@/components/session-plan";
import { canPlanSessions } from "@/lib/roles";
import { formatLongDay, formatTime, relativeDay } from "@/lib/time";
import { TRAINING } from "@/lib/training";
import { requireMember } from "@/server/auth/session";
import { getDrillCatalog, getSessionDrillsFor } from "@/server/queries/drills";
import { getEvent, getRsvps } from "@/server/queries/events";

const SHOWN_FACES = 8;

export async function generateMetadata({ params }: PageProps<"/training/[id]">): Promise<Metadata> {
  const s = await getEvent((await params).id);
  return { title: s ? `Training, ${formatLongDay(s.startsAt)}` : "Training" };
}

/** One training session: its card from the Training page grown into a page, with RSVP, who's coming and the plan. */
export default async function TrainingSessionPage({ params }: PageProps<"/training/[id]">) {
  const me = await requireMember();
  const { id } = await params;
  const s = await getEvent(id);
  if (!s) notFound();
  if (s.kind !== "training") redirect(`/fixture/${id}`);
  const planner = canPlanSessions(me);
  const [rsvps, plans, catalog] = await Promise.all([
    getRsvps(id),
    getSessionDrillsFor([id]),
    planner ? getDrillCatalog() : [],
  ]);
  const yes = rsvps.filter((p) => p.status === "yes");
  const no = rsvps.filter((p) => p.status === "no").length;
  const mine = rsvps.find((p) => p.userId === me.id)?.status ?? null;

  return (
    <Morph name={morphName.session(id)}>
      <article className="mx-auto max-w-3xl rounded-[28px] bg-white p-5 md:p-7">
        <div className="flex items-start gap-3">
          <BackButton href="/training" to="training" className="text-navy" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-navy">{formatLongDay(s.startsAt)}</h1>
            {/* always here: the Training page only mentions time and place when they're not the usual */}
            <p className="mt-1 text-sm text-ink/60">
              {formatTime(s.startsAt)}
              {s.endsAt && ` to ${formatTime(s.endsAt)}`}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.venueAddress ?? TRAINING.venueAddress)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-block text-sm font-semibold text-navy underline decoration-navy/30 underline-offset-4 hover:decoration-navy"
            >
              <MapPin size={14} aria-hidden className="mr-1 inline align-[-2px]" />
              {s.venueName ?? TRAINING.venueName}
            </a>
          </div>
          <span className="shrink-0 pt-1.5 text-sm font-semibold text-red">{relativeDay(s.startsAt)}</span>
        </div>
        {s.details && <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{s.details}</p>}

        <div className="mt-4">
          <RsvpButtons eventId={s.id} status={mine} />
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
          <h2 className="mb-1 text-xl font-bold text-navy">Session plan</h2>
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
      </article>
    </Morph>
  );
}
