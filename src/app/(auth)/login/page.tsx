import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Crest } from "@/components/crest";
import { Hoop } from "@/components/hoop";
import { DevSignIn, SignInButtons } from "@/components/sign-in-buttons";
import { devLoginEnabled, enabledProviders } from "@/server/auth";
import { getMe } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };

/** Only allow same-site relative redirects. */
const safeNext = (v: string | string[] | undefined) =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  const me = await getMe();
  if (me) redirect(me.role === "pending" ? "/pending" : next);

  return (
    <main className="grid min-h-dvh md:grid-cols-[1.1fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-navy px-6 pt-10 pb-8 text-white md:px-14 md:py-14">
        <Crest size={72} />
        <div className="my-12 md:my-0">
          <h1 className="font-display text-[clamp(4rem,14vw,10rem)] font-black leading-[0.8] tracking-tight">
            Bulldogs
            <span className="block text-powder">women.</span>
          </h1>
          <Hoop className="mt-8 -mr-6 md:-mr-14" animate />
        </div>
        <p className="max-w-sm text-white/75">
          Brentwood Booragoon's C3 side. Fixtures, training, the team board and votes, all in one spot.
        </p>
      </section>
      <section className="flex items-center px-6 py-12 md:px-14">
        <div className="w-full max-w-sm">
          <h2 className="text-4xl font-extrabold text-navy">Sign in</h2>
          <p className="mt-2 mb-8 text-ink/70">
            Use the account you play with. New here? Sign in and a coach will let you in.
          </p>
          <SignInButtons providers={enabledProviders} next={next} />
          {devLoginEnabled && <DevSignIn next={next} />}
        </div>
      </section>
    </main>
  );
}
