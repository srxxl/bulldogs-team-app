import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { Morph, morphName } from "@/components/morph";
import { EmptyState, PageHeader, RedRule } from "@/components/ui";
import { CLUB, isUs } from "@/lib/club";
import { clubGuernsey, teamSlug } from "@/lib/club-colours";
import { cn } from "@/lib/cn";
import { formatDay } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getLadder } from "@/server/queries/content";

export const metadata: Metadata = { title: "Ladder" };

/** The PFL plays a final five in every women's grade. */
const FINALS_SPOTS = 5;

/** The full ladder, set like a footy record's ladder page. Each team opens its own page, in its club colours. */
export default async function LadderPage() {
  await requireMember();
  const rows = await getLadder();
  const updated = rows.length ? new Date(Math.max(...rows.map((r) => r.updatedAt.getTime()))) : null;

  return (
    <>
      <PageHeader title="Ladder" />
      {rows.length === 0 ? (
        <EmptyState title="No ladder yet">
          It appears here once it syncs from PlayHQ, or once an admin pastes it into Settings, PFL data.
        </EmptyState>
      ) : (
        <section aria-label={`${CLUB.grade} ladder`}>
          <ol className="space-y-2">
            {rows.map((r) => {
              const mine = isUs(r.team);
              const design = clubGuernsey(r.team);
              const record = [
                `${r.won} won`,
                `${r.lost} lost`,
                r.drawn > 0 ? `${r.drawn} drawn` : null,
                `${r.percentage.toFixed(1)}%`,
              ]
                .filter(Boolean)
                .join(", ");
              return (
                <Fragment key={r.position}>
                  <li>
                    {/* a card per team, set like a footy record's ladder: a big outlined position, the team large, points on the
                      right over the club's guernsey design fading in */}
                    <Morph name={morphName.team(teamSlug(r.team))}>
                      <Link
                        href={`/ladder/${teamSlug(r.team)}`}
                        className={cn(
                          "group relative grid grid-cols-[2.6rem_1fr_auto] items-center gap-3 overflow-hidden rounded-2xl bg-white px-4 py-3 transition-colors hover:bg-mist md:grid-cols-[3.6rem_1fr_auto] md:gap-4 md:px-6",
                          mine ? "text-red" : "text-ink",
                        )}
                      >
                        <span
                          className={cn(
                            "display-num num-outline relative text-5xl font-extrabold md:text-6xl",
                            mine ? "text-red" : "text-navy",
                          )}
                        >
                          {r.position}
                        </span>
                        {design && (
                          <span
                            aria-hidden
                            className="ladder-design absolute inset-y-0 right-0 w-2/5 bg-cover bg-center"
                            style={{ backgroundImage: `url(${design})` }}
                          />
                        )}
                        <span className="relative min-w-0">
                          <span className="block font-display text-3xl leading-none font-extrabold group-hover:underline">
                            {r.team}
                          </span>
                          <span className="mt-1 block text-sm text-ink/60">{record}</span>
                        </span>
                        <span className="ladder-points display-num relative text-5xl font-extrabold md:text-6xl">
                          <span className="sr-only">Points </span>
                          {r.premiershipPoints}
                        </span>
                      </Link>
                    </Morph>
                  </li>
                  {/* the finals line, under the last team that makes it */}
                  {r.position === FINALS_SPOTS && rows.length > FINALS_SPOTS && (
                    <li className="py-2">
                      <RedRule as="p">Finals</RedRule>
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>
          {updated && <p className="mt-6 text-sm text-ink/60">Updated {formatDay(updated)}.</p>}
        </section>
      )}
    </>
  );
}
