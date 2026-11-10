import type { Role } from "@/server/db/schema";

const RANK: Record<Role, number> = { pending: 0, player: 1, captain: 2, coach: 3 };

export const hasRole = (role: Role, atLeast: Role) => RANK[role] >= RANK[atLeast];
/** Captains and coaches: weekly notes, session drills and the team board. */
export const canLead = (role: Role) => hasRole(role, "captain");
/** Coaches only: the vote tally. Admins don't get this. */
export const isCoach = (role: Role) => role === "coach";
/** Plan training sessions (add, order and remove drills): captains, coaches and admins. */
export const canPlanSessions = (me: { role: Role; isAdmin: boolean }) => me.isAdmin || canLead(me.role);
/** Pick fitness and nutrition pins for the week: captains, coaches and admins. */
export const canPickPins = (me: { role: Role; isAdmin: boolean }) => me.isAdmin || canLead(me.role);
/** Pick the team on the board: captains, coaches and admins. */
export const canPickTeam = (me: { role: Role; isAdmin: boolean }) => me.isAdmin || canLead(me.role);
/** The red badge for team leaders ("Skip" for captains, "Coach"); nothing for everyone else. */
export const leaderBadge = (role: Role) => (role === "captain" || role === "coach" ? ROLE_LABEL[role] : null);
/** Remove anyone's pins and notes: coaches and admins. */
export const canModerate = (me: { role: Role; isAdmin: boolean }) => me.isAdmin || isCoach(me.role);

export const ROLE_LABEL: Record<Role, string> = {
  pending: "Waiting for approval",
  player: "Player",
  captain: "Skip", // the club calls its captains "skips"
  coach: "Coach",
};
