import { redirect } from "next/navigation";

/** Your weeks now live at the foot of the Fitness page. */
export default function HistoryPage() {
  redirect("/boards/fitness#weeks");
}
