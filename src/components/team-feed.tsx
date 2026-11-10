import Image from "next/image";
import { cn } from "@/lib/cn";
import { formatDistance, formatDuration, formatPace } from "@/lib/workout";
import type { WeekDone } from "@/server/queries/content";
import { Avatar } from "./avatar";
import { CheerButton } from "./cheer-button";
import { EmptyState } from "./ui";

type Cheer = { doneId: string; userId: string; name: string; preferredName: string | null };

const firstName = (p: { name: string; preferredName: string | null }) => p.preferredName || p.name.split(" ")[0];

/** "Ash, Kate and 3 more" */
function cheeredBy(cheers: Cheer[]) {
  const names = cheers.map(firstName);
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}

/**
 * What the team did: each log as a post, with its numbers, note and photo, and a "Nice one" to cheer it. Only
 * people who did something appear here.
 */
export function TeamFeed({
  done,
  cheers,
  meId,
  canCheer = true,
  empty,
}: {
  done: WeekDone[];
  cheers: Cheer[];
  meId: string;
  /** Past weeks can still be cheered; turn off for a read-only view. */
  canCheer?: boolean;
  empty: string;
}) {
  if (done.length === 0) return <EmptyState title="Nothing logged yet">{empty}</EmptyState>;
  return (
    <ul className="space-y-3">
      {[...done]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((d) => {
          const mine = cheers.filter((c) => c.doneId === d.id);
          const stats = [
            d.distanceM != null && { value: formatDistance(d.distanceM), label: "distance" },
            d.durationS != null && { value: formatDuration(d.durationS), label: "time" },
            d.distanceM != null &&
              d.durationS != null &&
              formatPace(d.distanceM, d.durationS) && {
                value: (formatPace(d.distanceM, d.durationS) as string).replace(" /km", ""),
                label: "per km",
              },
          ].filter((s): s is { value: string; label: string } => !!s);
          return (
            <li key={d.id} className="rounded-2xl border border-ink/[0.06] bg-white p-4">
              <div className="flex items-center gap-3">
                {d.photo || d.image || d.guernsey == null ? (
                  <Avatar name={d.name} src={d.photo ?? d.image} size={40} />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-powder font-display text-lg font-black text-navy">
                    {d.guernsey}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold">{firstName(d)}</p>
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
                    className="max-h-80 w-full rounded-xl object-cover"
                  />
                </a>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {canCheer && d.userId !== meId && (
                  <CheerButton doneId={d.id} cheered={mine.some((c) => c.userId === meId)} />
                )}
                {mine.length > 0 && (
                  <p className={cn("text-sm text-ink/60")}>
                    {cheeredBy(mine)} {mine.length === 1 ? "says" : "say"} nice one
                  </p>
                )}
              </div>
            </li>
          );
        })}
    </ul>
  );
}
