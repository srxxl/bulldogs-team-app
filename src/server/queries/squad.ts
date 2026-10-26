import "server-only";
import { and, asc, eq, ne } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/server/db";
import { type Position, playerProfile, type Role, user } from "@/server/db/schema";

export type SquadMember = {
  id: string;
  name: string;
  displayName: string;
  email: string;
  image: string | null;
  role: Role;
  guernsey: number | null;
  position: Position;
  secondaryPosition: Position | null;
  bio: string | null;
  yearsPlaying: number | null;
  footyHero: string | null;
  preGameSong: string | null;
  occupation: string | null;
};

const columns = {
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  role: user.role,
  preferredName: playerProfile.preferredName,
  photoUrl: playerProfile.photoUrl,
  guernsey: playerProfile.guernsey,
  position: playerProfile.position,
  secondaryPosition: playerProfile.secondaryPosition,
  bio: playerProfile.bio,
  yearsPlaying: playerProfile.yearsPlaying,
  footyHero: playerProfile.footyHero,
  preGameSong: playerProfile.preGameSong,
  occupation: playerProfile.occupation,
};

const baseQuery = () => db.select(columns).from(user).leftJoin(playerProfile, eq(playerProfile.userId, user.id));
type Row = Awaited<ReturnType<typeof baseQuery>>[number];

const toMember = (r: Row): SquadMember => ({
  id: r.id,
  name: r.name,
  displayName: r.preferredName || r.name,
  email: r.email,
  image: r.photoUrl ?? r.image,
  role: r.role,
  guernsey: r.guernsey,
  position: r.position ?? "utility",
  secondaryPosition: r.secondaryPosition,
  bio: r.bio,
  yearsPlaying: r.yearsPlaying,
  footyHero: r.footyHero,
  preGameSong: r.preGameSong,
  occupation: r.occupation,
});

/** Approved members, by guernsey number then name. */
export const getSquad = cache(async (): Promise<SquadMember[]> => {
  const rows = await baseQuery().where(ne(user.role, "pending")).orderBy(asc(playerProfile.guernsey), asc(user.name));
  return rows.map(toMember);
});

export const getMember = cache(async (id: string): Promise<SquadMember | null> => {
  const [row] = await baseQuery().where(and(eq(user.id, id), ne(user.role, "pending")));
  return row ? toMember(row) : null;
});

export function getAllUsers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.role), asc(user.name));
}
