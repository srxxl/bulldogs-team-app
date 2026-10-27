import { ChevronLeft, MapPin, Pencil, Vote } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { GameNotes } from "@/components/game-notes";
import { NoteForm } from "@/components/note-form";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { SectionPanel } from "@/components/section-panel";
import { TeamSection } from "@/components/team-board/team-section";
import { ButtonLink, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import { canLead, canModerate, canPickTeam } from "@/lib/roles";
import { formatScore, headToHead, resultOf, scoresOf } from "@/lib/score";
import { formatDay, formatLongDay, formatTime } from "@/lib/time";
import { voteWindow } from "@/lib/votes";
import { requireMember } from "@/server/auth/session";
import { getGameNotes, getLadder } from "@/server/queries/content";
import { getEvent, getPastGamesAgainst, getRsvps } from "@/server/queries/events";

const GROUPS = [
  { status: "yes", label: "In" },
  { status: "no", label: "Out" },
] as const;

/** A game or club event's page. Training sessions live on their card on the Training page instead. */
export async function EventDetail({ id }: { id: string }) {
  const me = await requireMember();
  const ev = await getEvent(id);
  if (!ev) notFound();
  if (ev.kind === "training") redirect(`/training#s-${id}`);

  const isGame = ev.kind === "game" && ev.opponent;
  const [rsvps, history, ladder, notes] = await Promise.all([
    getRsvps(id),
    isGame ? getPastGamesAgainst(ev.opponent as string, ev.startsAt) : [],
    isGame ? getLadder() : [],
    ev.kind === "game" ? getGameNotes(id) : [],
  ]);
  const mine = rsvps.find((r) => r.userId === me.id)?.status ?? null;
  const upcoming = (ev.endsAt ?? ev.startsAt) > new Date();
  const scores = scoresOf(ev);
  const h2h = headToHead(history);
  const oppRow = ladder.find((r) => isGame && r.team.toLowerCase() === ev.opponent?.toLowerCase());
  const votes = ev.kind === "game" ? voteWindow(ev.startsAt) : null;

  return (
    <div className="space-y-6">
      <Link
        href="/fixture"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-navy hover:bg-white/60"
      >
        <ChevronLeft size={18} aria-hidden /> Fixture
      </Link>
      <header className="rounded-[28px] bg-navy p-5 text-white md:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 pt-2 text-sm text-powder">
            {ev.round && <span className="font-semibold">{ev.round}</span>}
            {ev.isHome != null && <Chip className="bg-white/10 text-white">{ev.isHome ? "Home" : "Away"}</Chip>}
            {ev.isFinal && <Chip className="bg-red text-white">Final</Chip>}
            {ev.cancelled && <Chip className="bg-red text-white">Cancelled</Chip>}
          </div>
          {me.isAdmin && (
            <ButtonLink
              href={`/admin/events/${id}`}
              variant="ghost"
              className="min-h-10 shrink-0 px-3 text-white hover:bg-white/10"
            >
              <Pencil size={16} /> Edit
            </ButtonLink>
          )}
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
        {votes === "open" && (
          <div className="mt-6">
            <ButtonLink href={`/fixture/${id}/vote`} variant="red">
              <Vote size={18} /> Player's player votes
            </ButtonLink>
          </div>
        )}
      </header>

      {ev.kind === "game" && (
        <SectionPanel id="notes" title="Notes" meta={notes.length || undefined} action={<NoteForm eventId={id} />}>
          <GameNotes notes={notes} canDelete={(n) => n.authorId === me.id || canModerate(me)} />
        </SectionPanel>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <SectionPanel
          id="coming"
          title={upcoming ? "Who's coming" : "Who said they'd come"}
          meta={`${rsvps.filter((r) => r.status === "yes").length} in`}
        >
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
        </SectionPanel>

        <div className="space-y-6">
          {ev.details && (
            <SectionPanel id="details" title="Details">
              <p className="whitespace-pre-line text-ink/80">{ev.details}</p>
            </SectionPanel>
          )}
          {isGame && (
            <SectionPanel id="opponent" title={`About ${ev.opponent}`}>
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
            </SectionPanel>
          )}
          {ev.kind === "game" && canLead(me.role) && votes === "open" && (
            <p className="text-sm text-ink/60">
              Votes close four days after the game. Tallies are on the Player's player page.
            </p>
          )}
        </div>
      </div>

      {ev.kind === "game" && (
        <SectionPanel id="team" title="Team">
          <TeamSection eventId={id} editable={canPickTeam(me)} />
        </SectionPanel>
      )}
    </div>
  );
}
