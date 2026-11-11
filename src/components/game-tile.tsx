import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Morph } from "./morph";

/**
 * A tile on a game's page (and on the Fitness hub): a summary that grows into its own page when tapped (Morph), and shrinks back into
 * the tile on the way back. The whole tile is the link (its title's link stretches over it); anything inside
 * that needs its own taps, like the game day timeline, sits above that with `relative z-10`.
 */
export function GameTile({
  href,
  name,
  title,
  big,
  tone = "white",
  backdrop,
  badge,
  className,
  children,
}: {
  href: string;
  /** The Morph name its page's header shares. */
  name: string;
  title: string;
  /** Full width, with more in it: what matters at this point of the game. */
  big?: boolean;
  /** Red: something to do right now (the one accent on the page). Navy: a dark tile for contrast. */
  tone?: "white" | "navy" | "red";
  /** Behind everything in the tile (a club's guernsey design, say). */
  backdrop?: ReactNode;
  badge?: string;
  /** Extra layout classes, e.g. spanning two rows. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <Morph name={name}>
      <div
        // its page's back button links to #name, so coming back lands on this tile rather than the top
        id={name}
        className={cn(
          "relative isolate flex min-w-0 scroll-mt-6 flex-col gap-1.5 overflow-hidden rounded-2xl p-4 transition-colors",
          big ? "col-span-2 min-h-28 p-5" : "min-h-32",
          {
            white: "bg-white has-[>h2_a:hover]:bg-mist",
            navy: "bg-navy text-white has-[>h2_a:hover]:bg-navy-deep",
            red: "bg-red text-white has-[>h2_a:hover]:bg-red-deep",
          }[tone],
          className,
        )}
      >
        {backdrop && <div className="absolute inset-0 -z-10">{backdrop}</div>}
        <h2
          className={cn(
            "pr-12 font-display font-bold leading-none",
            big ? "text-3xl" : "text-xl",
            tone === "white" ? "text-navy" : "text-white",
          )}
        >
          <Link
            href={href}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-red/40"
          >
            {title}
          </Link>
        </h2>
        {badge && (
          <span
            className={cn(
              "absolute top-4 right-4 rounded-full px-2 py-0.5 text-xs font-bold",
              tone === "red" ? "bg-white text-red" : "bg-red text-white",
            )}
          >
            {badge}
          </span>
        )}
        {children}
      </div>
    </Morph>
  );
}
