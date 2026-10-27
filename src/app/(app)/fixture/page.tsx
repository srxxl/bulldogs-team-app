import { CalendarDays, List } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EventRowLink } from "@/components/event-row";
import { FixtureCalendar } from "@/components/fixture-calendar";
import { MatchCard } from "@/components/match-card";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { CLUB } from "@/lib/club";
import { cn } from "@/lib/cn";
import { formatMonth, monthKey } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getMyRsvps, getNextGame, getSeason, getYesCounts } from "@/server/queries/events";

export const metadata: Metadata = { title: "Fixture" };

export default async function FixturePage({ searchParams }: PageProps<"/fixture">) {
  const view = (await searchParams).view === "calendar" ? "calendar" : "list";
  const me = await requireMember();
  const [season, nextGame] = await Promise.all([getSeason(), getNextGame()]);
  const ids = season.map((e) => e.id);
  const [mine, yes] = await Promise.all([getMyRsvps(me.id, ids), getYesCounts(ids)]);

  const months = new Map<string, typeof season>();
  for (const e of season) {
    const k = monthKey(e.startsAt);
    months.set(k, [...(months.get(k) ?? []), e]);
  }

  return (
    <div className="space-y-10">
      <PageHeader title="Fixture" intro={`${CLUB.grade}, ${CLUB.league}. Games, socials and club events.`}>
        {me.isAdmin && <ButtonLink href="/admin/events/new">Add event</ButtonLink>}
      </PageHeader>

      {nextGame && (
        <section aria-label="Next game">
          <MatchCard game={nextGame} myStatus={mine.get(nextGame.id) ?? null} yesCount={yes.get(nextGame.id) ?? 0} />
        </section>
      )}

      <section aria-labelledby="season-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="season-heading" className="text-3xl font-bold text-navy md:text-4xl">
            Season
          </h2>
          <nav aria-label="Fixture view" className="flex rounded-xl bg-mist p-1">
            {(
              [
                ["list", "List", List],
                ["calendar", "Calendar", CalendarDays],
              ] as const
            ).map(([v, label, Icon]) => (
              <Link
                key={v}
                href={v === "list" ? "/fixture" : "/fixture?view=calendar"}
                aria-current={view === v ? "page" : undefined}
                scroll={false}
                className={cn(
                  "flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold",
                  view === v ? "bg-white text-navy" : "text-navy/70 hover:text-navy",
                )}
              >
                <Icon size={16} aria-hidden /> {label}
              </Link>
            ))}
          </nav>
        </div>

        {season.length === 0 ? (
          <EmptyState title="The fixture's empty">Games appear here once the PFL releases the draw.</EmptyState>
        ) : view === "calendar" ? (
          <FixtureCalendar events={season} mine={mine} />
        ) : (
          <div className="space-y-10">
            {[...months].map(([key, events]) => (
              <section key={key}>
                <h3 className="sticky top-0 z-10 -mx-4 mb-3 bg-chalk/90 px-4 py-2 text-2xl font-bold text-navy backdrop-blur md:mx-0 md:px-0">
                  {formatMonth(events[0].startsAt)}
                </h3>
                <div className="space-y-2">
                  {events.map((e) => (
                    <EventRowLink key={e.id} ev={e} myStatus={mine.get(e.id)} yesCount={yes.get(e.id)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
