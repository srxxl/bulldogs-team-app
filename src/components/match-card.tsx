import { MapPin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatLongDay, formatTime, relativeDay } from "@/lib/time";
import type { AvailabilityStatus, EventRow } from "@/server/db/schema";
import { Hoop } from "./hoop";
import { RsvpButtons } from "./rsvp-buttons";

/**
 * A game, footy-record style: round, "Bulldogs vs" and the opponent huge, the hoop band, then bounce and where.
 * On the fixture it's the next game: the whole card opens the game, with I'm in / Can't on it. On the game's own
 * page it's the header: a back button and Edit in the top row, the score under the title, and no buttons.
 */
export function MatchCard({
  game,
  rsvp,
  href,
  leading,
  actions,
  extra,
  className,
}: {
  game: EventRow;
  /** Your answer and how many are in so far; leave out for no I'm in / Can't. */
  rsvp?: { myStatus: AvailabilityStatus | null; yesCount: number };
  /** Makes the whole card a link (its title's link stretches over it). */
  href?: string;
  /** Before the round in the top row, e.g. the back button. */
  leading?: ReactNode;
  /** After the "In 4 days" chip in the top row, e.g. Edit. */
  actions?: ReactNode;
  /** Under the title, e.g. the score. */
  extra?: ReactNode;
  className?: string;
}) {
  const title = (
    <>
      <span className="block text-lg font-semibold text-powder">Bulldogs vs</span>
      <span className="block font-display text-[clamp(3.25rem,13vw,7.5rem)] font-black leading-[0.82] tracking-tight">
        {game.opponent}
      </span>
    </>
  );
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-navy text-white",
        href && "transition-colors has-[h2>a:hover]:bg-navy-deep",
        className,
      )}
    >
      <div className="px-5 pt-5 md:px-8 md:pt-8">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-powder">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            {leading}
            <span>
              {[game.round, game.isHome == null ? null : game.isHome ? "Home" : "Away"].filter(Boolean).join(", ")}
            </span>
            {game.isFinal && <span className="rounded-full bg-red px-2.5 py-0.5 text-white">Final</span>}
            {game.cancelled && <span className="rounded-full bg-red px-2.5 py-0.5 text-white">Cancelled</span>}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-white">{relativeDay(game.startsAt)}</span>
            {actions}
          </span>
        </div>
        <h2 className="mt-6">
          {href ? (
            <Link
              href={href}
              className="block after:absolute after:inset-0 after:rounded-[28px] focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-white/50"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {extra}
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
                {/* above the card's link, so it opens the map rather than the game */}
                <a
                  className="relative z-10 inline-flex items-center gap-1 text-white/80 underline decoration-white/30 underline-offset-4 hover:decoration-white"
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
        {rsvp && (
          <div className="relative z-10 md:w-80">
            <p className="mb-2 text-sm text-powder">
              {rsvp.yesCount === 0
                ? "Nobody's confirmed yet"
                : `${rsvp.yesCount} ${rsvp.yesCount === 1 ? "player" : "players"} in so far`}
            </p>
            <RsvpButtons eventId={game.id} status={rsvp.myStatus} tone="dark" />
          </div>
        )}
      </div>
    </article>
  );
}
