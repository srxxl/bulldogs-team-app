import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Crest } from "@/components/crest";
import { SignOutButton } from "@/components/sign-in-buttons";
import { buttonClass } from "@/components/ui";
import { getMe } from "@/server/auth/session";

export const metadata: Metadata = { title: "Waiting for approval" };

export default async function PendingPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.role !== "pending") redirect("/");

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <Crest size={88} className="mx-auto" />
        <h1 className="mt-6 text-5xl font-extrabold text-navy">Nearly there, {me.name.split(" ")[0]}</h1>
        <p className="mt-4 text-ink/70">
          You're signed in as <strong className="text-ink">{me.email}</strong>. The team admin needs to approve you
          before you can see the team. Give them a nudge at training, then refresh this page.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a href="/pending" className={buttonClass("primary")}>
            Check again
          </a>
          <SignOutButton className={buttonClass("ghost")} />
        </div>
      </div>
    </main>
  );
}
