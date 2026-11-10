import "server-only";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import {
  type Board,
  event,
  feedback,
  gradeGame,
  ladderRow,
  lineupSlot,
  note,
  pin,
  playerProfile,
  user,
  vote,
} from "@/server/db/schema";

const authorName = {
  name: user.name,
  preferredName: playerProfile.preferredName,
  role: user.role,
};

/** Notes for one game, newest first. */
export function getGameNotes(eventId: string) {
  return db
    .select({
      id: note.id,
      title: note.title,
      body: note.body,
      createdAt: note.createdAt,
      authorId: note.authorId,
      ...authorName,
    })
    .from(note)
    .innerJoin(user, eq(user.id, note.authorId))
    .leftJoin(playerProfile, eq(playerProfile.userId, note.authorId))
    .where(eq(note.eventId, eventId))
    .orderBy(desc(note.createdAt));
}

export type GameNote = Awaited<ReturnType<typeof getGameNotes>>[number];

export function getPins(board: Board) {
  return db
    .select({
      id: pin.id,
      title: pin.title,
      body: pin.body,
      link: pin.link,
      imageUrl: pin.imageUrl,
      tag: pin.tag,
      createdAt: pin.createdAt,
      authorId: pin.authorId,
      ...authorName,
    })
    .from(pin)
    .innerJoin(user, eq(user.id, pin.authorId))
    .leftJoin(playerProfile, eq(playerProfile.userId, pin.authorId))
    .where(eq(pin.board, board))
    .orderBy(desc(pin.createdAt));
}

/** The grade's games between other clubs, oldest first. */
export function getGradeGames() {
  return db.select().from(gradeGame).orderBy(asc(gradeGame.startsAt));
}

export function getLadder() {
  return db.select().from(ladderRow).orderBy(asc(ladderRow.position));
}

export function getFeedback() {
  return db
    .select({
      id: feedback.id,
      kind: feedback.kind,
      body: feedback.body,
      submittedOn: feedback.submittedOn,
      readByCoach: feedback.readByCoach,
      eventTitle: event.title,
      eventRound: event.round,
    })
    .from(feedback)
    .leftJoin(event, eq(event.id, feedback.eventId))
    .orderBy(asc(feedback.readByCoach), desc(feedback.submittedOn));
}

export async function getLineup(eventId: string) {
  const rows = await db.select().from(lineupSlot).where(eq(lineupSlot.eventId, eventId));
  return Object.fromEntries(rows.map((r) => [r.slot, r.userId])) as Record<string, string>;
}

export async function getMyBallot(eventId: string, voterId: string) {
  const rows = await db
    .select({ nomineeId: vote.nomineeId, points: vote.points })
    .from(vote)
    .where(and(eq(vote.eventId, eventId), eq(vote.voterId, voterId)));
  if (rows.length === 0) return null;
  const by = (p: number) => rows.find((r) => r.points === p)?.nomineeId ?? "";
  return { three: by(3), two: by(2), one: by(1) };
}

/** All votes cast for games since `since` (season tally). */
export function getVotesSince(since: Date) {
  return db
    .select({
      eventId: vote.eventId,
      nomineeId: vote.nomineeId,
      points: vote.points,
    })
    .from(vote)
    .innerJoin(event, eq(event.id, vote.eventId))
    .where(gte(event.startsAt, since));
}

export async function getBallotCounts(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, number>();
  const rows = await db
    .select({ eventId: vote.eventId, voterId: vote.voterId })
    .from(vote)
    .where(and(inArray(vote.eventId, eventIds), eq(vote.points, 3)));
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.eventId, (m.get(r.eventId) ?? 0) + 1);
  return m;
}

/** One game's votes (coach-only results). */
export function getGameVotes(eventId: string) {
  return db
    .select({ eventId: vote.eventId, nomineeId: vote.nomineeId, points: vote.points })
    .from(vote)
    .where(eq(vote.eventId, eventId));
}
