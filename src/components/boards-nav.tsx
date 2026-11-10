import Link from "next/link";
import { cn } from "@/lib/cn";

const VIEWS = [
  { href: "/boards", label: "Your week" },
  { href: "/boards/team", label: "Team" },
  { href: "/boards/history", label: "History" },
] as const;

/** The fitness and nutrition views, as a segmented switch under the page title. */
export function BoardsNav({ current }: { current: (typeof VIEWS)[number]["href"] }) {
  return (
    <nav aria-label="Fitness and nutrition" className="mb-6 flex max-w-md rounded-full bg-ink/[0.07] p-1">
      {VIEWS.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          aria-current={v.href === current ? "page" : undefined}
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center rounded-full text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
            v.href === current ? "bg-white text-navy" : "text-navy/65 hover:text-navy",
          )}
        >
          {v.label}
        </Link>
      ))}
    </nav>
  );
}
