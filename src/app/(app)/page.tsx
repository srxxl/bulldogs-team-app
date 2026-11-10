import { redirect } from "next/navigation";

/** There's no home page: the app opens on the fixture. */
export default function Home() {
  redirect("/fixture");
}
