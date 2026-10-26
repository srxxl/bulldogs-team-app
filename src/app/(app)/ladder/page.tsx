import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/ui";
import { CLUB, isUs } from "@/lib/club";
import { cn } from "@/lib/cn";
import { formatDay } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getLadder } from "@/server/queries/content";

export const metadata: Metadata = { title: "Ladder" };

export default async function LadderPage() {
  await requireMember();
  const ladder = await getLadder();
  const updated = ladder.reduce<Date | null>((d, r) => (!d || r.updatedAt > d ? r.updatedAt : d), null);
  const cols = ["P", "W", "L", "D", "For", "Agst", "%", "Pts"];

  return (
    <>
      <PageHeader
        title="Ladder"
        intro={`${CLUB.grade}, ${CLUB.league}.${updated ? ` Updated ${formatDay(updated)}.` : ""}`}
      />
      {ladder.length === 0 ? (
        <EmptyState title="No ladder yet">
          It shows up once the season starts and the coaches sync it from PlayHQ.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-[28px] bg-white p-2 md:p-4">
          <table className="w-full min-w-[560px] border-separate border-spacing-y-1 text-right">
            <caption className="sr-only">PFL {CLUB.grade} ladder</caption>
            <thead>
              <tr className="text-xs text-ink/60">
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Team
                </th>
                {cols.map((c) => (
                  <th key={c} scope="col" className="px-2 py-2 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ladder.map((r) => {
                const us = isUs(r.team);
                return (
                  <tr key={r.position} className={cn(us ? "bg-navy text-white" : "odd:bg-chalk/60")}>
                    <th scope="row" className="rounded-l-xl px-3 py-2.5 text-left font-semibold">
                      <span className="display-num mr-3 inline-block w-6 text-2xl">{r.position}</span>
                      {r.team}
                    </th>
                    {[r.played, r.won, r.lost, r.drawn, r.pointsFor, r.pointsAgainst, r.percentage.toFixed(1)].map(
                      (v, i) => (
                        <td key={cols[i]} className="px-2 tabular-nums">
                          {v}
                        </td>
                      ),
                    )}
                    <td className="display-num rounded-r-xl px-3 text-2xl font-bold">{r.premiershipPoints}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
