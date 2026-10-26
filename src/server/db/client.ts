import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Local fallback when DATABASE_URL is unset. Never used in production. */
export const PGLITE_DIR = ".data/pglite";

async function createPglite(): Promise<Db> {
  const [{ PGlite }, { drizzle }, { mkdir }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("node:fs/promises"),
  ]);
  await mkdir(PGLITE_DIR, { recursive: true });
  return drizzle({
    client: new PGlite(PGLITE_DIR),
    schema,
    casing: "snake_case",
  });
}

function createNeon(url: string): Db {
  neonConfig.webSocketConstructor ??= globalThis.WebSocket;
  return drizzleNeon({
    client: new Pool({ connectionString: url }),
    schema,
    casing: "snake_case",
  });
}

export async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) return createNeon(url);
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set in production");
  }
  return createPglite();
}
