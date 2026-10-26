"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Role } from "@/server/db/schema";
import { Avatar } from "./avatar";
import { ALL, PRIMARY, visibleNav } from "./nav-items";

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

/** The most specific nav entry wins, so /training/drills doesn't also light up Training. */
function activeHref(pathname: string, hrefs: string[]) {
  return hrefs.filter((h) => isActive(pathname, h)).sort((a, b) => b.length - a.length)[0];
}

export function SideNav({
  role,
  isAdmin,
  name,
  image,
  crest,
}: {
  role: Role;
  isAdmin: boolean;
  name: string;
  image: string | null;
  crest: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = visibleNav(ALL, { role, isAdmin });
  const current = activeHref(
    pathname,
    items.map((i) => i.href),
  );
  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-navy px-4 py-6 text-white md:flex"
    >
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        {crest}
        <span className="font-display text-2xl font-extrabold leading-none">
          Bulldogs
          <span className="block text-sm font-semibold text-powder">Women's C3</span>
        </span>
      </Link>
      <ul className="flex-1 space-y-0.5 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === current;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  active ? "bg-white text-navy" : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon size={18} className={active ? "text-red" : undefined} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/me" className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/10">
        <Avatar name={name} src={image} size={36} />
        <span className="min-w-0 truncate text-sm font-semibold">{name}</span>
      </Link>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const current =
    activeHref(
      pathname,
      PRIMARY.map((i) => i.href),
    ) ?? "/more";
  return (
    <nav aria-label="Main" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 md:hidden">
      <ul className="grid grid-cols-5 rounded-2xl bg-ink/95 p-1.5 text-white backdrop-blur">
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = href === current;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold",
                  active ? "bg-white text-navy" : "text-white/70",
                )}
              >
                <Icon size={20} className={active ? "text-red" : undefined} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
