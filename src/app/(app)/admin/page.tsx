import { redirect } from "next/navigation";

/** Old address: it all lives in Settings now. */
export default function Page() {
  redirect("/settings");
}
