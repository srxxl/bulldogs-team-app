import type { Role } from "@/server/db/schema";

const RANK: Record<Role, number> = {
  pending: 0,
  player: 1,
  captain: 2,
  coach: 3,
  admin: 4,
};

export const hasRole = (role: Role, atLeast: Role) => RANK[role] >= RANK[atLeast];
/** Coaches + admins: approvals, events, drills, votes tally, feedback. */
export const canManage = (role: Role) => hasRole(role, "coach");
/** Captains and up: weekly notes and the team board. */
export const canLead = (role: Role) => hasRole(role, "captain");

export const ROLE_LABEL: Record<Role, string> = {
  pending: "Waiting for approval",
  player: "Player",
  captain: "Captain",
  coach: "Coach",
  admin: "Admin",
};
