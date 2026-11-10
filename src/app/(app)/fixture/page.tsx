import { ArrowUpRight, Vote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EventRowLink } from "@/components/event-row";
import { MatchCard } from "@/components/match-card";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { findByes } from "@/lib/byes";
import { CLUB } from "@/lib/club";
import { cn } from "@/lib/cn";
import { isCoach } from "@/lib/roles";
import { formatDay, formatMonth, monthKey, perthToday } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getMyBallot } from "@/server/queries/content";
import { getLastGame, getMyRsvps, getNextGame, getSeason, getYesCounts } from "@/server/queries/events";

export const metadata: Metadata = { title: "Fixture" };

type Bye = { round: string; startsAt: Date };

/** A round we don't play: a quiet grey card where the game would be. */
function ByeCard({ bye }: { bye: Bye }) {
  return (
    // stacked in the middle, where the game rows have "vs", the round and the date
    <div className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-ink/[0.07] px-3 py-2 text-center">
      <p className="font-display text-lg leading-none font-bold text-ink/50">Bye</p>
      <p className="text-xs leading-snug text-ink/60">
        <span className="block">{bye.round}</span>
        {formatDay(bye.startsAt)}
      </p>
    </div>
  );
}

export default async function FixturePage() {
  const me = await requireMember();
  const now = new Date();
  const [season, nextGame, lastGame] = await Promise.all([getSeason(), getNextGame(now), getLastGame(now)]);
  const ids = season.map((e) => e.id);
  // player's player: from the start of a game until the end of that day (Perth), for players who haven't voted
  const voteDay = lastGame && !isCoach(me.role) && perthToday(lastGame.startsAt) === perthToday(now) ? lastGame : null;
  const [mine, yes, ballot] = await Promise.all([
    getMyRsvps(me.id, ids),
    getYesCounts(ids),
    voteDay ? getMyBallot(voteDay.id, me.id) : null,
  ]);
  const voteFor = voteDay && !ballot ? voteDay : null;

  // games and other events, with our byes slotted in by date
  type Item = { bye: Bye } | { ev: (typeof season)[number] };
  const items: Item[] = [
    ...season.map((ev) => ({ ev })),
    ...findByes(season.filter((e) => e.kind === "game")).map((bye) => ({ bye })),
  ];
  const at = (i: Item) => ("bye" in i ? i.bye.startsAt : i.ev.startsAt);
  items.sort((a, b) => at(a).getTime() - at(b).getTime());
  const months = new Map<string, Item[]>();
  for (const i of items) {
    const k = monthKey(at(i));
    months.set(k, [...(months.get(k) ?? []), i]);
  }

  return (
    <div className="space-y-10">
      <PageHeader title="Fixture" intro={`${CLUB.grade}, ${CLUB.league}. Games, socials and club events.`} />

      {(nextGame || voteFor) && (
        <section aria-label="Next game">
          {voteFor && (
            // a red strip along the top of the card
            <Link
              href={`/fixture/${voteFor.id}#votes`}
              className={cn(
                "flex min-h-14 items-center gap-3 bg-red px-5 py-3 text-white transition-colors hover:bg-red-deep md:px-8",
                nextGame ? "rounded-t-[28px]" : "rounded-[28px]",
              )}
            >
              <Vote size={22} aria-hidden className="shrink-0" />
              <span className="flex-1">
                <span className="block font-display text-2xl leading-none font-bold">Vote for player's player</span>
                <span className="text-sm text-white/85">{voteFor.title}</span>
              </span>
              <ArrowUpRight aria-hidden className="shrink-0" />
            </Link>
          )}
          {nextGame && (
            <MatchCard
              game={nextGame}
              myStatus={mine.get(nextGame.id) ?? null}
              yesCount={yes.get(nextGame.id) ?? 0}
              className={voteFor ? "rounded-t-none" : undefined}
            />
          )}
        </section>
      )}

      <section aria-labelledby="season-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="season-heading" className="text-3xl font-bold text-navy md:text-4xl">
            Season
          </h2>
          {me.isAdmin && <ButtonLink href="/admin/events/new">Add event</ButtonLink>}
        </div>

        {season.length === 0 ? (
          <EmptyState title="The fixture's empty">Games appear here once the PFL releases the draw.</EmptyState>
        ) : (
          <div className="space-y-10">
            {[...months].map(([key, monthItems]) => (
              <section key={key}>
                <h3 className="sticky top-0 z-10 -mx-4 mb-3 bg-chalk/90 px-4 py-2 text-2xl font-bold text-navy backdrop-blur md:mx-0 md:px-0">
                  {formatMonth(at(monthItems[0]))}
                </h3>
                <div className="space-y-2">
                  {monthItems.map((i) =>
                    "bye" in i ? (
                      <ByeCard key={i.bye.round} bye={i.bye} />
                    ) : (
                      <EventRowLink key={i.ev.id} ev={i.ev} myStatus={mine.get(i.ev.id)} yesCount={yes.get(i.ev.id)} />
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
