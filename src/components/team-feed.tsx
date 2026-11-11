import Image from "next/image";
import { cn } from "@/lib/cn";
import { formatDistance, formatDuration, formatPace } from "@/lib/workout";
import type { WeekDone } from "@/server/queries/content";
import { Avatar } from "./avatar";
import { EmptyState } from "./ui";

export const firstName = (p: { name: string; preferredName: string | null }) => p.preferredName || p.name.split(" ")[0];

/** Distance, time and pace, whichever were logged, as big numbers with a label under each. */
export function doneStatList(d: Pick<WeekDone, "distanceM" | "durationS">) {
  const pace = d.distanceM != null && d.durationS != null ? formatPace(d.distanceM, d.durationS) : null;
  return [
    d.distanceM != null && { value: formatDistance(d.distanceM), label: "distance" },
    d.durationS != null && { value: formatDuration(d.durationS), label: "time" },
    pace && { value: pace.replace(" /km", ""), label: "per km" },
  ].filter((s): s is { value: string; label: string } => !!s);
}

/** Their photo, or their guernsey number in a circle when there's no photo. */
export function DoneFace({
  d,
  onFill,
  small,
  className,
}: {
  d: WeekDone;
  /** On a powder card: a white circle so it shows. */
  onFill?: boolean;
  /** 32px, for a stack of faces. */
  small?: boolean;
  className?: string;
}) {
  return d.photo || d.image || d.guernsey == null ? (
    <Avatar name={d.name} src={d.photo ?? d.image} size={small ? 32 : 40} className={className} />
  ) : (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-display font-black text-navy",
        small ? "size-8 text-base" : "size-10 text-lg",
        onFill ? "bg-white" : "bg-powder",
        className,
      )}
    >
      {d.guernsey}
    </span>
  );
}

/**
 * What the team did in a week: each log as a post with its numbers, note and photo. Only people who did something
 * appear here.
 */
export function TeamFeed({ done, empty }: { done: WeekDone[]; empty: string }) {
  if (done.length === 0) return <EmptyState title="Nothing logged yet">{empty}</EmptyState>;
  return (
    <ul className="space-y-3">
      {[...done]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((d) => {
          const stats = doneStatList(d);
          return (
            <li key={d.id} className="rounded-2xl border border-ink/[0.06] bg-white p-4">
              <div className="flex items-center gap-3">
                <DoneFace d={d} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{firstName(d)}</p>
                  <p className="truncate text-sm text-ink/60">{d.pinTitle}</p>
                </div>
              </div>
              {stats.length > 0 && (
                <dl className="mt-3 flex gap-6">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <dd className="font-display text-3xl leading-none font-black text-navy">{s.value}</dd>
                      <dt className="text-xs text-ink/55">{s.label}</dt>
                    </div>
                  ))}
                </dl>
              )}
              {d.note && <p className="mt-3 text-pretty">{d.note}</p>}
              {d.imageUrl && (
                <a href={d.imageUrl} target="_blank" rel="noreferrer" className="mt-3 block">
                  <Image
                    src={d.imageUrl}
                    alt={`${firstName(d)}'s photo`}
                    width={800}
                    height={600}
                    sizes="(min-width: 672px) 672px, 100vw"
                    className="max-h-80 w-full rounded-xl object-cover"
                  />
                </a>
              )}
            </li>
          );
        })}
    </ul>
  );
}
