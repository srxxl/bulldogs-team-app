import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatScore, resultOf, scoresOf } from "@/lib/score";
import { dayStub, formatTime } from "@/lib/time";
import type { AvailabilityStatus, EventRow as Ev } from "@/server/db/schema";
import { Chip } from "./ui";

const RESULT = {
  win: ["W", "bg-navy text-white"],
  loss: ["L", "bg-red text-white"],
  draw: ["D", "bg-powder text-navy"],
} as const;
const MY = {
  yes: "You're in",
  maybe: "You said maybe",
  no: "You can't make it",
} as const;

/** A fixture list row. Date block on the left like a ticket stub. */
export function EventRowLink({ ev, myStatus, yesCount }: { ev: Ev; myStatus?: AvailabilityStatus; yesCount?: number }) {
  const scores = ev.kind === "game" ? scoresOf(ev) : null;
  const result = scores && resultOf(scores.team, scores.opp);
  const past = ev.startsAt < new Date();
  const { weekday, day } = dayStub(ev.startsAt);

  return (
    <Link
      href={`/fixture/${ev.id}`}
      className={cn(
        "group flex items-stretch gap-4 rounded-2xl bg-white p-3 pr-4 transition-colors hover:bg-mist",
        ev.cancelled && "opacity-60",
      )}
    >
      <div
        className={cn(
          "grid w-16 shrink-0 place-items-center rounded-xl py-2 text-center",
          ev.kind === "game" ? "bg-navy text-white" : "bg-mist text-navy",
        )}
      >
        <span className="text-xs font-semibold opacity-80">{weekday}</span>
        <span className="display-num text-4xl font-bold">{day}</span>
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-sm text-ink/60">
          {[ev.round, formatTime(ev.startsAt), ev.venueName].filter(Boolean).join(", ")}
        </p>
        <p className={cn("truncate font-display text-2xl font-bold text-navy", ev.cancelled && "line-through")}>
          {ev.title}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ev.cancelled && <Chip className="bg-red/10 text-red">Cancelled</Chip>}
          {ev.isFinal && <Chip className="bg-red text-white">Final</Chip>}
          {ev.kind !== "game" && (
            <Chip>{ev.kind === "social" ? "Social" : ev.kind === "training" ? "Training" : "Event"}</Chip>
          )}
          {!past && myStatus && (
            <Chip className={myStatus === "no" ? "bg-red/10 text-red" : undefined}>{MY[myStatus]}</Chip>
          )}
          {!past && !myStatus && !ev.cancelled && <Chip className="bg-red/10 text-red">Let us know</Chip>}
          {!past && yesCount != null && yesCount > 0 && (
            <Chip className="bg-transparent text-ink/60">{yesCount} in</Chip>
          )}
        </div>
      </div>
      {scores && result && (
        <div className="flex shrink-0 items-center gap-3 text-right">
          <div className="hidden text-sm sm:block">
            <p className="font-semibold">{formatScore(scores.team)}</p>
            <p className="text-ink/60">{formatScore(scores.opp)}</p>
          </div>
          <span
            className={cn(
              "grid size-10 place-items-center rounded-full font-display text-xl font-black",
              RESULT[result][1],
            )}
          >
            {RESULT[result][0]}
          </span>
        </div>
      )}
    </Link>
  );
}
