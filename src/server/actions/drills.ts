"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { blank, parseForm } from "@/lib/form";
import { canModerate, canPlanSessions } from "@/lib/roles";
import { requireMember } from "@/server/auth/session";
import { db } from "@/server/db";
import { drill, sessionDrill } from "@/server/db/schema";
import { getEvent } from "@/server/queries/events";

/** Captains, coaches and admins plan sessions; everyone else gets a 403. */
async function requirePlanner() {
  const me = await requireMember();
  if (!canPlanSessions(me)) forbidden();
  return me;
}

const refresh = (eventId: string) => {
  revalidatePath("/training", "layout");
};

async function trainingSession(eventId: string) {
  const ev = await getEvent(eventId);
  return ev?.kind === "training" ? ev : null;
}

async function append(eventId: string, drillId: string) {
  await db.transaction(async (tx) => {
    const [{ last }] = await tx
      .select({ last: max(sessionDrill.position) })
      .from(sessionDrill)
      .where(eq(sessionDrill.eventId, eventId));
    await tx
      .insert(sessionDrill)
      .values({ eventId, drillId, position: (last ?? -1) + 1 })
      .onConflictDoNothing();
  });
}

const drillSchema = z.object({
  eventId: z.string().min(1),
  title: z.string().trim().min(1, "Give the drill a name").max(80),
  howTo: z.preprocess(blank, z.string().trim().max(1500).optional()),
  minutes: z.preprocess(blank, z.coerce.number().int().min(1).max(90, "Keep it under 90 minutes").optional()),
  focus: z.preprocess(blank, z.string().trim().max(24).optional()),
  link: z.preprocess(blank, z.url("That doesn't look like a link").max(500).optional()),
});

/** Writes a new drill into the catalog and adds it to this session. */
export async function createDrill(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await requirePlanner();
  const parsed = parseForm(drillSchema, formData);
  if ("error" in parsed) return parsed.error;
  const { eventId, ...values } = parsed.data;
  if (!(await trainingSession(eventId))) return fail("That training session doesn't exist");

  const [created] = await db
    .insert(drill)
    .values({ ...values, authorId: me.id })
    .returning({ id: drill.id });
  await append(eventId, created.id);
  refresh(eventId);
  return ok("Drill added and saved to the catalog");
}

export async function addDrillToSession(eventId: string, drillId: string): Promise<ActionResult> {
  await requirePlanner();
  if (!(await trainingSession(eventId))) return fail("That training session doesn't exist");
  await append(eventId, drillId);
  refresh(eventId);
  return ok("Drill added");
}

export async function removeDrillFromSession(eventId: string, drillId: string): Promise<ActionResult> {
  await requirePlanner();
  await db.delete(sessionDrill).where(and(eq(sessionDrill.eventId, eventId), eq(sessionDrill.drillId, drillId)));
  refresh(eventId);
  return ok("Drill removed from this session");
}

/** Saves a new running order for the session's drills. */
export async function reorderSessionDrills(eventId: string, drillIds: string[]): Promise<ActionResult> {
  await requirePlanner();
  await db.transaction(async (tx) => {
    for (const [position, drillId] of drillIds.entries()) {
      await tx
        .update(sessionDrill)
        .set({ position })
        .where(and(eq(sessionDrill.eventId, eventId), eq(sessionDrill.drillId, drillId)));
    }
  });
  refresh(eventId);
  return ok();
}

/** Removes a drill from the catalog (and every session). Authors, coaches and admins only. */
export async function deleteDrill(drillId: string): Promise<ActionResult> {
  const me = await requirePlanner();
  const where = canModerate(me) ? eq(drill.id, drillId) : and(eq(drill.id, drillId), eq(drill.authorId, me.id));
  const [gone] = await db.delete(drill).where(where).returning({ id: drill.id });
  if (!gone) return fail("You can only delete drills you wrote");
  revalidatePath("/", "layout");
  return ok("Drill deleted from the catalog");
}
