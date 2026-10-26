import "server-only";
import { createDb, type Db } from "./client";

// One client per server instance; survives dev hot reloads (PGlite allows a single opener).
const globalForDb = globalThis as unknown as { bulldogsDb?: Promise<Db> };
globalForDb.bulldogsDb ??= createDb();

export const db: Db = await globalForDb.bulldogsDb;
export * as t from "./schema";
export type { Db };
