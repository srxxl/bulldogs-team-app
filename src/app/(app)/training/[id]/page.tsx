import { redirect } from "next/navigation";

/** Sessions don't have their own page any more: everything is on the Training card. */
export default async function TrainingSessionPage({ params }: PageProps<"/training/[id]">) {
  redirect(`/training#s-${(await params).id}`);
}
