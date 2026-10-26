import {
  Apple,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Home,
  type LucideIcon,
  Menu,
  MessageSquareHeart,
  NotebookPen,
  Settings,
  Shirt,
  Trophy,
  Users,
} from "lucide-react";
import type { Role } from "@/server/db/schema";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  minRole?: Role;
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
  { href: "/ladder", label: "Ladder", icon: Trophy },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/training/drills", label: "Drills", icon: ClipboardList },
  { href: "/squad", label: "Squad", icon: Users },
  { href: "/notes", label: "Coach's notes", icon: NotebookPen },
  { href: "/boards/fitness", label: "Fitness board", icon: Dumbbell },
  { href: "/boards/nutrition", label: "Nutrition board", icon: Apple },
  { href: "/feedback", label: "Anonymous notes", icon: MessageSquareHeart },
  { href: "/votes", label: "Player's player", icon: Shirt, minRole: "coach" },
  { href: "/admin", label: "Admin", icon: Settings, minRole: "coach" },
];
