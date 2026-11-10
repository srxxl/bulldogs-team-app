import { redirect } from "next/navigation";

/** The boards open on the fitness tab. */
export default function BoardsPage() {
  redirect("/boards/fitness");
}
