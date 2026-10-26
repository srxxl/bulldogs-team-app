import "server-only";
import { and, asc, desc, eq, gte, inArray, lt, ne } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/server/db";
import { type AvailabilityStatus, availability, type EventKind, event, playerProfile, user } from "@/server/db/schema";

export const getEvent = cache(async (id: string) => {
  const [row] = await db.select().from(event).where(eq(event.id, id));
  return row ?? null;
});

export async function getUpcoming(opts: { kind?: EventKind; limit?: number; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  return db
    .select()
    .from(event)
    .where(
      and(
        // Keep today's events visible until they finish (2h grace for games without an end time).
        gte(event.startsAt, new Date(now.getTime() - 2 * 3600_000)),
        opts.kind ? eq(event.kind, opts.kind) : ne(event.kind, "training"),
      ),
    )
    .orderBy(asc(event.startsAt))
    .limit(opts.limit ?? 50);
}

export async function getNextGame(now = new Date()) {
  const [g] = await getUpcoming({ kind: "game", limit: 1, now });
  return g ?? null;
}

/** Most recent game that has already started (for the vote prompt + last result). */
export async function getLastGame(now = new Date()) {
  const [g] = await db
    .select()
    .from(event)
    .where(and(eq(event.kind, "game"), lt(event.startsAt, now), eq(event.cancelled, false)))
    .orderBy(desc(event.startsAt))
    .limit(1);
  return g ?? null;
}

/** Everything except training, for the season calendar. */
export function getSeason() {
  return db.select().from(event).where(ne(event.kind, "training")).orderBy(asc(event.startsAt));
}

export function getPastGamesAgainst(opponent: string, before: Date) {
  return db
    .select()
    .from(event)
    .where(and(eq(event.kind, "game"), eq(event.opponent, opponent), lt(event.startsAt, before)))
    .orderBy(desc(event.startsAt));
}

export type RsvpPerson = {
  userId: string;
  name: string;
  image: string | null;
  guernsey: number | null;
  status: AvailabilityStatus;
  note: string | null;
};

export async function getRsvps(eventId: string): Promise<RsvpPerson[]> {
  return db
    .select({
      userId: availability.userId,
      name: user.name,
      image: user.image,
      preferredName: playerProfile.preferredName,
      photoUrl: playerProfile.photoUrl,
      guernsey: playerProfile.guernsey,
      status: availability.status,
      note: availability.note,
    })
    .from(availability)
    .innerJoin(user, eq(user.id, availability.userId))
    .leftJoin(playerProfile, eq(playerProfile.userId, availability.userId))
    .where(eq(availability.eventId, eventId))
    .orderBy(asc(user.name))
    .then((rows) =>
      rows.map((r) => ({
        userId: r.userId,
        name: r.preferredName || r.name,
        image: r.photoUrl ?? r.image,
        guernsey: r.guernsey,
        status: r.status,
        note: r.note,
      })),
    );
}

/** My RSVP status for each of the given events. */
export async function getMyRsvps(userId: string, eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, AvailabilityStatus>();
  const rows = await db
    .select({ eventId: availability.eventId, status: availability.status })
    .from(availability)
    .where(and(eq(availability.userId, userId), inArray(availability.eventId, eventIds)));
  return new Map(rows.map((r) => [r.eventId, r.status]));
}

/** Yes-counts per event, for list views. */
export async function getYesCounts(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, number>();
  const rows = await db
    .select({ eventId: availability.eventId, status: availability.status })
    .from(availability)
    .where(inArray(availability.eventId, eventIds));
  const counts = new Map<string, number>();
  for (const r of rows) if (r.status === "yes") counts.set(r.eventId, (counts.get(r.eventId) ?? 0) + 1);
  return counts;
}
