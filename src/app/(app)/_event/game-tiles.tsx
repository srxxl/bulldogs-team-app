import type { ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { GameTile } from "@/components/game-tile";
import { MiniGround } from "@/components/mini-ground";
import { morphName } from "@/components/morph";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { clubGuernsey, teamSlug } from "@/lib/club-colours";
import { cn } from "@/lib/cn";
import { type GamePhase, gamePhase, TILE_LAYOUT, type GameTile as Tile } from "@/lib/game-phase";
import { BENCH_SLOTS, EMERGENCY_SLOTS, FIELD_SLOTS, TEAM_SHEET } from "@/lib/positions";
import { isCoach } from "@/lib/roles";
import { formatTime } from "@/lib/time";
import { isOwnTime, scheduled, timelineFor } from "@/lib/timeline";
import type { LoadedEvent } from "./load-event";
import { TimelineBody } from "./sections";

const DAY = 24 * 60 * 60_000;
const suffix = (n: number) => {
  const v = n % 100;
  return (v >= 11 && v <= 13 ? null : ["th", "st", "nd", "rd"][n % 10]) ?? "th";
};

/**
 * A game's page under its header: a tile per part of the game (who's in, the team, game day, notes, the
 * opponent, player's player), each with a picture of where it's at. Nothing is hidden; what matters at this
 * point of the game gets the big tiles.
 */
export function GameTiles({ data }: { data: LoadedEvent }) {
  const now = new Date();
  const phase = gamePhase(data.ev.startsAt, now, data.scores != null);
  return (
    // two across on a phone, four from a tablet up: big tiles take two columns, so on a wide screen they're half width
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {TILE_LAYOUT[phase].map(({ tile, big }) => (
        <TileFor key={tile} tile={tile} big={big} phase={phase} data={data} now={now} />
      ))}
    </div>
  );
}

/** A tile's one line of where it's at. */
function Line({ children, big, light }: { children: ReactNode; big?: boolean; light?: boolean }) {
  return (
    <p className={cn("text-sm leading-snug", big && "text-base", light ? "text-white/85" : "text-ink/60")}>
      {children}
    </p>
  );
}

function TileFor({
  tile,
  big,
  phase,
  data,
  now,
}: {
  tile: Tile;
  big?: boolean;
  phase: GamePhase;
  data: LoadedEvent;
  now: Date;
}) {
  const { ev, me } = data;
  const common = { href: `/fixture/${ev.id}/${tile}`, name: morphName.gameTile(ev.id, tile), big };

  switch (tile) {
    // the team sheet filling up in red (a slot per place, 18 a side, 22 a full sheet), and I'm in / Can't
    case "coming": {
      const yes = data.yes.length;
      return (
        <GameTile {...common} title={phase === "after" ? "Who played" : "Who's in"}>
          {/* sits at the bottom of the tile with a gap under the title, like Game day beside it */}
          <p className="mt-auto flex items-baseline gap-1.5 pt-2 text-ink">
            <span className={cn("display-num font-extrabold", big ? "text-6xl" : "text-5xl")}>{yes}</span>
            <span className="font-display text-lg font-bold">in</span>
            {data.no.length > 0 && <span className="ml-1 text-sm text-ink/60">{data.no.length} can't</span>}
          </p>
          <ol
            className="mt-1 grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${TEAM_SHEET.full}, minmax(0, 1fr))` }}
            aria-hidden
          >
            {Array.from({ length: TEAM_SHEET.full }, (_, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed slots
                key={i}
                className={cn(
                  "rounded-[3px] border-[1.5px]",
                  big ? "h-4" : "h-3",
                  i < yes ? "border-red bg-red" : i < TEAM_SHEET.side ? "border-navy/30" : "border-navy/15",
                )}
              />
            ))}
          </ol>
          {data.upcoming && !ev.cancelled && (
            <div className="relative z-10 mt-3">
              <RsvpButtons eventId={ev.id} status={data.mine} size={big ? "md" : "sm"} />
            </div>
          )}
        </GameTile>
      );
    }

    // the ground shrunk down: who's where (initials when it's big), you in red
    case "team": {
      const initials = (name: string) =>
        name
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("");
      const players = Object.fromEntries(
        FIELD_SLOTS.filter((s) => data.lineup[s.id]).map((s) => [
          s.id,
          initials(data.byId.get(data.lineup[s.id])?.displayName ?? "?"),
        ]),
      );
      const mySlot = Object.entries(data.lineup).find(([, userId]) => userId === me.id)?.[0];
      // only what the ground can't show: nobody picked yet, or you're off it
      const note =
        Object.keys(players).length === 0
          ? "Not picked yet."
          : mySlot && BENCH_SLOTS.includes(mySlot)
            ? "You're on the interchange."
            : mySlot && EMERGENCY_SLOTS.includes(mySlot)
              ? "You're an emergency."
              : null;
      return (
        <GameTile {...common} title="Team">
          <MiniGround
            id={`ground-${ev.id}`}
            players={players}
            mine={mySlot}
            labels={big}
            className={cn("mx-auto mt-1 block w-full", big ? "max-h-72" : "max-h-32")}
          />
          {note && <Line big={big}>{note}</Line>}
        </GameTile>
      );
    }

    // the real timeline when it's big; two big times (arrive or what's next, and bounce) when it's small
    case "timeline": {
      if (big)
        return (
          <GameTile {...common} title="Game day">
            <div className="relative z-10 mt-2">
              <TimelineBody data={data} />
            </div>
          </GameTile>
        );
      const steps = scheduled(timelineFor(ev.timeline), ev.startsAt);
      const next = phase === "day" ? steps.find((s) => s.at > now && s.minutesBefore > 0) : undefined;
      const from = steps.indexOf(next ?? steps[0]);
      const shown = steps.slice(from);
      const clock = (d: Date) => formatTime(d).replace(/\s?(am|pm)$/, "");
      return (
        <GameTile {...common} title="Game day">
          <div className="mt-auto">
            <p className="flex justify-between font-display text-2xl leading-none font-bold tabular-nums">
              <time dateTime={shown[0].at.toISOString()} className="text-navy">
                {clock(shown[0].at)}
              </time>
              <time dateTime={ev.startsAt.toISOString()} className="text-red">
                {clock(ev.startsAt)}
              </time>
            </p>
            {/* the big timeline's track in miniature: a dot per step, quieter for free time, red at bounce */}
            <div className="relative my-1.5 flex h-4 items-center justify-between" aria-hidden>
              <span className="absolute inset-x-0 h-0.5 bg-ink/12" />
              {shown.map((s, i) => (
                <span
                  key={`${s.minutesBefore}-${s.label}`}
                  className={cn(
                    "relative rounded-full",
                    i === shown.length - 1
                      ? "size-3.5 bg-red"
                      : isOwnTime(s.label)
                        ? "size-1.5 bg-ink/25"
                        : "size-2.5 bg-navy",
                  )}
                />
              ))}
            </div>
            <p className="flex justify-between text-xs text-ink/60">
              <span>{shown[0].label}</span>
              <span>Bounce down</span>
            </p>
          </div>
        </GameTile>
      );
    }

    // the latest notes: who wrote them, the title, and (when it's big) how they start
    case "notes": {
      const shown = data.notes.slice(0, big ? 2 : 1);
      const fresh = shown[0] && now.getTime() - shown[0].createdAt.getTime() < DAY;
      return (
        <GameTile {...common} title="Notes" badge={fresh ? "New" : undefined}>
          {shown.length === 0 ? (
            <div className="mt-1 grid flex-1 place-items-center rounded-xl border-2 border-dashed border-navy/20 p-2 text-center text-sm text-ink/60">
              Add a reminder or a shout-out
            </div>
          ) : (
            <ul className="mt-1 divide-y divide-ink/10">
              {shown.map((n) => (
                <li key={n.id} className="flex min-w-0 gap-3 py-2 first:pt-0 last:pb-0">
                  <Avatar name={n.preferredName || n.name} src={n.image} size={big ? 36 : 28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg leading-tight font-bold text-ink">{n.title}</p>
                    <p className={cn("text-sm text-ink/60", big ? "line-clamp-2" : "truncate")}>
                      {big ? n.body : n.preferredName || n.name}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {data.notes.length > shown.length && <Line>{data.notes.length - shown.length} more</Line>}
        </GameTile>
      );
    }

    // their guernsey fading in, with their ladder spot as a big outlined numeral, like the ladder page; it opens
    // (and grows into) their team page from the ladder, which comes back here
    case "opponent": {
      const row = data.oppRow;
      const design = data.opponent ? clubGuernsey(data.opponent) : null;
      return (
        <GameTile
          {...common}
          {...(data.opponent && {
            href: `/ladder/${teamSlug(data.opponent)}?from=${ev.id}`,
            name: morphName.team(teamSlug(data.opponent)),
          })}
          title={data.opponent ?? "Opponent"}
          backdrop={
            design && (
              <span
                className="ladder-design absolute inset-y-0 right-0 w-3/5 bg-cover bg-center opacity-60"
                style={{ backgroundImage: `url(${design})` }}
              />
            )
          }
        >
          {/* at the bottom of the tile, like the other tiles' numbers */}
          {row ? (
            <p className="mt-auto flex items-baseline gap-0.5 pt-2">
              <span className="display-num num-outline text-5xl font-extrabold text-navy [-webkit-text-stroke-width:1.5px]">
                {row.position}
              </span>
              <span className="font-display text-lg font-bold text-navy">{suffix(row.position)}</span>
              <span className="ml-2 text-sm text-ink/60">
                {row.won}–{row.lost}
              </span>
            </p>
          ) : (
            <div className="mt-auto pt-2">
              <Line>Not on the ladder yet.</Line>
            </div>
          )}
        </GameTile>
      );
    }

    // red when your votes are wanted
    case "votes": {
      const coach = isCoach(me.role);
      const hot = phase === "after" && !coach && !data.ballot && data.candidates.length >= 3;
      const person = (id: string) => {
        const p = data.byId.get(id);
        return { id, name: p?.displayName ?? "Former player", image: p?.image ?? null };
      };
      // coaches: this game's top three, with their place as a big red outlined numeral;
      // players: their own 3, 2, 1 on a badge, or three empty spots
      const faces = coach
        ? (data.results ?? []).slice(0, 3).map((r, i) => ({ ...person(r.userId), place: i + 1, badge: null }))
        : data.ballot
          ? [data.ballot.three, data.ballot.two, data.ballot.one].map((id, i) => ({
              ...person(id),
              place: null,
              badge: 3 - i,
            }))
          : null;
      const text = coach
        ? faces?.length
          ? null
          : "No votes in yet."
        : data.ballot
          ? big
            ? "Your votes are in."
            : null
          : data.candidates.length < 3
            ? "Opens once three players are in."
            : big
              ? "Give your 3, 2 and 1."
              : "Tap to vote";
      return (
        <GameTile {...common} title="Player's player" tone={hot ? "red" : "white"}>
          {coach && faces?.length ? (
            // coaches: the top three as a ranked list, places as big red outlined numerals
            <ol className={cn("mt-1 grid", big ? "gap-2.5" : "gap-1.5")}>
              {faces.map((f) => (
                <li key={f.id} className="flex min-w-0 items-center gap-2.5">
                  <span className={cn("flex shrink-0 items-baseline text-red", big ? "w-11" : "w-8")}>
                    <span
                      className={cn(
                        "display-num num-outline font-extrabold",
                        big ? "text-4xl [-webkit-text-stroke-width:1.5px]" : "text-2xl [-webkit-text-stroke-width:1px]",
                      )}
                    >
                      {f.place}
                    </span>
                    <span className={cn("font-display font-bold", big ? "text-base" : "text-xs")}>
                      {suffix(f.place ?? 0)}
                    </span>
                  </span>
                  <Avatar name={f.name} src={f.image} size={big ? 40 : 28} />
                  <span className={cn("truncate font-semibold", big ? "text-base" : "text-sm")}>{f.name}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ul className={cn("mt-1 flex", big ? "gap-5" : "gap-2.5")}>
              {faces
                ? faces.map((f) => (
                    <li key={f.id} className="grid min-w-0 justify-items-center gap-1">
                      <span className="relative">
                        <Avatar name={f.name} src={f.image} size={big ? 56 : 40} />
                        <span
                          className={cn(
                            "absolute -right-1 -bottom-1 grid place-items-center rounded-full border-2 border-white bg-red px-1 font-bold text-white tabular-nums",
                            big ? "h-6 min-w-6 text-[13px]" : "h-5 min-w-5 text-[11px]",
                          )}
                        >
                          {f.badge}
                        </span>
                      </span>
                      <span className={cn("truncate font-semibold", big ? "max-w-20 text-sm" : "max-w-14 text-xs")}>
                        {f.name.split(" ")[0]}
                      </span>
                    </li>
                  ))
                : [3, 2, 1].map((n) => (
                    <li
                      key={n}
                      className={cn(
                        "grid place-items-center rounded-full border-2 border-dashed font-display font-extrabold",
                        big ? "size-14 text-xl" : "size-10 text-base",
                        hot ? "border-white/60 text-white" : "border-navy/35 text-navy/60",
                      )}
                    >
                      {n}
                    </li>
                  ))}
            </ul>
          )}
          {text && (
            <Line big={big} light={hot}>
              {text}
            </Line>
          )}
        </GameTile>
      );
    }
  }
}
