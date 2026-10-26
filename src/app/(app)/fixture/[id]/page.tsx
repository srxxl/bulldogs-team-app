import { CalendarPlus, MapPin, Pencil, Shirt, Vote } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { SessionPlan } from "@/components/session-plan";
import { TeamSection } from "@/components/team-board/team-section";
import { ButtonLink, Chip, Panel, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { canLead, canPlanSessions } from "@/lib/roles";
import { formatScore, headToHead, resultOf, scoresOf } from "@/lib/score";
import { formatDay, formatLongDay, formatTime } from "@/lib/time";
import { voteWindow } from "@/lib/votes";
import { requireMember } from "@/server/auth/session";
import { getLadder } from "@/server/queries/content";
import { getDrillCatalog, getSessionDrills } from "@/server/queries/drills";
import { getEvent, getPastGamesAgainst, getRsvps } from "@/server/queries/events";

export async function generateMetadata({ params }: PageProps<"/fixture/[id]">): Promise<Metadata> {
  const ev = await getEvent((await params).id);
  return { title: ev?.title ?? "Event" };
}

const GROUPS = [
  { status: "yes", label: "In" },
  { status: "no", label: "Out" },
] as const;

export default async function EventPage({ params }: PageProps<"/fixture/[id]">) {
  const { id } = await params;
  const me = await requireMember();
  const ev = await getEvent(id);
  if (!ev) notFound();

  const isGame = ev.kind === "game" && ev.opponent;
  const isTraining = ev.kind === "training";
  const [rsvps, history, ladder, sessionDrills, catalog] = await Promise.all([
    getRsvps(id),
    isGame ? getPastGamesAgainst(ev.opponent as string, ev.startsAt) : [],
    isGame ? getLadder() : [],
    isTraining ? getSessionDrills(id) : [],
    isTraining && canPlanSessions(me) ? getDrillCatalog() : [],
  ]);
  const mine = rsvps.find((r) => r.userId === me.id)?.status ?? null;
  const upcoming = (ev.endsAt ?? ev.startsAt) > new Date();
  const scores = scoresOf(ev);
  const h2h = headToHead(history);
  const oppRow = ladder.find((r) => isGame && r.team.toLowerCase() === ev.opponent?.toLowerCase());
  const votes = ev.kind === "game" ? voteWindow(ev.startsAt) : null;

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] bg-navy p-5 text-white md:p-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-powder">
          {ev.round && <span className="font-semibold">{ev.round}</span>}
          {ev.isHome != null && <Chip className="bg-white/10 text-white">{ev.isHome ? "Home" : "Away"}</Chip>}
          {ev.isFinal && <Chip className="bg-red text-white">Final</Chip>}
          {ev.cancelled && <Chip className="bg-red text-white">Cancelled</Chip>}
        </div>
        <h1 className="mt-3 font-display text-[clamp(3rem,10vw,6rem)] font-black leading-[0.85]">{ev.title}</h1>
        {scores && (
          <p className="mt-4 font-display text-3xl font-bold">
            {formatScore(scores.team)} to {formatScore(scores.opp)}
            <span className="ml-3 rounded-full bg-white px-3 py-0.5 align-middle text-base text-navy">
              {{ win: "Won", loss: "Lost", draw: "Drew" }[resultOf(scores.team, scores.opp)]}
            </span>
          </p>
        )}
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-powder">When</dt>
            <dd className="font-semibold">
              {formatLongDay(ev.startsAt)}, {formatTime(ev.startsAt)}
              {ev.endsAt && ` to ${formatTime(ev.endsAt)}`}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-powder">Where</dt>
            <dd className="font-semibold">{ev.venueName ?? "To be confirmed"}</dd>
            {ev.venueAddress && (
              <dd>
                <a
                  className="inline-flex items-center gap-1 text-sm text-white/80 underline underline-offset-4"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.venueAddress)}`}
                >
                  <MapPin size={14} /> {ev.venueAddress}
                </a>
              </dd>
            )}
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          {ev.kind === "game" && (
            <ButtonLink href="#team" className="bg-white text-navy hover:bg-powder">
              <Shirt size={18} /> Team
            </ButtonLink>
          )}
          {votes === "open" && (
            <ButtonLink href={`/fixture/${id}/vote`} variant="red">
              <Vote size={18} /> Player's player votes
            </ButtonLink>
          )}
          <ButtonLink
            href={`/fixture/${id}/calendar.ics`}
            prefetch={false}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <CalendarPlus size={18} /> Add to calendar
          </ButtonLink>
          {me.isAdmin && (
            <ButtonLink href={`/admin/events/${id}`} variant="ghost" className="text-white hover:bg-white/10">
              <Pencil size={16} /> Edit
            </ButtonLink>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <SectionTitle>{upcoming ? "Who's coming" : "Who said they'd come"}</SectionTitle>
          {upcoming && !ev.cancelled && (
            <div className="mb-6">
              <RsvpButtons eventId={id} status={mine} />
            </div>
          )}
          <div className="space-y-5">
            {GROUPS.map(({ status, label }) => {
              const people = rsvps.filter((r) => r.status === status);
              return (
                <div key={status}>
                  <h3 className="mb-2 text-xl font-bold text-navy">
                    {label} <span className="font-sans text-base font-medium text-ink/50">{people.length}</span>
                  </h3>
                  {people.length === 0 ? (
                    <p className="text-sm text-ink/50">Nobody yet</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {people.map((p) => (
                        <li
                          key={p.userId}
                          className={cn(
                            "flex items-center gap-2 rounded-full bg-chalk py-1 pr-3 pl-1 text-sm",
                            p.userId === me.id && "ring-2 ring-navy",
                          )}
                        >
                          <Avatar name={p.name} src={p.image} size={28} />
                          <span className="font-medium">{p.name}</span>
                          {p.note && <span className="text-ink/50">({p.note})</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-6">
          {ev.details && (
            <Panel>
              <SectionTitle>Details</SectionTitle>
              <p className="whitespace-pre-line text-ink/80">{ev.details}</p>
            </Panel>
          )}
          {isGame && (
            <Panel>
              <SectionTitle>About {ev.opponent}</SectionTitle>
              {oppRow ? (
                <dl className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Ladder", `${oppRow.position}`],
                    ["W-L", `${oppRow.won}-${oppRow.lost}`],
                    ["Points", `${oppRow.premiershipPoints}`],
                    ["%", oppRow.percentage.toFixed(0)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-chalk p-2">
                      <dd className="display-num text-3xl font-bold text-navy">{v}</dd>
                      <dt className="text-xs text-ink/60">{k}</dt>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-ink/60">They're not on the ladder yet.</p>
              )}
              <h3 className="mt-6 mb-2 text-xl font-bold text-navy">Head to head</h3>
              {h2h.played === 0 ? (
                <p className="text-sm text-ink/60">We haven't played them before. Fresh start.</p>
              ) : (
                <>
                  <p className="text-ink/80">
                    Played {h2h.played}, won {h2h.won}, lost {h2h.lost}
                    {h2h.drawn > 0 && `, drew ${h2h.drawn}`}. Average score {Math.round(h2h.for / h2h.played)} to{" "}
                    {Math.round(h2h.against / h2h.played)}.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {history.slice(0, 5).map((g) => {
                      const s = scoresOf(g);
                      return (
                        <li key={g.id} className="flex justify-between gap-2 border-t border-ink/10 pt-1">
                          <span className="text-ink/60">{formatDay(g.startsAt)}</span>
                          <span className="font-medium">
                            {s ? `${formatScore(s.team)} to ${formatScore(s.opp)}` : "No score"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Panel>
          )}
          {ev.kind === "game" && canLead(me.role) && votes === "open" && (
            <p className="text-sm text-ink/60">
              Votes close four days after the game. Tallies are on the Player's player page.
            </p>
          )}
        </div>
      </div>

      {ev.kind === "game" && (
        <TeamSection
          eventId={id}
          editable={canLead(me.role)}
          heading={<h2 className="mb-2 text-3xl font-bold text-navy">Team</h2>}
        />
      )}

      {isTraining && (
        <SessionPlan eventId={id} drills={sessionDrills} catalog={catalog} editable={canPlanSessions(me)} />
      )}
    </div>
  );
}
