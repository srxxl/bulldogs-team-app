"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { blank, parseForm } from "@/lib/form";
import { requireMember } from "@/server/auth/session";
import { db } from "@/server/db";
import { playerProfile, positionEnum } from "@/server/db/schema";
import { storeImage } from "@/server/upload";

const text = (max: number) => z.preprocess(blank, z.string().trim().max(max).optional());
const int = (min: number, max: number, msg: string) =>
  z.preprocess(blank, z.coerce.number().int().min(min, msg).max(max, msg).optional());

const profileSchema = z.object({
  preferredName: text(40),
  guernsey: int(1, 99, "Numbers go from 1 to 99"),
  position: z.enum(positionEnum.enumValues),
  secondaryPosition: z.preprocess(blank, z.enum(positionEnum.enumValues).optional()),
  bio: text(600),
  yearsPlaying: int(0, 60, "That's a lot of years"),
  footyHero: text(80),
  preGameSong: text(80),
  occupation: text(80),
});

export async function updateProfile(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = parseForm(profileSchema, formData);
  if ("error" in parsed) return parsed.error;
  const photo = await storeImage(formData.get("photo"), "players");
  if (photo && "error" in photo) return fail(photo.error, { photo: [photo.error] });

  const values = {
    ...parsed.data,
    guernsey: parsed.data.guernsey ?? null,
    secondaryPosition: parsed.data.secondaryPosition ?? null,
    ...(photo && { photoUrl: photo.url }),
  };
  try {
    await db
      .insert(playerProfile)
      .values({ userId: me.id, ...values })
      .onConflictDoUpdate({ target: playerProfile.userId, set: values });
  } catch (err) {
    if (String((err as { cause?: unknown })?.cause ?? err).includes("guernsey")) {
      return fail("Someone already wears that number", {
        guernsey: ["Someone already wears that number"],
      });
    }
    throw err;
  }
  revalidatePath("/squad", "layout");
  revalidatePath("/me");
  return ok("Profile saved");
}
