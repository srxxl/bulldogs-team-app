"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { blank, parseForm } from "@/lib/form";
import { canLead, canModerate } from "@/lib/roles";
import { perthToday } from "@/lib/time";
import { requireMember, requireRole } from "@/server/auth/session";
import { db } from "@/server/db";
import { boardEnum, feedback, feedbackKindEnum, note, pin } from "@/server/db/schema";
import { storeImage } from "@/server/upload";

/* Notes ------------------------------------------------------------------ */

const noteSchema = z.object({
  title: z.string().trim().min(1, "Give it a title").max(100),
  body: z.string().trim().min(1, "Write something").max(4000),
  pinned: z.preprocess((v) => v === "on", z.boolean()),
});

export async function createNote(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await requireRole("captain");
  const parsed = parseForm(noteSchema, formData);
  if ("error" in parsed) return parsed.error;
  await db.transaction(async (tx) => {
    // Only one pinned note at a time; it's the one on the home screen.
    if (parsed.data.pinned) await tx.update(note).set({ pinned: false }).where(eq(note.pinned, true));
    await tx.insert(note).values({ ...parsed.data, authorId: me.id });
  });
  revalidatePath("/notes");
  revalidatePath("/");
  return ok("Note posted");
}

export async function deleteNote(id: string): Promise<ActionResult> {
  const me = await requireRole("captain");
  const where = canModerate(me) ? eq(note.id, id) : and(eq(note.id, id), eq(note.authorId, me.id));
  await db.delete(note).where(where);
  revalidatePath("/notes");
  revalidatePath("/");
  return ok("Note deleted");
}

/* Pins (fitness / nutrition / drills) ------------------------------------- */

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
  if (parsed.data.board === "drills" && !canLead(me.role)) return fail("Only coaches and captains add drills");
  const image = await storeImage(formData.get("image"), "pins");
  if (image && "error" in image) return fail(image.error, { image: [image.error] });

  await db.insert(pin).values({ ...parsed.data, authorId: me.id, imageUrl: image?.url });
  revalidatePath(parsed.data.board === "drills" ? "/training/drills" : `/boards/${parsed.data.board}`);
  return ok("Pinned");
}

export async function deletePin(id: string): Promise<ActionResult> {
  const me = await requireMember();
  const where = canModerate(me) ? eq(pin.id, id) : and(eq(pin.id, id), eq(pin.authorId, me.id));
  const [deleted] = await db.delete(pin).where(where).returning({ board: pin.board });
  if (!deleted) return fail("You can only remove your own pins");
  revalidatePath(deleted.board === "drills" ? "/training/drills" : `/boards/${deleted.board}`);
  return ok("Removed");
}

/* Anonymous feedback ------------------------------------------------------ */

const feedbackSchema = z.object({
  kind: z.enum(feedbackKindEnum.enumValues),
  eventId: z.preprocess(blank, z.string().optional()),
  body: z.string().trim().min(3, "Write a little more").max(2000),
});

/**
 * Deliberately records nothing about the sender: membership is checked, then
 * forgotten. Only the Perth calendar date is stored.
 */
export async function submitFeedback(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireMember();
  const parsed = parseForm(feedbackSchema, formData);
  if ("error" in parsed) return parsed.error;
  await db.insert(feedback).values({ ...parsed.data, submittedOn: perthToday() });
  revalidatePath("/feedback");
  return ok("Sent anonymously. Thanks for speaking up.");
}

export async function markFeedbackRead(id: string): Promise<ActionResult> {
  await requireRole("coach");
  await db.update(feedback).set({ readByCoach: true }).where(eq(feedback.id, id));
  revalidatePath("/feedback");
  return ok();
}
