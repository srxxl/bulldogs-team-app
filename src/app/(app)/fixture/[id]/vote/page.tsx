import { redirect } from "next/navigation";

/** Voting has its own page under the game. */
export default async function VotePage({ params }: PageProps<"/fixture/[id]/vote">) {
  redirect(`/fixture/${(await params).id}/votes`);
}
