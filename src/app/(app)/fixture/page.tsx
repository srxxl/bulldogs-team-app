import type { Metadata } from "next";
import { EventRowLink } from "@/components/event-row";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { CLUB } from "@/lib/club";
import { formatMonth, monthKey } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getMyRsvps, getSeason, getYesCounts } from "@/server/queries/events";

export const metadata: Metadata = { title: "Fixture" };

export default async function FixturePage() {
  const me = await requireMember();
  const season = await getSeason();
  const ids = season.map((e) => e.id);
  const [mine, yes] = await Promise.all([getMyRsvps(me.id, ids), getYesCounts(ids)]);

  const months = new Map<string, typeof season>();
  for (const e of season) {
    const k = monthKey(e.startsAt);
    months.set(k, [...(months.get(k) ?? []), e]);
  }

  return (
    <>
      <PageHeader title="Fixture" intro={`${CLUB.grade}, ${CLUB.league}. Games, socials and club events.`}>
        {me.isAdmin && <ButtonLink href="/admin/events/new">Add event</ButtonLink>}
      </PageHeader>
      {season.length === 0 ? (
        <EmptyState title="The fixture's empty">Games appear here once the PFL releases the draw.</EmptyState>
      ) : (
        <div className="space-y-10">
          {[...months].map(([key, events]) => (
            <section key={key}>
              <h2 className="sticky top-0 z-10 -mx-4 mb-3 bg-chalk/90 px-4 py-2 text-3xl font-bold text-navy backdrop-blur md:mx-0 md:px-0">
                {formatMonth(events[0].startsAt)}
              </h2>
              <div className="space-y-2">
                {events.map((e) => (
                  <EventRowLink key={e.id} ev={e} myStatus={mine.get(e.id)} yesCount={yes.get(e.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
