import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

/** Local database served by `pnpm dev` (PGlite socket server). Seeding only ever runs against this. */
export const LOCAL_DB_PORT = 54329;

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) {
    throw new Error("DATABASE_URL is not set. Locally, copy .env.example to .env.local and run `pnpm dev`.");
  }
  const pool = new Pool({ connectionString: url, max: 10 });
  // On Vercel, releases idle connections before a function instance is suspended.
  attachDatabasePool(pool);
  return drizzle({ client: pool, schema, casing: "snake_case" });
}

export const isLocalDb = (url = process.env.DATABASE_URL ?? "") => /@(localhost|127\.0\.0\.1):/.test(url);
