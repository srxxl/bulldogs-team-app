import { MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatLongDay, formatTime, relativeDay } from "@/lib/time";
import type { AvailabilityStatus, EventRow } from "@/server/db/schema";
import { Hoop } from "./hoop";
import { RsvpButtons } from "./rsvp-buttons";

/** Home screen hero: the next game, footy-record style. */
export function MatchCard({
  game,
  myStatus,
  yesCount,
  className,
}: {
  game: EventRow;
  myStatus: AvailabilityStatus | null;
  yesCount: number;
  className?: string;
}) {
  return (
    <article className={cn("relative overflow-hidden rounded-[28px] bg-navy text-white", className)}>
      <div className="px-5 pt-5 md:px-8 md:pt-8">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-powder">
          <span>
            {[game.round, game.isHome == null ? null : game.isHome ? "Home" : "Away"].filter(Boolean).join(", ")}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-white">{relativeDay(game.startsAt)}</span>
        </div>
        <Link href={`/fixture/${game.id}`} className="mt-6 block">
          <span className="block text-lg font-semibold text-powder">Bulldogs vs</span>
          <h2 className="font-display text-[clamp(3.25rem,13vw,7.5rem)] font-black leading-[0.82] tracking-tight">
            {game.opponent}
          </h2>
        </Link>
      </div>
      <Hoop className="my-6" animate />
      <div className="grid gap-5 px-5 pb-5 md:grid-cols-[1fr_auto] md:items-end md:px-8 md:pb-8">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-powder">Bounce</dt>
            <dd className="display-num mt-1 text-4xl font-bold">{formatTime(game.startsAt)}</dd>
            <dd className="mt-1 text-white/80">{formatLongDay(game.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-powder">Where</dt>
            <dd className="mt-1 font-semibold">{game.venueName ?? "Venue to be confirmed"}</dd>
            {game.venueAddress && (
              <dd className="mt-1">
                <a
                  className="inline-flex items-center gap-1 text-white/80 underline decoration-white/30 underline-offset-4 hover:decoration-white"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.venueAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={14} /> Directions
                </a>
              </dd>
            )}
          </div>
        </dl>
        <div className="md:w-80">
          <p className="mb-2 text-sm text-powder">
            {yesCount === 0
              ? "Nobody's confirmed yet"
              : `${yesCount} ${yesCount === 1 ? "player" : "players"} in so far`}
          </p>
          <RsvpButtons eventId={game.id} status={myStatus} tone="dark" />
        </div>
      </div>
    </article>
  );
}
