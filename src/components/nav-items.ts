import { Apple, CalendarDays, Dumbbell, type LucideIcon, Settings, Trophy, Users } from "lucide-react";
import { hasRole } from "@/lib/roles";
import type { Role } from "@/server/db/schema";

export type NavItem = {
  href: string;
  label: string;
  /** A shorter label for the phone tab bar, where every tab shares one row. */
  short?: string;
  icon: LucideIcon;
  minRole?: Role;
  /** Only for people who run the app (user.isAdmin). */
  adminOnly?: boolean;
};

/** Every page, for the desktop rail and the phone tab bar. */
export const ALL: NavItem[] = [
  { href: "/fixture", label: "Fixture", icon: CalendarDays },
  { href: "/ladder", label: "Ladder", icon: Trophy },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/squad", label: "Team", icon: Users },
  { href: "/boards", label: "Fitness", icon: Apple },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** The nav entries this person can open. */
export const visibleNav = (items: NavItem[], me: { role: Role; isAdmin: boolean }) =>
  items.filter((i) => (!i.minRole || hasRole(me.role, i.minRole)) && (!i.adminOnly || me.isAdmin));
