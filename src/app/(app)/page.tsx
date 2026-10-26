import { ArrowUpRight, Vote } from "lucide-react";
import Link from "next/link";
import { EventRowLink } from "@/components/event-row";
import { MatchCard } from "@/components/match-card";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { ButtonLink, EmptyState, Panel, SectionTitle } from "@/components/ui";
import { isUs } from "@/lib/club";
import { cn } from "@/lib/cn";
import { formatDay, formatTime } from "@/lib/time";
import { voteWindow } from "@/lib/votes";
import { requireMember } from "@/server/auth/session";
import { getFeaturedNote, getLadder, getMyBallot } from "@/server/queries/content";
import { getLastGame, getMyRsvps, getNextGame, getUpcoming, getYesCounts } from "@/server/queries/events";

export default async function HomePage() {
  const me = await requireMember();
  const [nextGame, lastGame, training, upcoming, note, ladder] = await Promise.all([
    getNextGame(),
    getLastGame(),
    getUpcoming({ kind: "training", limit: 2 }),
    getUpcoming({ limit: 4 }),
    getFeaturedNote(),
    getLadder(),
  ]);
  const ids = [nextGame, ...training].filter((e) => e !== null).map((e) => e.id);
  const voteOpen = lastGame && voteWindow(lastGame.startsAt) === "open";
  const [myRsvps, yesCounts, ballot] = await Promise.all([
    getMyRsvps(me.id, ids),
    getYesCounts(ids),
    voteOpen ? getMyBallot(lastGame.id, me.id) : null,
  ]);
  const usIdx = ladder.findIndex((r) => isUs(r.team));
  const ladderSlice = usIdx === -1 ? ladder.slice(0, 4) : ladder.slice(Math.max(0, usIdx - 2), usIdx + 2);
  const rest = upcoming.filter((e) => e.id !== nextGame?.id).slice(0, 3);

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex items-end justify-between">
        <h1 className="text-4xl font-extrabold text-navy md:text-6xl">G'day, {me.name.split(" ")[0]}</h1>
      </header>

      {voteOpen && !ballot && (
        <Link
          href={`/fixture/${lastGame.id}/vote`}
          className="flex items-center gap-4 rounded-2xl bg-red p-4 text-white transition-colors hover:bg-red-deep"
        >
          <Vote size={28} className="shrink-0" />
          <span className="flex-1">
            <span className="block font-display text-2xl font-bold">Player's player votes are open</span>
            <span className="text-sm text-white/85">Give your 3, 2 and 1 for {lastGame.title}.</span>
          </span>
          <ArrowUpRight />
        </Link>
      )}

      {nextGame ? (
        <MatchCard
          game={nextGame}
          myStatus={myRsvps.get(nextGame.id) ?? null}
          yesCount={yesCounts.get(nextGame.id) ?? 0}
        />
      ) : (
        <EmptyState title="No games on the fixture yet">
          The PFL fixture shows up here once it's released. Your team admin can add games in Admin.
        </EmptyState>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] md:gap-8">
        <div className="space-y-6 md:space-y-8">
          {note && (
            <Panel className="relative">
              <p className="text-sm font-semibold text-red">
                {note.role === "captain" ? "Captain's note" : "Coach's note"} from{" "}
                {note.preferredName || note.name.split(" ")[0]}
              </p>
              <h2 className="mt-1 text-4xl font-extrabold text-navy">{note.title}</h2>
              <p className="mt-3 line-clamp-6 whitespace-pre-line text-ink/80">{note.body}</p>
              <Link
                href="/notes"
                className="mt-4 inline-block text-sm font-semibold text-navy underline underline-offset-4"
              >
                All notes
              </Link>
            </Panel>
          )}

          <section>
            <SectionTitle
              action={
                <Link href="/training" className="text-sm font-semibold text-navy underline underline-offset-4">
                  All sessions
                </Link>
              }
            >
              Training this week
            </SectionTitle>
            {training.length === 0 ? (
              <EmptyState title="No sessions scheduled">Training polls switch on when pre-season starts.</EmptyState>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {training.map((t) => (
                  <div key={t.id} className="rounded-2xl bg-white p-4">
                    <p className="font-display text-2xl font-bold text-navy">{formatDay(t.startsAt)}</p>
                    <p className="mb-3 text-sm text-ink/60">
                      {formatTime(t.startsAt)}, {yesCounts.get(t.id) ?? 0} coming
                    </p>
                    <RsvpButtons eventId={t.id} status={myRsvps.get(t.id) ?? null} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6 md:space-y-8">
          {ladder.length > 0 && (
            <Panel>
              <SectionTitle
                action={
                  <Link href="/ladder" className="text-sm font-semibold text-navy underline underline-offset-4">
                    Full ladder
                  </Link>
                }
              >
                Ladder
              </SectionTitle>
              <ol className="space-y-1">
                {ladderSlice.map((r) => (
                  <li
                    key={r.position}
                    className={cn("flex items-center gap-3 rounded-xl px-3 py-2", isUs(r.team) && "bg-navy text-white")}
                  >
                    <span className="display-num w-7 text-2xl font-bold">{r.position}</span>
                    <span className="flex-1 truncate font-medium">{r.team}</span>
                    <span className="text-sm opacity-70">{r.percentage.toFixed(1)}%</span>
                    <span className="display-num w-8 text-right text-2xl font-bold">{r.premiershipPoints}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          )}

          {rest.length > 0 && (
            <section>
              <SectionTitle>Coming up</SectionTitle>
              <div className="space-y-2">
                {rest.map((e) => (
                  <EventRowLink key={e.id} ev={e} />
                ))}
              </div>
            </section>
          )}

          <ButtonLink href="/feedback" variant="outline" className="w-full">
            Leave an anonymous note for the coaches
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
