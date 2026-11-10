import type { Metadata } from "next";
import Link from "next/link";
import { BoardsNav } from "@/components/boards-nav";
import { TeamFeed } from "@/components/team-feed";
import { PageHeader } from "@/components/ui";
import { formatDateOnly, perthWeekStart } from "@/lib/time";
import { formatDistance, teamTotals } from "@/lib/workout";
import { requireMember } from "@/server/auth/session";
import { getCheers, getWeekDone, getWeekPicks } from "@/server/queries/content";

export const metadata: Metadata = { title: "The team's week" };

const isWeek = (w: unknown): w is string => typeof w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w);

/** What the team did this week (or an earlier week, from History), with "Nice one" on each log. */
export default async function TeamWeekPage({ searchParams }: PageProps<"/boards/team">) {
  const me = await requireMember();
  const thisWeek = perthWeekStart();
  const asked = (await searchParams).week;
  const week = isWeek(asked) && asked < thisWeek ? asked : thisWeek;
  const past = week !== thisWeek;
  const [done, picks] = await Promise.all([getWeekDone(week), getWeekPicks(week)]);
  const cheers = await getCheers(done.map((d) => d.id));
  const totals = teamTotals(done);

  return (
    <>
      <PageHeader title="Fitness and nutrition" />
      <BoardsNav current={past ? "/boards/history" : "/boards/team"} />
      <div className="max-w-2xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-navy">{past ? `Week of ${formatDateOnly(week)}` : "This week"}</h2>
            <p className="text-sm text-ink/60">
              {picks.length === 0 ? "Nothing was picked." : `Picked: ${picks.map((p) => p.title).join(", ")}.`}
            </p>
            {past && (
              <Link href="/boards/history" className="text-sm font-semibold text-red hover:underline">
                Back to your history
              </Link>
            )}
          </div>
          {done.length > 0 && (
            <dl className="flex gap-6">
              <div>
                <dd className="font-display text-4xl leading-none font-black text-navy">{done.length}</dd>
                <dt className="text-xs text-ink/55">things done</dt>
              </div>
              {totals.distanceM > 0 && (
                <div>
                  <dd className="font-display text-4xl leading-none font-black text-navy">
                    {formatDistance(totals.distanceM)}
                  </dd>
                  <dt className="text-xs text-ink/55">run by the team</dt>
                </div>
              )}
            </dl>
          )}
        </div>
        <TeamFeed
          done={done}
          cheers={cheers}
          meId={me.id}
          empty={
            past ? "Nobody logged anything that week." : "When someone does one of this week's picks, it shows up here."
          }
        />
      </div>
    </>
  );
}
