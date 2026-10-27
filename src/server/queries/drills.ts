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

/** Planned drills for several sessions in one query, keyed by session id, in running order. */
export async function getSessionDrillsFor(eventIds: string[]) {
  const plans = new Map<string, Awaited<ReturnType<typeof getSessionDrills>>>();
  if (eventIds.length === 0) return plans;
  const rows = await db
    .select({
      eventId: sessionDrill.eventId,
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
    .where(inArray(sessionDrill.eventId, eventIds))
    .orderBy(asc(sessionDrill.position));
  for (const { eventId, ...d } of rows) plans.set(eventId, [...(plans.get(eventId) ?? []), d]);
  return plans;
}
