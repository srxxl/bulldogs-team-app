import "server-only";
import { cache } from "react";
import { isCoach } from "@/lib/roles";
import { headToHead, scoresOf } from "@/lib/score";
import { tally } from "@/lib/votes";
import { requireMember } from "@/server/auth/session";
import { getGameNotes, getGameVotes, getLadder, getLineup, getMyBallot } from "@/server/queries/content";
import { getEvent, getPastGamesAgainst, getRsvps } from "@/server/queries/events";
import { getSquad } from "@/server/queries/squad";

/**
 * Everything a game or event page shows, for the viewer. The game page's tiles and each tile's own page all
 * read from this; it's cached per request. Null when there's no such event.
 */
export const loadEvent = cache(async (id: string) => {
  const me = await requireMember();
  const ev = await getEvent(id);
  if (!ev) return null;

  const isGame = ev.kind === "game";
  const opponent = isGame ? ev.opponent : null;
  const coach = isCoach(me.role);
  const [rsvps, history, ladder, notes, squad, lineup, ballot, gameVotes] = await Promise.all([
    getRsvps(id),
    opponent ? getPastGamesAgainst(opponent, ev.startsAt) : [],
    opponent ? getLadder() : [],
    isGame ? getGameNotes(id) : [],
    isGame ? getSquad() : [],
    isGame ? getLineup(id) : ({} as Record<string, string>),
    isGame ? getMyBallot(id, me.id) : null,
    isGame && coach ? getGameVotes(id) : [],
  ]);

  // Player's player: only people who said they were in for this game. Those on the team board come first.
  const played = new Set(Object.values(lineup));
  const cameIn = new Set(rsvps.filter((r) => r.status === "yes").map((r) => r.userId));
  const candidates = squad
    .filter((p) => cameIn.has(p.id) && p.id !== me.id && p.role !== "coach")
    .sort((a, b) => Number(played.has(b.id)) - Number(played.has(a.id)) || (a.guernsey ?? 99) - (b.guernsey ?? 99))
    .map((p) => ({ id: p.id, name: p.displayName, guernsey: p.guernsey, image: p.image, played: played.has(p.id) }));
  const byId = new Map(squad.map((p) => [p.id, p]));
  const results = coach
    ? tally(gameVotes).map((r) => ({
        ...r,
        name: byId.get(r.userId)?.displayName ?? "Former player",
        image: byId.get(r.userId)?.image ?? null,
      }))
    : null;

  return {
    me,
    ev,
    isGame,
    opponent,
    rsvps,
    yes: rsvps.filter((r) => r.status === "yes"),
    no: rsvps.filter((r) => r.status === "no"),
    mine: rsvps.find((r) => r.userId === me.id)?.status ?? null,
    upcoming: (ev.endsAt ?? ev.startsAt) > new Date(),
    scores: scoresOf(ev),
    history,
    h2h: headToHead(history),
    oppRow: opponent ? ladder.find((r) => r.team.toLowerCase() === opponent.toLowerCase()) : undefined,
    notes,
    lineup,
    byId,
    ballot,
    candidates,
    results,
  };
});

export type LoadedEvent = NonNullable<Awaited<ReturnType<typeof loadEvent>>>;
