"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { validateLineup } from "@/lib/positions";
import { canPickTeam } from "@/lib/roles";
import { requireMember } from "@/server/auth/session";
import { db } from "@/server/db";
import { lineupSlot } from "@/server/db/schema";
import { getEvent } from "@/server/queries/events";
import { getSquad } from "@/server/queries/squad";

const schema = z.object({
  eventId: z.string(),
  lineup: z.record(z.string(), z.string()),
});

export async function saveLineup(input: z.input<typeof schema>): Promise<ActionResult> {
  const me = await requireMember();
  if (!canPickTeam(me)) forbidden();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("Couldn't read that lineup");
  const { eventId, lineup } = parsed.data;

  const error = validateLineup(lineup);
  if (error) return fail(error);
  const [game, squad] = await Promise.all([getEvent(eventId), getSquad()]);
  if (game?.kind !== "game") return fail("That game doesn't exist");
  const ids = new Set(squad.map((p) => p.id));
  if (Object.values(lineup).some((id) => !ids.has(id))) return fail("Someone in that lineup isn't in the squad");

  await db.transaction(async (tx) => {
    await tx.delete(lineupSlot).where(eq(lineupSlot.eventId, eventId));
    const rows = Object.entries(lineup).map(([slot, userId]) => ({
      eventId,
      slot,
      userId,
    }));
    if (rows.length) await tx.insert(lineupSlot).values(rows);
  });
  revalidatePath(`/fixture/${eventId}`, "layout");
  return ok("Lineup saved");
}
