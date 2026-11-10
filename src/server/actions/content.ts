"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { blank, formValues, parseForm } from "@/lib/form";
import { currentStreak, hoop } from "@/lib/hoops";
import { canModerate, canPickPins } from "@/lib/roles";
import { perthWeekStart } from "@/lib/time";
import { parseDuration } from "@/lib/workout";
import { requireMember } from "@/server/auth/session";
import { db } from "@/server/db";
import { boardEnum, note, pin, pinCheer, pinDone, pinPick } from "@/server/db/schema";
import { getMyHoopWeeks } from "@/server/queries/content";
import { getEvent } from "@/server/queries/events";
import { storeImage } from "@/server/upload";

/* Notes ------------------------------------------------------------------ */

const noteSchema = z.object({
  eventId: z.string().min(1),
  title: z.string().trim().min(1, "Give it a title").max(100),
  body: z.string().trim().min(1, "Write something").max(4000),
});

/** Anyone in the squad can write a note for a game. Shows on that game's page and on home before the game. */
export async function createNote(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = parseForm(noteSchema, formData);
  if ("error" in parsed) return parsed.error;
  const game = await getEvent(parsed.data.eventId);
  if (!game || game.kind !== "game") return fail("That game doesn't exist");
  await db.insert(note).values({ ...parsed.data, authorId: me.id });
  revalidatePath(`/fixture/${game.id}`);
  revalidatePath("/");
  return ok("Note posted");
}

export async function deleteNote(id: string): Promise<ActionResult> {
  const me = await requireMember();
  const where = canModerate(me) ? eq(note.id, id) : and(eq(note.id, id), eq(note.authorId, me.id));
  const [gone] = await db.delete(note).where(where).returning({ eventId: note.eventId });
  if (!gone) return fail("You can only delete your own notes");
  if (gone.eventId) revalidatePath(`/fixture/${gone.eventId}`);
  revalidatePath("/");
  return ok("Note deleted");
}

/* Pins (fitness / nutrition boards) ------------------------------------- */

const pinSchema = z.object({
  board: z.enum(boardEnum.enumValues),
  title: z.string().trim().min(1, "Give it a title").max(100),
  body: z.preprocess(blank, z.string().trim().max(1500).optional()),
  link: z.preprocess(blank, z.url("That doesn't look like a link").max(500).optional()),
  tag: z.preprocess(blank, z.string().trim().max(24).optional()),
});

export async function createPin(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = parseForm(pinSchema, formData);
  if ("error" in parsed) return parsed.error;
  const image = await storeImage(formData.get("image"), "pins");
  if (image && "error" in image) return fail(image.error, { image: [image.error] }, formValues(formData));

  await db.insert(pin).values({ ...parsed.data, authorId: me.id, imageUrl: image?.url });
  revalidatePath(`/boards/${parsed.data.board}`);
  revalidatePath("/boards");
  return ok("Pinned");
}

export async function deletePin(id: string): Promise<ActionResult> {
  const me = await requireMember();
  const where = canModerate(me) ? eq(pin.id, id) : and(eq(pin.id, id), eq(pin.authorId, me.id));
  const [deleted] = await db.delete(pin).where(where).returning({ board: pin.board });
  if (!deleted) return fail("You can only remove your own pins");
  revalidatePath(`/boards/${deleted.board}`);
  revalidatePath("/boards");
  return ok("Removed");
}

const pickSchema = z.object({ id: z.string().min(1), picked: z.boolean() });

/** Pick a pin for this week (it shows on the boards hub until Sunday), or take it off. Leaders and admins. */
export async function pickPinForWeek(input: { id: string; picked: boolean }): Promise<ActionResult> {
  const me = await requireMember();
  if (!canPickPins(me)) return fail("Only skips, coaches and admins can pick this week's pins");
  const parsed = pickSchema.safeParse(input);
  if (!parsed.success) return fail("Something's off with that pin");
  const week = perthWeekStart();
  const [updated] = await db.select({ board: pin.board }).from(pin).where(eq(pin.id, parsed.data.id));
  if (updated?.board === "nutrition") return fail("Only fitness pins are picked for the week");
  if (updated && parsed.data.picked) {
    await db.insert(pinPick).values({ pinId: parsed.data.id, weekOf: week }).onConflictDoNothing();
  } else if (updated) {
    await db.delete(pinPick).where(and(eq(pinPick.pinId, parsed.data.id), eq(pinPick.weekOf, week)));
  }
  if (!updated) return fail("That pin doesn't exist any more");
  revalidatePath("/boards", "layout");
  return ok(parsed.data.picked ? "Picked for this week" : "Taken off this week");
}

/* Doing the week's picks ------------------------------------------------- */

