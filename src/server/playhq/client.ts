import "server-only";
import type { z } from "zod";
import { fixtureGameSchema, ladderSchema, pageSchema } from "./map";

const BASE = "https://api.playhq.com/v1";

export type PlayHqConfig = {
  apiKey: string;
  teamId: string;
  gradeId: string | null;
};

export function playHqConfig(): PlayHqConfig | null {
  const apiKey = process.env.PLAYHQ_API_KEY;
  const teamId = process.env.PLAYHQ_TEAM_ID;
  if (!apiKey || !teamId) return null;
  return { apiKey, teamId, gradeId: process.env.PLAYHQ_GRADE_ID || null };
}

async function get<T extends z.ZodType>(cfg: PlayHqConfig, path: string, schema: T): Promise<z.infer<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "x-api-key": cfg.apiKey,
      "x-phq-tenant": "afl",
      accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`PlayHQ ${path} responded ${res.status}`);
  return schema.parse(await res.json());
}

export async function fetchTeamFixture(cfg: PlayHqConfig) {
  const page = pageSchema(fixtureGameSchema);
  const games: z.infer<typeof fixtureGameSchema>[] = [];
  let cursor: string | null | undefined;
  // Cursor pagination; cap pages so a misbehaving API can't loop forever.
  for (let i = 0; i < 10; i++) {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const res = await get(cfg, `/teams/${cfg.teamId}/fixture${qs}`, page);
    games.push(...res.data);
    cursor = res.metadata?.nextCursor;
    if (!res.metadata?.hasMore || !cursor) break;
  }
  return games;
}

export const fetchLadder = (cfg: PlayHqConfig, gradeId: string) => get(cfg, `/grades/${gradeId}/ladder`, ladderSchema);
