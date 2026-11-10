import { perthToday } from "./time";

/**
 * Where a game is up to, from the viewer's side: before game day, on the day (before bounce), or after bounce.
 * The game page sizes its tiles by it: nothing is ever hidden, the tiles that matter right now are just bigger.
 */
export type GamePhase = "before" | "day" | "after";

export function gamePhase(bounce: Date, now: Date, hasScore = false): GamePhase {
  if (hasScore || now >= bounce) return "after";
  return perthToday(bounce) === perthToday(now) ? "day" : "before";
}

/** The game page's tiles, each opening its own page at /fixture/[id]/[tile]. */
export const GAME_TILES = ["coming", "team", "timeline", "notes", "opponent", "votes"] as const;
export type GameTile = (typeof GAME_TILES)[number];
export const isGameTile = (s: string): s is GameTile => (GAME_TILES as readonly string[]).includes(s);

/** Every tile in every phase, in order; `big` ones take the full width. */
export const TILE_LAYOUT: Record<GamePhase, { tile: GameTile; big?: boolean }[]> = {
  before: [
    { tile: "coming", big: true },
    { tile: "team", big: true },
    { tile: "timeline" },
    { tile: "notes" },
    { tile: "opponent" },
    { tile: "votes" },
  ],
  day: [
    { tile: "timeline", big: true },
    { tile: "team", big: true },
    { tile: "coming" },
    { tile: "notes" },
    { tile: "opponent" },
    { tile: "votes" },
  ],
  after: [
    { tile: "votes", big: true },
    { tile: "notes", big: true },
    { tile: "team" },
    { tile: "opponent" },
    { tile: "coming" },
    { tile: "timeline" },
  ],
};
