import "server-only";
import type { Pool } from "pg";
import { createDb, createPool, type Db } from "./client";

// Cache only the connection pool across dev hot reloads. The Drizzle instance is rebuilt each time this
// module loads, so it always carries the current schema (a cached instance keeps the old one after a
// schema change and fails to name new columns).
const globalForDb = globalThis as unknown as { bulldogsPool?: Pool };
globalForDb.bulldogsPool ??= createPool();

export const db: Db = createDb(globalForDb.bulldogsPool);
export * as t from "./schema";
export type { Db };