/** What closing your hoop shows: the hoop and your streak. */
export type Celebration = { total: number; streak: number };

const doneSchema = z.object({
  pinId: z.string().min(1),
  // "5,2" is read as 5.2
  distanceKm: z.preprocess(
    (v) => (typeof v === "string" ? blank(v.replace(",", ".")) : v),
    z.coerce.number("Write the distance as a number, like 5.2").positive("That's not a distance").max(200).optional(),
  ),
  time: z.preprocess(
    blank,
    z
      .string()
      .trim()
      .refine((v) => parseDuration(v) !== null, "Write the time like 32 or 32:15")
      .optional(),
  ),
  note: z.preprocess(blank, z.string().trim().max(280, "Keep it under 280 characters").optional()),
});

/**
 * Log doing one of this week's picked pins, with optional distance, time, note and photo. Logging again
 * updates it (a new photo replaces the old one; leaving the photo empty keeps it).
 */
export async function logPinDone(_prev: unknown, formData: FormData): Promise<ActionResult<Celebration | null>> {
  const me = await requireMember();
  const parsed = parseForm(doneSchema, formData);
  if ("error" in parsed) return parsed.error;
  const week = perthWeekStart();
  const [picked] = await db
    .select({ board: pin.board })
    .from(pinPick)
    .innerJoin(pin, eq(pin.id, pinPick.pinId))
    .where(and(eq(pinPick.pinId, parsed.data.pinId), eq(pinPick.weekOf, week), eq(pin.board, "fitness")));
  if (!picked) return fail("That's not one of this week's picks any more");
  const before = await getMyHoopWeeks(me.id, week);
  const image = await storeImage(formData.get("image"), "done");
  if (image && "error" in image) return fail(image.error, { image: [image.error] }, formValues(formData));

  const values = {
    distanceM: parsed.data.distanceKm != null ? Math.round(parsed.data.distanceKm * 1000) : null,
    durationS: parsed.data.time ? parseDuration(parsed.data.time) : null,
    note: parsed.data.note ?? null,
    ...(image ? { imageUrl: image.url } : {}),
  };
  await db
    .insert(pinDone)
    .values({ pinId: parsed.data.pinId, userId: me.id, weekOf: week, ...values })
    .onConflictDoUpdate({ target: [pinDone.pinId, pinDone.userId, pinDone.weekOf], set: values });
  revalidatePath("/boards", "layout");
  // closing your hoop with this log gets a celebration, with your streak
  const after = await getMyHoopWeeks(me.id, week);
  const thisWeek = (h: typeof after) => h.weeks.find((w) => w.week === week);
  const wasClosed = hoop(thisWeek(before) ?? { picks: [], mine: [] }).closed;
  const nowClosed = hoop(thisWeek(after) ?? { picks: [], mine: [] }).closed;
  if (!nowClosed || wasClosed) return ok("Logged. Nice work", null);
  return ok("Hoop closed", {
    total: hoop(thisWeek(after) ?? { picks: [], mine: [] }).total,
    streak: currentStreak(after.weeks, week),
  });
}

/** Take back your log of one of this week's picks. */
export async function undoPinDone(pinId: string): Promise<ActionResult> {
  const me = await requireMember();
  const id = z.string().min(1).safeParse(pinId);
  if (!id.success) return fail("Something's off with that pin");
  const [gone] = await db
    .delete(pinDone)
    .where(and(eq(pinDone.pinId, id.data), eq(pinDone.userId, me.id), eq(pinDone.weekOf, perthWeekStart())))
    .returning({ pinId: pinDone.pinId });
  if (!gone) return fail("There's nothing logged to take back");
  revalidatePath("/boards", "layout");
  return ok("Taken back");
}

/** "Nice one" on a teammate's log, or take it back. Not on your own. */
export async function toggleCheer(doneId: string): Promise<ActionResult> {
  const me = await requireMember();
  const id = z.string().min(1).safeParse(doneId);
  if (!id.success) return fail("Something's off with that log");
  const [log] = await db.select({ userId: pinDone.userId }).from(pinDone).where(eq(pinDone.id, id.data));
  if (!log) return fail("That log's gone");
  if (log.userId === me.id) return fail("You can't cheer your own");
  const [gone] = await db
    .delete(pinCheer)
    .where(and(eq(pinCheer.doneId, id.data), eq(pinCheer.userId, me.id)))
    .returning({ doneId: pinCheer.doneId });
  if (!gone) await db.insert(pinCheer).values({ doneId: id.data, userId: me.id }).onConflictDoNothing();
  revalidatePath("/boards", "layout");
  return ok(gone ? "Taken back" : "Cheered");
}
