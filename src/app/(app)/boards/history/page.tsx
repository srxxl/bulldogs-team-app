import type { Metadata } from "next";
import Link from "next/link";
import { BoardsNav } from "@/components/boards-nav";
import { HoopRing } from "@/components/hoop-ring";
import { PageHeader, RedRule } from "@/components/ui";
import { bestStreak, hoop } from "@/lib/hoops";
import { formatDateOnly, perthWeekStart } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getMyHoopWeeks } from "@/server/queries/content";

export const metadata: Metadata = { title: "Your history" };

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Your weeks as hoops, month by month (tap one to see that week). */
export default async function HistoryPage() {
  const me = await requireMember();
  const thisWeek = perthWeekStart();
  const { weeks } = await getMyHoopWeeks(me.id, thisWeek);
  const picked = weeks.filter((w) => w.picks.length > 0).reverse();
  const closed = picked.filter((w) => hoop(w).closed).length;
  const best = bestStreak(weeks);

  // newest month first; within a month, oldest week first like a calendar
  const months = new Map<string, typeof picked>();
  for (const w of picked) {
    const [y, m] = w.week.split("-").map(Number);
    const key = `${MONTHS[m - 1]} ${y}`;
    months.set(key, [w, ...(months.get(key) ?? [])]);
  }

  return (
    <>
      <PageHeader title="Fitness" />
      <BoardsNav current="/boards/history" />
      <div className="max-w-3xl">
        <section aria-labelledby="weeks-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="weeks-heading" className="text-3xl font-bold text-navy">
              Your weeks
            </h2>
            <dl className="flex gap-6">
              <div>
                <dd className="font-display text-4xl leading-none font-black text-navy">{closed}</dd>
                <dt className="text-xs text-ink/55">{closed === 1 ? "hoop closed" : "hoops closed"}</dt>
              </div>
              <div>
                <dd className="font-display text-4xl leading-none font-black text-navy">{best}</dd>
                <dt className="text-xs text-ink/55">best run of weeks</dt>
              </div>
            </dl>
          </div>
          {picked.length === 0 ? (
            <p className="mt-4 text-ink/60">Your weeks show up here once the skips and coaches start picking.</p>
          ) : (
            [...months].map(([month, ws]) => (
              <div key={month} className="mt-6">
                <RedRule className="text-xl">{month}</RedRule>
                <ul className="mt-2 grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {ws.map((w) => {
                    const h = hoop(w);
                    const label = w.week === thisWeek ? "This week" : formatDateOnly(w.week);
                    return (
                      <li key={w.week}>
                        <Link
                          href={w.week === thisWeek ? "/boards" : `/boards/team?week=${w.week}`}
                          aria-label={`${label}: ${h.done} of ${h.total} done`}
                          className="flex flex-col items-center gap-1 rounded-2xl p-1 hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-navy"
                        >
                          <HoopRing total={h.total} done={h.done} size={60} tone="light" />
                          <span
                            className={
                              w.week === thisWeek
                                ? "text-xs font-semibold text-red"
                                : "text-xs font-semibold text-ink/60"
                            }
                          >
                            {label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}
