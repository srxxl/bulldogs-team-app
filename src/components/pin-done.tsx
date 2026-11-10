import Image from "next/image";
import { cn } from "@/lib/cn";
import { formatDistance, formatDuration, formatPace, teamTotals } from "@/lib/workout";
import type { WeekDone } from "@/server/queries/content";
import { Avatar } from "./avatar";

const firstName = (d: WeekDone) => d.preferredName || d.name.split(" ")[0];

/** "5.2 km, 32:15, 6:12 /km": whichever of those someone logged. */
export function doneStats(d: Pick<WeekDone, "distanceM" | "durationS">) {
  return [
    d.distanceM != null && formatDistance(d.distanceM),
    d.durationS != null && formatDuration(d.durationS),
    d.distanceM != null && d.durationS != null && formatPace(d.distanceM, d.durationS),
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Who's done one of this week's picks: faces and a count (plus the distance between them for fitness), which
 * opens into everyone's numbers, notes and photos. The whole squad sees this.
 */
export function PinDoneList({ done, dark }: { done: WeekDone[]; dark: boolean }) {
  if (done.length === 0) return null;
  const totals = teamTotals(done);
  const faces = done.slice(0, 5);
  return (
    <details className="group/done mt-4">
      <summary
        className={cn(
          "-mx-2 flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-xl px-2 [&::-webkit-details-marker]:hidden",
          dark ? "hover:bg-white/10" : "hover:bg-navy/5",
        )}
      >
        <span className="flex -space-x-2" aria-hidden>
          {faces.map((d) => (
            <Avatar
              key={d.id}
              name={d.name}
              src={d.photo ?? d.image}
              size={28}
              className={cn("ring-2", dark ? "ring-navy" : "ring-white")}
            />
          ))}
        </span>
        <span className="text-sm font-semibold">
          {done.length} done
          {totals.distanceM > 0 && (
            <span className={cn("font-normal", dark ? "text-white/70" : "text-ink/60")}>
              , {formatDistance(totals.distanceM)} between them
            </span>
          )}
        </span>
        <span
          aria-hidden
          className={cn("ml-auto text-xs group-open/done:hidden", dark ? "text-white/60" : "text-ink/50")}
        >
          See who
        </span>
      </summary>
      <ul className="mt-2 space-y-3">
        {done.map((d) => {
          const stats = doneStats(d);
          return (
            <li key={d.id} className="flex gap-3">
              <Avatar name={d.name} src={d.photo ?? d.image} size={32} />
              <div className="min-w-0 flex-1 text-sm">
                <p>
                  <span className="font-semibold">{firstName(d)}</span>
                  {stats && <span className={dark ? "text-white/75" : "text-ink/70"}> {stats}</span>}
                </p>
                {d.note && <p className={cn("mt-0.5", dark ? "text-white/85" : "text-ink/80")}>{d.note}</p>}
                {d.imageUrl && (
                  <a href={d.imageUrl} target="_blank" rel="noreferrer" className="mt-2 block w-fit">
                    <Image
                      src={d.imageUrl}
                      alt={`${firstName(d)}'s photo`}
                      width={160}
                      height={160}
                      className="h-20 w-auto rounded-lg object-cover"
                    />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
