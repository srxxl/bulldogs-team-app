import "server-only";
import type { BoardPlayer } from "@/components/team-board/types";
import { ALL_SLOTS } from "@/lib/positions";
import { getLineup } from "./content";
import { getRsvps } from "./events";
import { getSquad } from "./squad";

/** Everything the team board needs for one game: the squad (with RSVPs) and the saved lineup. */
export async function getBoardData(eventId: string) {
  const [squad, rsvps, lineup] = await Promise.all([getSquad(), getRsvps(eventId), getLineup(eventId)]);
  const status = new Map(rsvps.map((r) => [r.userId, r.status]));
  const players: BoardPlayer[] = squad
    // Coaches only appear if they've said they're playing.
    .filter((p) => p.role !== "coach" || status.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.displayName,
      guernsey: p.guernsey,
      image: p.image,
      position: p.position,
      secondaryPosition: p.secondaryPosition,
      status: status.get(p.id) ?? null,
    }));
  // Drop spots that no longer exist (the bench used to have 8), so an old lineup still loads and saves.
  const current = Object.fromEntries(Object.entries(lineup).filter(([slot]) => ALL_SLOTS.has(slot)));
  return { players, lineup: current };
}
