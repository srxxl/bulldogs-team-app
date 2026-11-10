import Link from "next/link";
import { CLUB } from "@/lib/club";
import { clubGuernsey } from "@/lib/club-colours";
import { cn } from "@/lib/cn";
import { formatScore, points, resultOf, scoresOf } from "@/lib/score";
import { dayStub, formatDay, formatTime } from "@/lib/time";
import type { AvailabilityStatus, EventRow as Ev } from "@/server/db/schema";
import { Morph, morphName } from "./morph";
import { Chip } from "./ui";

const RESULT = {
  win: ["W", "bg-navy text-white"],
  loss: ["L", "bg-red text-white"],
  draw: ["D", "bg-powder text-navy"],
} as const;
const MY = {
  yes: "You're in",
  no: "You can't make it",
} as const;

/** A fixture list row: a game as a head-to-head (GameRowLink), anything else with a date stub like a ticket. */
export function EventRowLink({ ev, myStatus, yesCount }: { ev: Ev; myStatus?: AvailabilityStatus; yesCount?: number }) {
  if (ev.kind === "game" && ev.opponent) return <GameRowLink ev={ev} />;
  const scores = ev.kind === "game" ? scoresOf(ev) : null;
  const result = scores && resultOf(scores.team, scores.opp);
  const past = ev.startsAt < new Date();
  const { weekday, day } = dayStub(ev.startsAt);

  return (
    <Morph name={morphName.event(ev.id)}>
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
    </Morph>
  );
}

const RESULT_WORD = { win: "won", loss: "lost", draw: "drew" } as const;
/** One team's half of a game row. */
type Side = {
  name: string;
  score: number | null;
  /** Goals and behinds, "3.2". */
  goals: string | null;
  full: string | null;
  ours: boolean;
  design: string | null;
};

/**
 * A game as a head-to-head: the home team on the left, away on the right, the result badge with the round
 * and date in the middle. Both halves are white with our name in navy, each with its club's guernsey design
 * faded in from the outer edge.
 */
function GameRowLink({ ev }: { ev: Ev }) {
  const scores = scoresOf(ev);
  const result = scores && resultOf(scores.team, scores.opp);
  const us: Side = {
    name: CLUB.short,
    score: scores ? points(scores.team) : null,
    goals: scores && `${scores.team.goals}.${scores.team.behinds}`,
    full: scores && formatScore(scores.team),
    ours: true,
    design: clubGuernsey(CLUB.ladderName),
  };
  const them: Side = {
    name: ev.opponent as string,
    score: scores ? points(scores.opp) : null,
    goals: scores && `${scores.opp.goals}.${scores.opp.behinds}`,
    full: scores && formatScore(scores.opp),
    ours: false,
    design: clubGuernsey(ev.opponent as string),
  };
  const [home, away] = ev.isHome === false ? [them, us] : [us, them];
  const when = [ev.round, formatDay(ev.startsAt)].filter(Boolean).join(", ");
  const side = (s: Side, edge: "left" | "right") => (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-3 py-3 md:px-4",
        edge === "right" && "flex-row-reverse text-right",
      )}
    >
      {/* the club's guernsey design, faded in from the outer edge of the row */}
      {s.design && (
        <span
          aria-hidden
          className={cn(
            "game-design absolute inset-y-0 w-1/2 bg-cover bg-center",
            edge === "left" ? "game-design-left left-0" : "right-0",
          )}
          style={{ backgroundImage: `url(${s.design})` }}
        />
      )}
      <span
        className={cn(
          "game-name relative min-w-0 flex-1 font-display text-xl leading-tight font-bold md:text-2xl",
          s.ours ? "text-navy" : "text-ink",
          ev.cancelled && "line-through",
        )}
      >
        {s.name}
      </span>
      {/* the points, with goals and behinds beside them (under them on phones, where room is short) */}
      {s.score != null && (
        <span
          className={cn(
            "relative flex shrink-0 flex-col-reverse items-center md:items-baseline md:gap-2",
            edge === "left" ? "md:flex-row" : "md:flex-row-reverse",
          )}
          title={s.full ?? undefined}
        >
          {s.goals && <span className="text-xs text-ink/60 tabular-nums md:text-sm">{s.goals}</span>}
          <span className="display-num text-3xl font-bold text-ink md:text-4xl">{s.score}</span>
        </span>
      )}
    </div>
  );
  return (
    <Morph name={morphName.event(ev.id)}>
      <Link
        href={`/fixture/${ev.id}`}
        className={cn(
          "flex items-stretch overflow-hidden rounded-2xl bg-white transition-colors hover:bg-chalk",
          ev.cancelled && "opacity-60",
        )}
        aria-label={`${home.name} vs ${away.name}, ${when}${
          scores && result ? `, ${RESULT_WORD[result]} ${points(scores.team)} to ${points(scores.opp)}` : ""
        }`}
      >
        {side(home, "left")}
        <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center md:w-32">
          {result ? (
            <span
              className={cn(
                "grid size-9 place-items-center rounded-full font-display text-lg font-black",
                RESULT[result][1],
              )}
            >
              {RESULT[result][0]}
            </span>
          ) : (
            <span className="font-display text-lg leading-none font-bold text-ink/50">vs</span>
          )}
          <span className="text-xs leading-snug text-ink/60">
            {ev.round && <span className="block">{ev.round}</span>}
            {formatDay(ev.startsAt)}
          </span>
          {(ev.cancelled || ev.isFinal) && (
            <span className="flex flex-wrap justify-center gap-1">
              {ev.cancelled && <Chip className="bg-red/10 text-red">Cancelled</Chip>}
              {ev.isFinal && <Chip className="bg-red text-white">Final</Chip>}
            </span>
          )}
        </div>
        {side(away, "right")}
      </Link>
    </Morph>
  );
}
