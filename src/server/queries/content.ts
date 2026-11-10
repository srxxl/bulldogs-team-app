import "server-only";
import { and, asc, count, desc, eq, gte, inArray } from "drizzle-orm";
import { type HoopWeek, weeksBetween } from "@/lib/hoops";
import { db } from "@/server/db";
import {
  type Board,
  event,
  gradeGame,
  ladderRow,
  lineupSlot,
  note,
  pin,
  pinCheer,
  pinDone,
  pinPick,
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

/**
 * The fitness pins picked for one week (a Perth Monday), oldest pick first. Only fitness is tracked week to week:
 * the nutrition board is recipes and health tips, never picked or logged.
 */
export function getWeekPicks(weekOf: string) {
  return db
    .select({ id: pin.id, board: pin.board, title: pin.title, tag: pin.tag, body: pin.body })
    .from(pinPick)
    .innerJoin(pin, eq(pin.id, pinPick.pinId))
    .where(and(eq(pinPick.weekOf, weekOf), eq(pin.board, "fitness")))
    .orderBy(asc(pinPick.createdAt));
}

/** Every fitness pick ever, with its board: the weeks for history and streaks. */
export function getAllPicks() {
  return db
    .select({ pinId: pinPick.pinId, weekOf: pinPick.weekOf, board: pin.board })
    .from(pinPick)
    .innerJoin(pin, eq(pin.id, pinPick.pinId))
    .where(eq(pin.board, "fitness"));
}

/** Everything one person has logged, every week. */
export function getMyDone(userId: string) {
  return db
    .select({ pinId: pinDone.pinId, weekOf: pinDone.weekOf, distanceM: pinDone.distanceM })
    .from(pinDone)
    .innerJoin(pin, eq(pin.id, pinDone.pinId))
    .where(and(eq(pinDone.userId, userId), eq(pin.board, "fitness")));
}

/**
 * Your hoop, every week from the first pick to `thisWeek`: what was picked and what you logged. Feeds your
 * hoop, streak and history.
 */
export async function getMyHoopWeeks(userId: string, thisWeek: string) {
  const [picks, mine] = await Promise.all([getAllPicks(), getMyDone(userId)]);
  const first = [...picks.map((p) => p.weekOf), thisWeek].sort()[0];
  const weeks: HoopWeek[] = weeksBetween(first, thisWeek).map((week) => ({
    week,
    picks: picks.filter((p) => p.weekOf === week).map((p) => ({ pinId: p.pinId, board: p.board })),
    mine: mine.filter((m) => m.weekOf === week).map((m) => ({ pinId: m.pinId, distanceM: m.distanceM })),
  }));
  return { weeks };
}

/** The "Nice one"s on some logs, with who gave them. */
export function getCheers(doneIds: string[]) {
  if (doneIds.length === 0) return Promise.resolve([]);
  return db
    .select({
      doneId: pinCheer.doneId,
      userId: pinCheer.userId,
      name: user.name,
      preferredName: playerProfile.preferredName,
    })
    .from(pinCheer)
    .innerJoin(user, eq(user.id, pinCheer.userId))
    .leftJoin(playerProfile, eq(playerProfile.userId, pinCheer.userId))
    .where(inArray(pinCheer.doneId, doneIds));
}

/** Everyone's logs of this week's picked pins, oldest first, with their names and photos. Everyone sees these. */
export function getWeekDone(weekOf: string) {
  return db
    .select({
      id: pinDone.id,
      pinId: pinDone.pinId,
      pinTitle: pin.title,
      board: pin.board,
      userId: pinDone.userId,
      guernsey: playerProfile.guernsey,
      createdAt: pinDone.createdAt,
      distanceM: pinDone.distanceM,
      durationS: pinDone.durationS,
      note: pinDone.note,
      imageUrl: pinDone.imageUrl,
      name: user.name,
      preferredName: playerProfile.preferredName,
      photo: playerProfile.photoUrl,
      image: user.image,
    })
    .from(pinDone)
    .innerJoin(pin, eq(pin.id, pinDone.pinId))
    .innerJoin(user, eq(user.id, pinDone.userId))
    .leftJoin(playerProfile, eq(playerProfile.userId, pinDone.userId))
    .where(and(eq(pinDone.weekOf, weekOf), eq(pin.board, "fitness")))
    .orderBy(asc(pinDone.createdAt));
}

export type WeekDone = Awaited<ReturnType<typeof getWeekDone>>[number];

/** How many pins each board has. */
export async function getPinCounts(): Promise<Record<Board, number>> {
  const rows = await db.select({ board: pin.board, n: count() }).from(pin).groupBy(pin.board);
  return { fitness: 0, nutrition: 0, ...Object.fromEntries(rows.map((r) => [r.board, r.n])) };
}

/** The grade's games between other clubs, oldest first. */
export function getGradeGames() {
  return db.select().from(gradeGame).orderBy(asc(gradeGame.startsAt));
}

export function getLadder() {
  return db.select().from(ladderRow).orderBy(asc(ladderRow.position));
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
