import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { appSetting } from "@/server/db/schema";

export type Settings = {
  training_enabled: boolean;
  /** Start of the current season, for vote tallies. ISO date. */
  season_start: string;
  playhq_last_sync: { at: string; ok: boolean; message: string } | null;
};

const DEFAULTS: Settings = {
  training_enabled: false,
  season_start: `${new Date().getFullYear()}-01-01`,
  playhq_last_sync: null,
};

export async function getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
  const [row] = await db.select().from(appSetting).where(eq(appSetting.key, key));
  return (row?.value as Settings[K] | undefined) ?? DEFAULTS[key];
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db.insert(appSetting).values({ key, value }).onConflictDoUpdate({ target: appSetting.key, set: { value } });
}
