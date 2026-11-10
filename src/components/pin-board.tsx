import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { canModerate, canPickPins } from "@/lib/roles";
import type { Me } from "@/server/auth/session";
import type { getPins, WeekDone } from "@/server/queries/content";
import { DeletePinButton, DoneSheet, PickPinButton } from "./pin-actions";
import { PinDoneList } from "./pin-done";
import { EmptyState } from "./ui";

type Pin = Awaited<ReturnType<typeof getPins>>[number];

// Text-only pins rotate through tones so the board reads like a real wall, not a grid of clones.
const TONES = ["bg-white text-ink", "bg-powder text-navy", "bg-navy text-white", "bg-mist text-ink"];
const toneFor = (id: string) => TONES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * A board's pins as a pin-board wall. This week's picks are marked, and anyone can log doing them.
 */
export function PinBoard({
  pins,
  me,
  picked,
  done,
  fitness,
  empty,
}: {
  pins: Pin[];
  me: Me;
  /** The pins picked for this week. */
  picked: Set<string>;
  /** This week's logs, for the picked pins' "I did it" and who's done it. */
  done: WeekDone[];
  /** Fitness pins log distance and time too. */
  fitness: boolean;
  empty: { title: string; body: string };
}) {
  if (pins.length === 0) return <EmptyState title={empty.title}>{empty.body}</EmptyState>;
  return (
    <div className="masonry">
      {pins.map((p) => {
        const tone = p.imageUrl ? "bg-white text-ink" : toneFor(p.id);
        const dark = tone.includes("bg-navy");
        return (
          <article key={p.id} className={cn("group relative overflow-hidden rounded-2xl", tone)}>
            {p.imageUrl && (
              <Image
                src={p.imageUrl}
                alt=""
                width={600}
                height={600}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full"
              />
            )}
            <div className="p-4">
              {picked.has(p.id) && (
                <span className="mr-1.5 mb-2 inline-block rounded-full bg-red px-2.5 py-0.5 text-xs font-semibold text-white">
                  This week
                </span>
              )}
              {p.tag && (
                <span
                  className={cn(
                    "mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    dark ? "bg-white/15" : "bg-navy/10 text-navy",
                  )}
                >
                  {p.tag}
                </span>
              )}
              <h3 className={cn("font-display text-2xl font-bold leading-tight", !dark && "text-navy")}>{p.title}</h3>
              {p.body && (
                <p className={cn("mt-2 whitespace-pre-line text-sm", dark ? "text-white/85" : "text-ink/80")}>
                  {p.body}
                </p>
              )}
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4",
                    dark ? "text-powder" : "text-red",
                  )}
                >
                  <ExternalLink size={14} /> {hostOf(p.link)}
                </a>
              )}
              {picked.has(p.id) && (
                <PickedPinDone pinId={p.id} title={p.title} done={done} me={me} fitness={fitness} dark={dark} />
              )}
              <div
                className={cn("mt-4 flex items-center justify-between text-xs", dark ? "text-white/60" : "text-ink/50")}
              >
                <span>Pinned by {p.preferredName || p.name.split(" ")[0]}</span>
                <span className="flex items-center gap-3">
                  {fitness && canPickPins(me) && <PickPinButton id={p.id} picked={picked.has(p.id)} />}
                  {(p.authorId === me.id || canModerate(me)) && <DeletePinButton id={p.id} />}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** On a pin picked for this week: who's done it, and your own "I did it". */
function PickedPinDone({
  pinId,
  title,
  done,
  me,
  fitness,
  dark,
}: {
  pinId: string;
  title: string;
  done: WeekDone[];
  me: Me;
  fitness: boolean;
  dark: boolean;
}) {
  const forPin = done.filter((d) => d.pinId === pinId);
  const mine = forPin.find((d) => d.userId === me.id) ?? null;
  return (
    <>
      <PinDoneList done={forPin} dark={dark} />
      <div className="mt-4">
        <DoneSheet pinId={pinId} title={title} fitness={fitness} mine={mine} dark={dark} />
      </div>
    </>
  );
}
