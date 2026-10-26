import "server-only";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { drill, playerProfile, sessionDrill, user } from "@/server/db/schema";

/** Every drill ever written, for picking into a session. */
export function getDrillCatalog() {
  return db
    .select({
      id: drill.id,
      title: drill.title,
      howTo: drill.howTo,
      minutes: drill.minutes,
      focus: drill.focus,
      link: drill.link,
      authorId: drill.authorId,
      authorName: sql<string>`coalesce(${playerProfile.preferredName}, ${user.name})`,
    })
    .from(drill)
    .innerJoin(user, eq(user.id, drill.authorId))
    .leftJoin(playerProfile, eq(playerProfile.userId, drill.authorId))
    .orderBy(asc(drill.title));
}

export type CatalogDrill = Awaited<ReturnType<typeof getDrillCatalog>>[number];

/** The planned drills for one session, in running order. */
export function getSessionDrills(eventId: string) {
  return db
    .select({
      id: drill.id,
      title: drill.title,
      howTo: drill.howTo,
      minutes: drill.minutes,
      focus: drill.focus,
      link: drill.link,
      position: sessionDrill.position,
    })
    .from(sessionDrill)
    .innerJoin(drill, eq(drill.id, sessionDrill.drillId))
    .where(eq(sessionDrill.eventId, eventId))
    .orderBy(asc(sessionDrill.position));
}

/** Drill counts per session, for the training list. */
export async function getDrillCounts(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, number>();
  const rows = await db
    .select({ eventId: sessionDrill.eventId, n: sql<number>`count(*)::int` })
    .from(sessionDrill)
    .where(inArray(sessionDrill.eventId, eventIds))
    .groupBy(sessionDrill.eventId);
  return new Map(rows.map((r) => [r.eventId, r.n]));
}
