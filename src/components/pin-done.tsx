import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { formatDistance, teamTotals } from "@/lib/workout";
import type { WeekDone } from "@/server/queries/content";
import { DoneFace, doneStatList, firstName } from "./team-feed";

// a fixed width per number so they line up down the rows
const STAT_WIDTH: Record<string, string> = { distance: "w-[3.75rem]", time: "w-12", "per km": "w-10" };

/** One person's log on one row: their number or photo, name and big numbers. */
function DoneRow({ d, cols, onFill }: { d: WeekDone; cols: string[]; onFill?: boolean }) {
  const stats = new Map(doneStatList(d).map((s) => [s.label, s.value]));
  return (
    <>
      <DoneFace d={d} onFill={onFill} />
      <p className="min-w-0 flex-1 truncate font-semibold">{firstName(d)}</p>
      {cols.length > 0 && (
        <dl className="flex shrink-0 gap-2.5">
          {/* every row has the activity's columns, empty where that wasn't logged, so the numbers line up */}
          {cols.map((label) => (
            <div key={label} className={STAT_WIDTH[label]}>
              {stats.has(label) && (
                <>
                  <dd className="font-display text-xl leading-none font-black text-navy">{stats.get(label)}</dd>
                  <dt className="text-xs text-ink/55">{label}</dt>
                </>
              )}
            </div>
          ))}
        </dl>
      )}
    </>
  );
}

/**
 * Who's done one of this week's activities: faces and a count (plus the distance between them), which opens into a
 * row per person. A row with a note or photo opens again to show them. Only people who did it are shown.
 */
export function PinDoneList({
  done,
  onFill,
}: {
  done: WeekDone[];
  /** The activity card is powder (you've done it), not white. */
  onFill?: boolean;
}) {
  if (done.length === 0) return null;
  const totals = teamTotals(done);
  const latest = [...done].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  // the columns anyone logged for this activity, in order
  const logged = new Set(done.flatMap((d) => doneStatList(d).map((s) => s.label)));
  const cols = Object.keys(STAT_WIDTH).filter((l) => logged.has(l));
  return (
    <details className="group/done mt-4">
      <summary
        className={cn(
          "flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl px-3 py-2 transition-colors [&::-webkit-details-marker]:hidden",
          onFill ? "bg-white/55 hover:bg-white/80" : "bg-chalk hover:bg-mist",
        )}
      >
        <span className="flex -space-x-2" aria-hidden>
          {latest.slice(0, 4).map((d) => (
            <DoneFace
              key={d.id}
              d={d}
              small
              onFill={onFill}
              className={cn("ring-2", onFill ? "ring-powder" : "ring-chalk")}
            />
          ))}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-xl leading-none font-black text-navy">{done.length} done</span>
          {totals.distanceM > 0 && (
            <span className="block text-xs text-ink/60">{formatDistance(totals.distanceM)} between them</span>
          )}
        </span>
        <ChevronDown
          size={18}
          aria-hidden
          className="ml-auto shrink-0 text-navy/60 transition-transform group-open/done:rotate-180"
        />
        <span className="sr-only">See who</span>
      </summary>
      <ul className="mt-2 space-y-2">
        {latest.map((d) => {
          const row = "flex min-h-14 items-center gap-3 rounded-xl px-2";
          return (
            <li key={d.id} className="-mx-2">
              {d.note || d.imageUrl ? (
                <details className="group/row">
                  <summary
                    className={`${row} cursor-pointer list-none hover:bg-navy/5 [&::-webkit-details-marker]:hidden`}
                  >
                    <DoneRow d={d} cols={cols} onFill={onFill} />
                    <ChevronDown
                      size={16}
                      aria-hidden
                      className="shrink-0 text-ink/40 transition-transform group-open/row:rotate-180"
                    />
                  </summary>
                  <div className="pt-1 pb-2 pl-[3.75rem] pr-2 text-sm">
                    {d.note && <p className="text-pretty text-ink/80">{d.note}</p>}
                    {d.imageUrl && (
                      <a href={d.imageUrl} target="_blank" rel="noreferrer" className="mt-2 block w-fit">
                        <Image
                          src={d.imageUrl}
                          alt={`${firstName(d)}'s photo`}
                          width={320}
                          height={240}
                          className="h-32 w-auto rounded-lg object-cover"
                        />
                      </a>
                    )}
                  </div>
                </details>
              ) : (
                // nothing more to show, so it doesn't open; the gap keeps its numbers in line with the ones that do
                <div className={`${row} pr-9`}>
                  <DoneRow d={d} cols={cols} onFill={onFill} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
