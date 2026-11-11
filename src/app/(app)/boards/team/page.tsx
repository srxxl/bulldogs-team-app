import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { TeamFeed } from "@/components/team-feed";
import { formatDateOnly, perthWeekStart } from "@/lib/time";
import { formatDistance, teamTotals } from "@/lib/workout";
import { requireMember } from "@/server/auth/session";
import { getWeekDone, getWeekPicks } from "@/server/queries/content";

export const metadata: Metadata = { title: "A past week" };

const isWeek = (w: unknown): w is string => typeof w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w);

/**
 * What the team did in an earlier week, opened from your weeks on the Fitness page. This week's logs are on
 * the Fitness page, under each activity, so anything else goes there.
 */
export default async function TeamWeekPage({ searchParams }: PageProps<"/boards/team">) {
  await requireMember();
  const thisWeek = perthWeekStart();
  const asked = (await searchParams).week;
  if (!isWeek(asked) || asked >= thisWeek) redirect("/boards/fitness");
  const week = asked;
  const [done, picks] = await Promise.all([getWeekDone(week), getWeekPicks(week)]);
  const totals = teamTotals(done);

  return (
    <div className="max-w-2xl space-y-6">
      <header className="rounded-[28px] bg-white p-5 md:p-7">
        <div className="flex items-start gap-3">
          <BackButton href="/boards/fitness#weeks" to="your weeks" className="text-navy" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-navy">Week of {formatDateOnly(week)}</h1>
            <p className="text-sm text-ink/60">
              {picks.length === 0 ? "Nothing was picked." : `Picked: ${picks.map((p) => p.title).join(", ")}.`}
            </p>
          </div>
        </div>
        {done.length > 0 && (
          <dl className="mt-4 flex gap-6 pl-14">
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
      </header>
      <TeamFeed done={done} empty="Nobody logged anything that week." />
    </div>
  );
}
