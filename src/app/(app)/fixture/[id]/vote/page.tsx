import { redirect } from "next/navigation";

/** Voting lives on the game page now. */
export default async function VotePage({ params }: PageProps<"/fixture/[id]/vote">) {
  redirect(`/fixture/${(await params).id}#votes`);
}
