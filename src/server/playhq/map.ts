/**
 * Maps PlayHQ public API payloads (v1) onto our tables.
 *
 * Field names come from PlayHQ's published docs and open-source clients; the
 * schemas are deliberately loose (passthrough + fallbacks) because we haven't
 * seen a live response for this competition yet. When a key arrives, run the
 * sync once and check `mapFixtureGame` / `mapLadder` against the real payload.
 */
import { TZDate } from "@date-fns/tz";
import { z } from "zod";
import { CLUB_TZ } from "@/lib/time";

const looseNumber = z.union([z.number(), z.string()]).transform(Number).optional();

const competitor = z.looseObject({
  id: z.string(),
  name: z.string(),
  isHomeTeam: z.boolean().optional(),
  scoreTotal: looseNumber,
  goals: looseNumber,
  behinds: looseNumber,
});

export const fixtureGameSchema = z.looseObject({
  id: z.string(),
  status: z.string().optional(),
  round: z
    .looseObject({
      name: z.string().optional(),
      isFinalRound: z.boolean().optional(),
    })
    .optional(),
  schedule: z
    .looseObject({
      date: z.string().optional(),
      time: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  venue: z
    .looseObject({
      name: z.string().optional(),
      surfaceName: z.string().optional(),
      address: z
        .looseObject({
          line1: z.string().optional(),
          suburb: z.string().optional(),
          postcode: z.string().optional(),
          state: z.string().optional(),
        })
        .optional(),
    })
    .nullish(),
  competitors: z.array(competitor).default([]),
});

export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    metadata: z
      .looseObject({
        hasMore: z.boolean().optional(),
        nextCursor: z.string().nullish(),
      })
      .optional(),
  });

const standing = z.looseObject({
  team: z.looseObject({ id: z.string().optional(), name: z.string() }),
});
export const ladderSchema = z.object({
  data: z.array(
    z.looseObject({
      ladders: z.array(z.looseObject({ standings: z.array(standing) })).default([]),
    }),
  ),
});

export type FixtureGame = z.infer<typeof fixtureGameSchema>;

export type MappedGame = {
  playhqGameId: string;
  title: string;
  startsAt: Date;
  round: string | null;
  opponent: string | null;
  isHome: boolean | null;
  isFinal: boolean;
  venueName: string | null;
  venueAddress: string | null;
  teamGoals: number | null;
  teamBehinds: number | null;
  oppGoals: number | null;
  oppBehinds: number | null;
  cancelled: boolean;
};

/** "Brentwood Booragoon (WC3)" → "Brentwood Booragoon" */
export const cleanTeamName = (name: string) => name.replace(/\s*\((W?C\d|WA|WB)\)\s*$/i, "").trim();

function parseSchedule(s: FixtureGame["schedule"]): Date | null {
  if (!s?.date) return null;
  const [y, m, d] = s.date.split("-").map(Number);
  const [hh = 0, mm = 0] = (s.time || "00:00").split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, s.timezone || CLUB_TZ).getTime());
}

export function mapFixtureGame(game: FixtureGame, teamId: string): MappedGame | null {
  const startsAt = parseSchedule(game.schedule);
  if (!startsAt) return null; // unscheduled; picked up on a later sync
  const us = game.competitors.find((c) => c.id === teamId);
  const them = game.competitors.find((c) => c.id !== teamId);
  const opponent = them ? cleanTeamName(them.name) : null;
  const round = game.round?.name ?? null;
  const addr = game.venue?.address;
  const scored = (c?: z.infer<typeof competitor>) =>
    c?.goals != null && c?.behinds != null && !Number.isNaN(c.goals) && !Number.isNaN(c.behinds);

  return {
    playhqGameId: game.id,
    title: opponent ? `vs ${opponent}` : (round ?? "Game"),
    startsAt,
    round,
    opponent,
    isHome: us?.isHomeTeam ?? null,
    isFinal: game.round?.isFinalRound ?? false,
    venueName: [game.venue?.name, game.venue?.surfaceName].filter(Boolean).join(", ") || null,
    venueAddress: addr ? [addr.line1, addr.suburb, addr.state, addr.postcode].filter(Boolean).join(", ") : null,
    teamGoals: scored(us) ? (us?.goals ?? null) : null,
    teamBehinds: scored(us) ? (us?.behinds ?? null) : null,
    oppGoals: scored(them) ? (them?.goals ?? null) : null,
    oppBehinds: scored(them) ? (them?.behinds ?? null) : null,
    cancelled: /cancel|forfeit|abandon/i.test(game.status ?? ""),
  };
}

const pick = (o: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) {
    const v = o[k];
    if (v != null && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
};

export function mapLadder(payload: z.infer<typeof ladderSchema>) {
  const standings = payload.data[0]?.ladders[0]?.standings ?? [];
  return standings.map((s, i) => {
    const pf = pick(s, "pointsFor", "scoresFor", "for");
    const pa = pick(s, "pointsAgainst", "scoresAgainst", "against");
    return {
      position: pick(s, "position", "rank") || i + 1,
      team: cleanTeamName(s.team.name),
      played: pick(s, "played", "gamesPlayed"),
      won: pick(s, "won", "wins"),
      lost: pick(s, "lost", "losses"),
      drawn: pick(s, "drawn", "draws"),
      pointsFor: pf,
      pointsAgainst: pa,
      percentage: pick(s, "percentage") || (pa ? Math.round((pf / pa) * 10000) / 100 : 0),
      premiershipPoints: pick(s, "competitionPoints", "premiershipPoints", "points"),
    };
  });
}
