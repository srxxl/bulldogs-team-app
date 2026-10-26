import Link from "next/link";
import { cn } from "@/lib/cn";
import { dayKey, formatMonth, formatTime, monthGrid, monthKey } from "@/lib/time";
import type { AvailabilityStatus, EventRow } from "@/server/db/schema";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Month-by-month calendar of the season. Games are navy, other events powder; your RSVP shows as a dot. */
export function FixtureCalendar({ events, mine }: { events: EventRow[]; mine: Map<string, AvailabilityStatus> }) {
  const byDay = new Map<string, EventRow[]>();
  for (const e of events) byDay.set(dayKey(e.startsAt), [...(byDay.get(dayKey(e.startsAt)) ?? []), e]);
  const months = [...new Map(events.map((e) => [monthKey(e.startsAt), e.startsAt])).values()];

  return (
    <div className="space-y-8">
      {months.map((m) => (
        <section key={monthKey(m)} className="rounded-[28px] bg-white p-3 md:p-5">
          <h2 className="mb-3 px-1 text-3xl font-bold text-navy">{formatMonth(m)}</h2>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink/50">
            {WEEKDAYS.map((d) => (
              <span key={d} className="pb-1">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid(m)
              .flat()
              .map((d) => {
                const items = d.inMonth ? (byDay.get(d.key) ?? []) : [];
                return (
                  <div
                    key={d.key}
                    className={cn(
                      "min-h-16 rounded-xl p-1 md:min-h-24 md:p-1.5",
                      d.inMonth ? "bg-chalk" : "bg-transparent",
                      d.isToday && "ring-2 ring-red",
                    )}
                  >
                    {d.inMonth && (
                      <span
                        className={cn("block text-left text-xs font-semibold", d.isToday ? "text-red" : "text-ink/60")}
                      >
                        {d.day}
                      </span>
                    )}
                    <div className="mt-0.5 space-y-1">
                      {items.map((e) => {
                        const status = mine.get(e.id);
                        return (
                          <Link
                            key={e.id}
                            href={`/fixture/${e.id}`}
                            title={`${e.title}, ${formatTime(e.startsAt)}`}
                            className={cn(
                              "relative block truncate rounded-lg px-1 py-1 text-left text-[10px] font-bold leading-tight md:px-1.5 md:text-xs",
                              e.kind === "game" ? "bg-navy text-white" : "bg-powder text-navy",
                              e.cancelled && "line-through opacity-60",
                            )}
                          >
                            <span className="md:hidden">
                              {e.opponent ? e.opponent.slice(0, 4) : e.title.slice(0, 5)}
                            </span>
                            <span className="hidden md:inline">
                              {e.title}
                              <span className="block font-medium opacity-75">{formatTime(e.startsAt)}</span>
                            </span>
                            {status && (
                              <span
                                className={cn(
                                  "absolute top-0.5 right-0.5 size-1.5 rounded-full",
                                  status === "yes" ? "bg-grass" : "bg-red",
                                )}
                              />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
