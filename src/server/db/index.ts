import "server-only";
import { createDb, type Db } from "./client";

// One pool per server process; survives dev hot reloads.
const globalForDb = globalThis as unknown as { bulldogsDb?: Db };
globalForDb.bulldogsDb ??= createDb();

export const db: Db = globalForDb.bulldogsDb;
export * as t from "./schema";
export type { Db };
