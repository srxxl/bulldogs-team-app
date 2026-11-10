"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { canPickTeam } from "@/lib/roles";
import { isDefault, sortSteps, timelineSchema } from "@/lib/timeline";
import { requireMember } from "@/server/auth/session";
import { db } from "@/server/db";
import { event } from "@/server/db/schema";
import { getEvent } from "@/server/queries/events";

const schema = z.object({ eventId: z.string().min(1), steps: timelineSchema.nullable() });

/**
 * Save a game's timeline, or pass null to go back to the default. Skips, coaches and admins (the people who
 * pick the team).
 */
export async function saveTimeline(input: z.input<typeof schema>): Promise<ActionResult> {
  const me = await requireMember();
  if (!canPickTeam(me)) return fail("Only skips, coaches and admins can change the game day timeline");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the timeline");
  const game = await getEvent(parsed.data.eventId);
  if (game?.kind !== "game") return fail("That game doesn't exist");

  const steps = parsed.data.steps && !isDefault(parsed.data.steps) ? sortSteps(parsed.data.steps) : null;
  await db.update(event).set({ timeline: steps }).where(eq(event.id, game.id));
  revalidatePath(`/fixture/${game.id}`, "layout");
  return ok(steps ? "Timeline saved" : "Back to the usual timeline");
}
