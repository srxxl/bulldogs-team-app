"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { requireMember } from "@/server/auth/session";
import { db } from "@/server/db";
import { availability, availabilityEnum } from "@/server/db/schema";
import { getEvent } from "@/server/queries/events";

const schema = z.object({
  eventId: z.string().min(1),
  status: z.enum(availabilityEnum.enumValues),
  note: z.string().trim().max(140).optional(),
});

export async function setAvailability(input: z.input<typeof schema>): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("That didn't work, try again");
  const { eventId, status, note } = parsed.data;

  const ev = await getEvent(eventId);
  if (!ev || ev.cancelled) return fail("That event isn't on any more");
  if ((ev.endsAt ?? ev.startsAt) < new Date()) return fail("That's already happened");

  await db
    .insert(availability)
    .values({ eventId, userId: me.id, status, note: note || null })
    .onConflictDoUpdate({
      target: [availability.eventId, availability.userId],
      set: { status, ...(note !== undefined && { note: note || null }) },
    });
  revalidatePath("/", "layout");
  return ok();
}
