import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "./client";

async function main() {
  const db = createDb();
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations applied");
  await db.$client.end();
}

main().catch((err) => {
  console.error(
    err instanceof Error && "code" in err && err.code === "ECONNREFUSED"
      ? "Can't reach the database. Locally, start it with `pnpm dev` (or `pnpm db:server`) first."
      : err,
  );
  process.exit(1);
});
