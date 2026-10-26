import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { canManage } from "@/lib/roles";
import type { Me } from "@/server/auth/session";
import type { getPins } from "@/server/queries/content";
import { DeletePinButton } from "./pin-actions";
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

export function PinBoard({ pins, me, empty }: { pins: Pin[]; me: Me; empty: { title: string; body: string } }) {
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
              <div
                className={cn("mt-4 flex items-center justify-between text-xs", dark ? "text-white/60" : "text-ink/50")}
              >
                <span>Pinned by {p.preferredName || p.name.split(" ")[0]}</span>
                {(p.authorId === me.id || canManage(me.role)) && <DeletePinButton id={p.id} />}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
