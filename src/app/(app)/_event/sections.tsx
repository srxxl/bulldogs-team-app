import { MapPin, Pencil } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";
import { GameNotes } from "@/components/game-notes";
import { GameTimeline } from "@/components/game-timeline";
import { GameVotes } from "@/components/game-votes";
import { MarginBar } from "@/components/margin-bar";
import { MatchCard } from "@/components/match-card";
import { NoteForm } from "@/components/note-form";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { TeamSection } from "@/components/team-board/team-section";
import { TeamSheetFill } from "@/components/team-sheet-fill";
import { ButtonLink, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameTile } from "@/lib/game-phase";
import { canModerate, canPickTeam } from "@/lib/roles";
import { formatScore, scoresOf } from "@/lib/score";
import { formatDay, formatLongDay, formatTime } from "@/lib/time";
import { timelineFor } from "@/lib/timeline";
import type { LoadedEvent } from "./load-event";

/** The navy header card: round, title, score, when and where, and for a social (until it's over) I'm in / Can't. */
export function EventHeader({ data }: { data: LoadedEvent }) {
  const { ev, me, scores, mine, upcoming } = data;
  const edit = me.isAdmin && (
    <ButtonLink
      href={`/admin/events/${ev.id}`}
      variant="ghost"
      className="min-h-10 shrink-0 px-3 text-white hover:bg-white/10"
    >
      <Pencil size={16} /> Edit
    </ButtonLink>
  );
  // a game: the fixture's match card, footy-record style, without I'm in / Can't (that's on the Who's in tile)
  if (data.isGame && ev.opponent)
    return (
      <MatchCard
        game={ev}
        leading={<BackButton href="/fixture" to="the fixture" className="text-white" />}
        actions={edit}
        extra={
          <>
            {scores && <MarginBar opponent={ev.opponent} isHome={ev.isHome} us={scores.team} them={scores.opp} />}
            {ev.details && <p className="mt-4 whitespace-pre-line text-white/85">{ev.details}</p>}
          </>
        }
      />
    );
  return (
    <header className="rounded-[28px] bg-navy p-5 text-white md:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-powder">
          <BackButton href="/fixture" to="the fixture" className="mr-1 text-white" />
          {ev.round && <span className="font-semibold">{ev.round}</span>}
          {ev.isHome != null && <Chip className="bg-white/10 text-white">{ev.isHome ? "Home" : "Away"}</Chip>}
          {ev.isFinal && <Chip className="bg-red text-white">Final</Chip>}
          {ev.cancelled && <Chip className="bg-red text-white">Cancelled</Chip>}
        </div>
        {edit}
      </div>
      <h1 className="mt-3 font-display text-[clamp(3rem,10vw,6rem)] font-black leading-[0.85]">{ev.title}</h1>
      {scores && ev.opponent && (
        <MarginBar opponent={ev.opponent} isHome={ev.isHome} us={scores.team} them={scores.opp} />
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
      {data.isGame && ev.details && <p className="mt-4 whitespace-pre-line text-white/85">{ev.details}</p>}
      {/* a game has them on its Who's in tile instead */}
      {!data.isGame && upcoming && !ev.cancelled && (
        <div className="mt-6 max-w-sm">
          <RsvpButtons eventId={ev.id} status={mine} tone="dark" />
        </div>
      )}
    </header>
  );
}

const GROUPS = [
  { status: "yes", label: "In" },
  { status: "no", label: "Out" },
] as const;

/** Who said they're in or out, with how close we are to a team sheet before a game. */
export function ComingBody({ data, withRsvp }: { data: LoadedEvent; withRsvp?: boolean }) {
  const { ev, me, rsvps, yes, mine, upcoming } = data;
  const open = upcoming && !ev.cancelled;
  return (
    <>
      {data.isGame && open && (
        <div className="mb-5">
          <TeamSheetFill yes={yes.length} />
        </div>
      )}
      {withRsvp && open && (
        <div className="mb-6">
          <RsvpButtons eventId={ev.id} status={mine} />
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
    </>
  );
}

/** The opponent's spot on the ladder and our record against them. */
export function OpponentBody({ data }: { data: LoadedEvent }) {
  const { oppRow, h2h, history } = data;
  return (
    <>
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
    </>
  );
}

/** The game day timeline, editable by skips, coaches and admins. */
export function TimelineBody({ data }: { data: LoadedEvent }) {
  const { ev, me } = data;
  return (
    <GameTimeline
      eventId={ev.id}
      bounce={ev.startsAt}
      steps={timelineFor(ev.timeline)}
      custom={ev.timeline != null}
      canEdit={canPickTeam(me)}
    />
  );
}

/** Each tile's own page: its title and what fills it. */
export function tilePage(tile: GameTile, data: LoadedEvent) {
  const { ev, me } = data;
  switch (tile) {
    case "coming":
      return {
        title: data.upcoming ? "Who's coming" : "Who said they'd come",
        meta: `${data.yes.length} in`,
        body: <ComingBody data={data} withRsvp />,
      };
    case "team":
      return { title: "Team", body: <TeamSection eventId={ev.id} editable={canPickTeam(me)} /> };
    case "timeline":
      return { title: "Game day", body: <TimelineBody data={data} /> };
    case "notes":
      return {
        title: "Notes",
        meta: data.notes.length || undefined,
        action: <NoteForm eventId={ev.id} />,
        body: <GameNotes notes={data.notes} canDelete={(n) => n.authorId === me.id || canModerate(me)} />,
      };
    case "opponent":
      return { title: data.opponent ? `About ${data.opponent}` : "Opponent", body: <OpponentBody data={data} /> };
    case "votes":
      return {
        title: "Player's player",
        body: <GameVotes eventId={ev.id} candidates={data.candidates} ballot={data.ballot} results={data.results} />,
      };
  }
}
