import {
  Apple,
  CalendarDays,
  Dumbbell,
  Home,
  type LucideIcon,
  Menu,
  MessageSquareHeart,
  NotebookPen,
  Settings,
  Shirt,
  Users,
} from "lucide-react";
import { hasRole } from "@/lib/roles";
import type { Role } from "@/server/db/schema";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  minRole?: Role;
  /** Only for people who run the app (user.isAdmin). */
  adminOnly?: boolean;
};

/** Bottom bar on phones (five max). */
export const PRIMARY: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/fixture", label: "Fixture", icon: CalendarDays },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/squad", label: "Squad", icon: Users },
  { href: "/more", label: "More", icon: Menu },
];

/** Everything, for the desktop rail and the More page. */
export const ALL: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/fixture", label: "Fixture", icon: CalendarDays },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/squad", label: "Squad", icon: Users },
  { href: "/notes", label: "Coach's notes", icon: NotebookPen },
  { href: "/boards/fitness", label: "Fitness board", icon: Dumbbell },
  { href: "/boards/nutrition", label: "Nutrition board", icon: Apple },
  { href: "/feedback", label: "Anonymous notes", icon: MessageSquareHeart },
  { href: "/votes", label: "Player's player", icon: Shirt, minRole: "coach" },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

/** The nav entries this person can open. */
export const visibleNav = (items: NavItem[], me: { role: Role; isAdmin: boolean }) =>
  items.filter((i) => (!i.minRole || hasRole(me.role, i.minRole)) && (!i.adminOnly || me.isAdmin));
