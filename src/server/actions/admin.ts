"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { blank, parseForm } from "@/lib/form";
import { parseLadderPaste } from "@/lib/ladder-paste";
import { fromLocalInput } from "@/lib/time";
import { requireRole } from "@/server/auth/session";
import { db } from "@/server/db";
import { event, eventKindEnum, roleEnum, user } from "@/server/db/schema";
import { setSetting } from "@/server/queries/settings";
import { clearFutureTraining, ensureTraining, replaceLadder, syncPlayHq } from "@/server/sync";

/* Members ----------------------------------------------------------------- */

export async function setRole(userId: string, role: (typeof roleEnum.enumValues)[number]): Promise<ActionResult> {
  const me = await requireRole("coach");
  if (!roleEnum.enumValues.includes(role)) return fail("Unknown role");
  if (userId === me.id) return fail("You can't change your own role");
  if (role === "admin" && me.role !== "admin") return fail("Only admins can make admins");
  const [target] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
  if (!target) return fail("That member doesn't exist");
  if (target.role === "admin" && me.role !== "admin") return fail("Only admins can change an admin");
  await db.update(user).set({ role }).where(eq(user.id, userId));
  revalidatePath("/", "layout");
  return ok(role === "pending" ? "Access removed" : "Role updated");
}

export async function removeMember(userId: string): Promise<ActionResult> {
  const me = await requireRole("admin");
  if (userId === me.id) return fail("You can't remove yourself");
  await db.delete(user).where(eq(user.id, userId));
  revalidatePath("/", "layout");
  return ok("Member removed");
}

/* Events ------------------------------------------------------------------ */

const score = z.preprocess(blank, z.coerce.number().int().min(0).max(99).optional());

const eventSchema = z
  .object({
    id: z.preprocess(blank, z.string().optional()),
    kind: z.enum(eventKindEnum.enumValues),
    title: z.preprocess(blank, z.string().trim().max(100).optional()),
    startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a date and time"),
    endsAt: z.preprocess(
      blank,
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        .optional(),
    ),
    venueName: z.preprocess(blank, z.string().trim().max(120).optional()),
    venueAddress: z.preprocess(blank, z.string().trim().max(200).optional()),
    details: z.preprocess(blank, z.string().trim().max(2000).optional()),
    round: z.preprocess(blank, z.string().trim().max(40).optional()),
    opponent: z.preprocess(blank, z.string().trim().max(80).optional()),
    isHome: z.preprocess((v) => (v === "home" ? true : v === "away" ? false : undefined), z.boolean().optional()),
    isFinal: z.preprocess((v) => v === "on", z.boolean()),
    cancelled: z.preprocess((v) => v === "on", z.boolean()),
    teamGoals: score,
    teamBehinds: score,
    oppGoals: score,
    oppBehinds: score,
  })
  .refine((v) => v.kind !== "game" || v.opponent, {
    path: ["opponent"],
    message: "Who are we playing?",
  })
  .refine((v) => v.kind === "game" || v.title, {
    path: ["title"],
    message: "Give it a name",
  });

export async function saveEvent(_prev: unknown, formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireRole("coach");
  const parsed = parseForm(eventSchema, formData);
  if ("error" in parsed) return parsed.error;
  const { id, startsAt, endsAt, ...rest } = parsed.data;
  const values = {
    ...rest,
    title: rest.kind === "game" ? `vs ${rest.opponent}` : (rest.title ?? ""),
    startsAt: fromLocalInput(startsAt),
    endsAt: endsAt ? fromLocalInput(endsAt) : null,
    venueName: rest.venueName ?? null,
    venueAddress: rest.venueAddress ?? null,
    details: rest.details ?? null,
    round: rest.round ?? null,
    opponent: rest.kind === "game" ? (rest.opponent ?? null) : null,
    isHome: rest.isHome ?? null,
    teamGoals: rest.teamGoals ?? null,
    teamBehinds: rest.teamBehinds ?? null,
    oppGoals: rest.oppGoals ?? null,
    oppBehinds: rest.oppBehinds ?? null,
  };
  const [row] = id
    ? await db.update(event).set(values).where(eq(event.id, id)).returning({ id: event.id })
    : await db.insert(event).values(values).returning({ id: event.id });
  if (!row) return fail("That event doesn't exist any more");
  revalidatePath("/", "layout");
  return ok(id ? "Event updated" : "Event added", { id: row.id });
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  await requireRole("coach");
  await db.delete(event).where(eq(event.id, id));
  revalidatePath("/", "layout");
  return ok("Event deleted");
}

/* Settings + PFL data ----------------------------------------------------- */

export async function setTrainingEnabled(enabled: boolean): Promise<ActionResult> {
  await requireRole("coach");
  await setSetting("training_enabled", enabled);
  revalidatePath("/", "layout");
  if (!enabled) {
    await clearFutureTraining();
    return ok("Training polls paused");
  }
  const created = await ensureTraining();
  return ok(`Training polls on. ${created} sessions added.`);
}

export async function setSeasonStart(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireRole("coach");
  const v = String(formData.get("seasonStart") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return fail("Pick a date");
  await setSetting("season_start", v);
  revalidatePath("/votes");
  return ok("Season start saved");
}

export async function runPlayHqSync(): Promise<ActionResult> {
  await requireRole("coach");
  const res = await syncPlayHq();
  revalidatePath("/", "layout");
  return res.ok ? ok(res.message) : fail(res.message);
}

export async function importLadder(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireRole("coach");
  const result = parseLadderPaste(String(formData.get("ladder") ?? ""));
  if ("error" in result) return fail(result.error, { ladder: [result.error] });
  await replaceLadder(result.rows);
  revalidatePath("/ladder");
  revalidatePath("/", "layout");
  return ok(`Ladder updated with ${result.rows.length} teams`);
}
