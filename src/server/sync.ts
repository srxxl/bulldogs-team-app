import "server-only";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { TRAINING, upcomingTrainingSlots } from "@/lib/training";
import { db } from "@/server/db";
import { event, ladderRow } from "@/server/db/schema";
import { fetchLadder, fetchTeamFixture, playHqConfig } from "@/server/playhq/client";
import { mapFixtureGame, mapLadder } from "@/server/playhq/map";
import { getSetting, setSetting } from "@/server/queries/settings";

const TRAINING_DAYS_AHEAD = 14;

/** Creates any missing Tue/Thu training sessions in the next two weeks. Idempotent. */
export async function ensureTraining(now = new Date()) {
  if (!(await getSetting("training_enabled"))) return 0;
  const slots = upcomingTrainingSlots(now, TRAINING_DAYS_AHEAD);
  if (slots.length === 0) return 0;
  const existing = await db
    .select({ startsAt: event.startsAt })
    .from(event)
    .where(
      and(
        eq(event.kind, "training"),
        gte(event.startsAt, slots[0].startsAt),
        lte(event.startsAt, slots[slots.length - 1].startsAt),
      ),
    );
  const have = new Set(existing.map((e) => e.startsAt.getTime()));
  const missing = slots.filter((s) => !have.has(s.startsAt.getTime()));
  if (missing.length === 0) return 0;
  await db.insert(event).values(
    missing.map((s) => ({
      kind: "training" as const,
      title: "Training",
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      venueName: TRAINING.venueName,
      venueAddress: TRAINING.venueAddress,
    })),
  );
  return missing.length;
}

export type SyncResult = { ok: boolean; message: string };

/** Pulls the team fixture + grade ladder from the PlayHQ public API. */
export async function syncPlayHq(): Promise<SyncResult> {
  const cfg = playHqConfig();
  if (!cfg) return { ok: false, message: "PlayHQ isn't connected yet (no API key)." };

  let result: SyncResult;
  try {
    const games = (await fetchTeamFixture(cfg)).map((g) => mapFixtureGame(g, cfg.teamId)).filter((g) => g !== null);

    await db.transaction(async (tx) => {
      for (const g of games) {
        const { playhqGameId, ...fields } = g;
        await tx
          .insert(event)
          .values({ kind: "game", playhqGameId, ...fields })
          .onConflictDoUpdate({ target: event.playhqGameId, set: fields });
      }
    });

    let ladderCount = 0;
    if (cfg.gradeId) {
      const rows = mapLadder(await fetchLadder(cfg, cfg.gradeId));
      if (rows.length > 0) {
        await replaceLadder(rows);
        ladderCount = rows.length;
      }
    }
    result = {
      ok: true,
      message: `Synced ${games.length} games and ${ladderCount} ladder rows.`,
    };
  } catch (err) {
    result = {
      ok: false,
      message: err instanceof Error ? err.message : "PlayHQ sync failed",
    };
  }
  await setSetting("playhq_last_sync", {
    at: new Date().toISOString(),
    ...result,
  });
  return result;
}

export async function replaceLadder(rows: (typeof ladderRow.$inferInsert)[]) {
  await db.transaction(async (tx) => {
    await tx.delete(ladderRow);
    await tx.insert(ladderRow).values(rows);
  });
}

/** Removes future auto-generated training when training is switched off. */
export async function clearFutureTraining(now = new Date()) {
  const future = await db
    .select({ id: event.id })
    .from(event)
    .where(and(eq(event.kind, "training"), gte(event.startsAt, now)));
  if (future.length)
    await db.delete(event).where(
      inArray(
        event.id,
        future.map((f) => f.id),
      ),
    );
}
