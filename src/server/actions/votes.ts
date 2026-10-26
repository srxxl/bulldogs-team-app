"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { validateBallot, voteWindow } from "@/lib/votes";
import { requireMember } from "@/server/auth/session";
import { db } from "@/server/db";
import { vote } from "@/server/db/schema";
import { getEvent } from "@/server/queries/events";
import { getSquad } from "@/server/queries/squad";

const schema = z.object({
  eventId: z.string(),
  three: z.string(),
  two: z.string(),
  one: z.string(),
});

export async function submitBallot(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Pick a player for 3, 2 and 1 votes");
  const { eventId, ...ballot } = parsed.data;

  const [game, squad] = await Promise.all([getEvent(eventId), getSquad()]);
  if (game?.kind !== "game") return fail("That game doesn't exist");
  const window = voteWindow(game.startsAt);
  if (window === "before") return fail("Votes open two hours after the bounce");
  if (window === "closed") return fail("Voting for this game has closed");

  const error = validateBallot(ballot, me.id, new Set(squad.map((p) => p.id)));
  if (error) return fail(error);

  await db.transaction(async (tx) => {
    await tx.delete(vote).where(and(eq(vote.eventId, eventId), eq(vote.voterId, me.id)));
    await tx.insert(vote).values([
      { eventId, voterId: me.id, nomineeId: ballot.three, points: 3 },
      { eventId, voterId: me.id, nomineeId: ballot.two, points: 2 },
      { eventId, voterId: me.id, nomineeId: ballot.one, points: 1 },
    ]);
  });
  revalidatePath(`/fixture/${eventId}`, "layout");
  revalidatePath("/");
  return ok("Votes in. You can change them until voting closes.");
}
