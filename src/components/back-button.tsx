import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The way back to a list from a page it opened (a game, a team, a player): a round button in the corner of the
 * page's header card. It's a link, not history.back(), so the header shrinks back into its row (Morph), which a
 * back gesture doesn't play; it replaces this page in the history, so the back gesture won't return to it after.
 * Colour comes from the card: it inherits the text colour and tints its own background with it.
 */
export function BackButton({ href, to, className }: { href: string; to: string; className?: string }) {
  return (
    <Link
      href={href}
      replace
      aria-label={`Back to ${to}`}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full bg-current/15 transition-colors hover:bg-current/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        className,
      )}
    >
      <ChevronLeft size={22} strokeWidth={2.5} aria-hidden />
    </Link>
  );
}
