import { createDb, PGLITE_DIR } from "./client";

const migrationsFolder = "drizzle";

async function main() {
  const db = await createDb();
  if (process.env.DATABASE_URL) {
    const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
    await migrate(db as Parameters<typeof migrate>[0], { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as Parameters<typeof migrate>[0], { migrationsFolder });
    console.log(`Local database at ${PGLITE_DIR}`);
  }
  console.log("Migrations applied");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
