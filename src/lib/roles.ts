import type { Role } from "@/server/db/schema";

const RANK: Record<Role, number> = { pending: 0, player: 1, captain: 2, coach: 3 };

export const hasRole = (role: Role, atLeast: Role) => RANK[role] >= RANK[atLeast];
/** Captains and coaches: weekly notes, session drills and the team board. */
export const canLead = (role: Role) => hasRole(role, "captain");
/** Coaches only: the vote tally and the anonymous notes inbox. Admins don't get these. */
export const isCoach = (role: Role) => role === "coach";
/** Plan training sessions (add, order and remove drills): captains, coaches and admins. */
export const canPlanSessions = (me: { role: Role; isAdmin: boolean }) => me.isAdmin || canLead(me.role);
/** Pick the team on the board: captains, coaches and admins. */
export const canPickTeam = (me: { role: Role; isAdmin: boolean }) => me.isAdmin || canLead(me.role);
/** Write notes on a game: captains, coaches and admins. */
export const canWriteNotes = (me: { role: Role; isAdmin: boolean }) => me.isAdmin || canLead(me.role);
/** How a note's writer is labelled: their leadership role, or nothing for players (e.g. an admin). */
export const noteRole = (role: Role) => (role === "coach" ? "Coach" : role === "captain" ? "Captain" : null);
/** Remove anyone's pins and notes: coaches and admins. */
export const canModerate = (me: { role: Role; isAdmin: boolean }) => me.isAdmin || isCoach(me.role);

export const ROLE_LABEL: Record<Role, string> = {
  pending: "Waiting for approval",
  player: "Player",
  captain: "Captain",
  coach: "Coach",
};
