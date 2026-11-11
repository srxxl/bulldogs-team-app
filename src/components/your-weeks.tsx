import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { bestStreak, currentStreak, type HoopWeek, hoop } from "@/lib/hoops";
import { formatDateOnly } from "@/lib/time";

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

/**
 * Your weeks, at the foot of the Fitness page, like the form column in a footy record: your streak as a big
 * outlined number, then each week as a chip (a red tick when complete, otherwise a circle with a slice per activity, navy where you did it),
 * a month at a time. Swipe back through the months; it starts on this one. A past week's chip opens what the team
 * did that week. Weeks with nothing picked aren't shown.
 */
export function YourWeeks({ weeks, thisWeek }: { weeks: HoopWeek[]; thisWeek: string }) {
  const picked = weeks.filter((w) => w.picks.length > 0 && w.week <= thisWeek);
  const streak = currentStreak(weeks, thisWeek);
  const best = bestStreak(weeks);
  const complete = picked.filter((w) => hoop(w).closed).length;

  // newest first, both the months and the weeks in each, so this week is at the far left where the swipe starts
  const months = new Map<string, HoopWeek[]>();
  for (const w of [...picked].reverse()) {
    const key = w.week.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), w]);
  }

  return (
    <section id="weeks" aria-labelledby="weeks-title" className="scroll-mt-6 rounded-[28px] bg-white p-5 md:p-7">
      <h2 id="weeks-title" className="sr-only">
        Your weeks
      </h2>
      <div className="flex items-end gap-4">
        <span aria-hidden className="display-num num-outline text-[7rem] text-navy">
          {streak}
        </span>
        <div className="pb-2">
          <p className="font-display text-3xl leading-none font-black text-navy">
            <span className="sr-only">{streak} </span>week streak
          </p>
          {picked.length > 0 && (
            <p className="mt-1 text-sm text-ink/60">
              Best {best}, {complete} complete all up
            </p>
          )}
        </div>
      </div>

      {picked.length === 0 ? (
        <p className="mt-4 text-ink/60">Your weeks show up here once the skips and coaches start picking.</p>
      ) : (
        <ul
          aria-label="Your weeks, month by month"
          className="-mx-5 mt-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:-mx-7 md:scroll-px-7 md:px-7"
        >
          {[...months].map(([key, ws]) => {
            return (
              <li key={key} className="shrink-0 snap-start rounded-2xl bg-chalk p-4">
                <h3 className="font-display text-2xl font-bold text-navy">
                  {MONTHS[Number(key.slice(5)) - 1]}
                  {key.slice(0, 4) !== thisWeek.slice(0, 4) && ` ${key.slice(0, 4)}`}
                </h3>
                <ol className="mt-3 flex gap-2">
                  {ws.map((w) => (
                    <li key={w.week}>
                      <WeekChip week={w} now={w.week === thisWeek} />
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * A week not yet complete: a circle cut into a slice per activity, the ones you did in navy (red is kept for
 * complete weeks). The slices are parted
 * by lines the colour of the card behind (chalk).
 */
function Pie({ total, done, className }: { total: number; done: number; className?: string }) {
  const point = (i: number) => {
    const a = (i / total) * 2 * Math.PI - Math.PI / 2; // from the top, clockwise
    return `${(24 + 24 * Math.cos(a)).toFixed(2)} ${(24 + 24 * Math.sin(a)).toFixed(2)}`;
  };
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-12 shrink-0 rounded-full", className)}>
      {total <= 1 ? (
        <circle cx="24" cy="24" r="24" className={done ? "fill-navy" : "fill-powder"} />
      ) : (
        Array.from({ length: total }, (_, i) => (
          <path
            // biome-ignore lint/suspicious/noArrayIndexKey: slices are positional
            key={i}
            d={`M24 24 L${point(i)} A24 24 0 0 1 ${point(i + 1)} Z`}
            className={cn("stroke-chalk", i < done ? "fill-navy" : "fill-powder")}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        ))
      )}
    </svg>
  );
}

function WeekChip({ week, now }: { week: HoopWeek; now: boolean }) {
  const h = hoop(week);
  const label = now ? "This week" : formatDateOnly(week.week);
  const chip = (
    <>
      {h.closed ? (
        <span
          className={cn(
            "grid size-12 place-items-center rounded-full bg-red text-white",
            now && "ring-2 ring-navy ring-offset-2 ring-offset-chalk",
          )}
        >
          <Check size={20} strokeWidth={3} aria-hidden />
        </span>
      ) : (
        <Pie total={h.total} done={h.done} className={cn(now && "ring-2 ring-navy ring-offset-2 ring-offset-chalk")} />
      )}
      <span className={cn("text-xs whitespace-nowrap", now ? "font-bold text-navy" : "font-semibold text-ink/55")}>
        {now ? "Now" : label}
      </span>
    </>
  );
  const a11y = `${label}: ${h.closed ? "complete" : `${h.done} of ${h.total} done`}`;
  return now ? (
    <div role="img" aria-label={a11y} className="flex flex-col items-center gap-1.5">
      {chip}
    </div>
  ) : (
    <Link
      href={`/boards/team?week=${week.week}`}
      aria-label={`${a11y}. See what the team did`}
      className="-m-1 flex flex-col items-center gap-1.5 rounded-2xl p-1 hover:bg-white focus-visible:outline-2 focus-visible:outline-navy"
    >
      {chip}
    </Link>
  );
}
