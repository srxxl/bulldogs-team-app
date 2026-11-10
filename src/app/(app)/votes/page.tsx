import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth/session";
import { getLastGame } from "@/server/queries/events";

/** The season tally now lives on each game's votes page; old links go to the last game's. */
export default async function VotesPage() {
  await requireRole("coach");
  const last = await getLastGame();
  redirect(last ? `/fixture/${last.id}/votes` : "/fixture");
}
