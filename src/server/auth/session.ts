import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { hasRole } from "@/lib/roles";
import { db } from "@/server/db";
import { type Role, user } from "@/server/db/schema";
import { auth } from ".";

export type Me = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  /** Runs the app: approvals, fixture, PFL data, settings. Independent of team role. */
  isAdmin: boolean;
};

/**
 * The signed-in user, read fresh from the DB so role changes apply immediately.
 * Cached per request.
 */
export const getMe = cache(async (): Promise<Me | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isAdmin: user.isAdmin,
    })
    .from(user)
    .where(eq(user.id, session.user.id));
  return row ?? null;
});

/** People who run the app, otherwise a 403. */
export async function requireAdmin(): Promise<Me> {
  const me = await requireMember();
  if (!me.isAdmin) forbidden();
  return me;
}

/** Any approved member. Redirects guests to /login and pending users to /pending. */
export async function requireMember(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.role === "pending") redirect("/pending");
  return me;
}

/** At least the given role, otherwise a 403. */
export async function requireRole(atLeast: Role): Promise<Me> {
  const me = await requireMember();
  if (!hasRole(me.role, atLeast)) forbidden();
  return me;
}
