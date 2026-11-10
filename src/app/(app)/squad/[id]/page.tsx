import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Hoop } from "@/components/hoop";
import { Morph, morphName } from "@/components/morph";
import { ButtonLink } from "@/components/ui";
import { positionLabel } from "@/lib/positions";
import { ROLE_LABEL } from "@/lib/roles";
import { requireMember } from "@/server/auth/session";
import { getMember } from "@/server/queries/squad";

export async function generateMetadata({ params }: PageProps<"/squad/[id]">): Promise<Metadata> {
  const p = await getMember((await params).id);
  return { title: p?.displayName ?? "Player" };
}

export default async function PlayerPage({ params }: PageProps<"/squad/[id]">) {
  const me = await requireMember();
  const p = await getMember((await params).id);
  if (!p) notFound();

  const isCoach = p.role === "coach";
  const positions = [p.position, p.secondaryPosition]
    .filter((x) => x !== null)
    .map(positionLabel)
    .join(" / ");
  const subtitle = isCoach ? "Coach" : p.role === "captain" ? `${ROLE_LABEL.captain}, ${positions}` : positions;

  const facts = [
    ["Years playing", p.yearsPlaying != null ? String(p.yearsPlaying) : null],
    ["Footy hero", p.footyHero],
    ["Pre-game song", p.preGameSong],
    ["Off the field", p.occupation],
  ].filter((f): f is [string, string] => !!f[1]);

  return (
    // grows out of the player's card in the squad when you open it, and back into it when you go back
    <Morph name={morphName.player(p.id)}>
      <article className="overflow-hidden rounded-[28px] bg-white md:grid md:grid-cols-[minmax(0,420px)_1fr]">
        <div className="relative aspect-[4/5] bg-powder md:aspect-auto md:min-h-[560px]">
          <BackButton
            href="/squad"
            to="the squad"
            className="absolute top-3 left-3 z-10 bg-white/85 text-navy hover:bg-white"
          />
          {p.image ? (
            <Image
              src={p.image}
              alt={p.displayName}
              fill
              sizes="(min-width: 768px) 420px, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center font-display text-[10rem] font-black text-navy/15">
              {p.displayName[0]}
            </div>
          )}
          {p.guernsey != null && (
            <span
              aria-hidden
              className="display-num num-outline absolute right-3 bottom-0 text-[12rem] font-black text-white md:text-[15rem]"
            >
              {p.guernsey}
            </span>
          )}
        </div>
        <div className="flex flex-col p-6 md:p-10">
          <p className="text-sm font-semibold text-red">{subtitle}</p>
          <h1 className="mt-1 text-6xl font-black leading-[0.85] text-navy md:text-8xl">{p.displayName}</h1>
          <Hoop tone="onChalk" className="my-8 -mx-6 md:-mx-10" />
          {p.bio ? (
            <p className="max-w-prose text-lg text-pretty text-ink/85">{p.bio}</p>
          ) : (
            <p className="text-ink/50">
              {p.id === me.id ? "Add a bit about yourself so the team gets to know you." : "No about me yet."}
            </p>
          )}
          {facts.length > 0 && (
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-chalk p-4">
                  <dt className="text-sm text-ink/60">{k}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {p.id === me.id && (
            <ButtonLink href="/settings" className="mt-8 self-start">
              Edit my profile
            </ButtonLink>
          )}
        </div>
      </article>
    </Morph>
  );
}
