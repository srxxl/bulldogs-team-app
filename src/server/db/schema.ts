import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () =>
  text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ------------------------------------------------------------------------ */
/* Better Auth                                                               */
/* ------------------------------------------------------------------------ */

/** Team role. Admin is a separate flag (`user.isAdmin`) so a player can run the app without seeing coach-only data. */
export const roleEnum = pgEnum("role", ["pending", "player", "captain", "coach"]);

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  role: roleEnum().notNull().default("pending"),
  isAdmin: boolean().notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.identifier)],
);

/* ------------------------------------------------------------------------ */
/* Team                                                                      */
/* ------------------------------------------------------------------------ */

export const positionEnum = pgEnum("position", ["defender", "midfielder", "ruck", "forward", "utility"]);

export const playerProfile = pgTable(
  "player_profile",
  {
    userId: text()
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    preferredName: text(),
    guernsey: smallint(),
    position: positionEnum().notNull().default("utility"),
    secondaryPosition: positionEnum(),
    photoUrl: text(),
    bio: text(),
    yearsPlaying: smallint(),
    footyHero: text(),
    preGameSong: text(),
    occupation: text(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex().on(t.guernsey), check("guernsey_range", sql`${t.guernsey} between 1 and 99`)],
);

export const eventKindEnum = pgEnum("event_kind", ["game", "training", "social", "other"]);

export const event = pgTable(
  "event",
  {
    id: id(),
    kind: eventKindEnum().notNull(),
    title: text().notNull(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }),
    venueName: text(),
    venueAddress: text(),
    details: text(),
    // Games only
    round: text(),
    opponent: text(),
    isHome: boolean(),
    isFinal: boolean().notNull().default(false),
    teamGoals: smallint(),
    teamBehinds: smallint(),
    oppGoals: smallint(),
    oppBehinds: smallint(),
    playhqGameId: text().unique(),
    /** Game day timeline (steps as minutes before bounce); null means the default (src/lib/timeline.ts). */
    timeline: jsonb().$type<{ label: string; minutesBefore: number }[]>(),
    cancelled: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.startsAt), index().on(t.kind, t.startsAt), index().on(t.opponent)],
);

/** A straight in or out: no "maybe", so coaches can plan. */
export const availabilityEnum = pgEnum("availability_status", ["yes", "no"]);

export const availability = pgTable(
  "availability",
  {
    eventId: text()
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: availabilityEnum().notNull(),
    note: text(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.userId] })],
);

/** One row per (voter, game, points). A full ballot is three rows: 3, 2 and 1. */
export const vote = pgTable(
  "vote",
  {
    eventId: text()
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    voterId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nomineeId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    points: smallint().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.voterId, t.points] }),
    uniqueIndex().on(t.eventId, t.voterId, t.nomineeId),
    index().on(t.nomineeId),
    check("vote_points", sql`${t.points} in (1, 2, 3)`),
    check("vote_not_self", sql`${t.voterId} <> ${t.nomineeId}`),
  ],
);

export const lineupSlot = pgTable(
  "lineup_slot",
  {
    eventId: text()
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    slot: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.slot] }), uniqueIndex().on(t.eventId, t.userId)],
);

/** A coach's or captain's note for one game. */
export const note = pgTable(
  "note",
  {
    id: id(),
    authorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventId: text().references(() => event.id, { onDelete: "cascade" }),
    title: text().notNull(),
    body: text().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.eventId, t.createdAt)],
);

export const boardEnum = pgEnum("board", ["fitness", "nutrition"]);

export const pin = pgTable(
  "pin",
  {
    id: id(),
    board: boardEnum().notNull(),
    authorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text().notNull(),
    body: text(),
    link: text(),
    imageUrl: text(),
    tag: text(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.board, t.createdAt)],
);

/**
 * A pin picked for a week (by a skip, coach or admin): the week's things to do, which players log and close
 * their hoop with. One row per pin per week, so every past week keeps its picks.
 */
export const pinPick = pgTable(
  "pin_pick",
  {
    pinId: text()
      .notNull()
      .references(() => pin.id, { onDelete: "cascade" }),
    /** The Perth Monday of the week. */
    weekOf: date().notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.pinId, t.weekOf] }), index().on(t.weekOf)],
);

/**
 * Someone did one of the week's picked pins (a run, a workout, a recipe), with optional numbers and a photo.
 * Everyone in the squad can see these. One per person, per pin, per week; logging again updates it.
 */
export const pinDone = pgTable(
  "pin_done",
  {
    id: id(),
    pinId: text()
      .notNull()
      .references(() => pin.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The Perth Monday of the week it counts for (the pin's pick week). */
    weekOf: date().notNull(),
    distanceM: integer(),
    durationS: integer(),
    note: text(),
    imageUrl: text(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex().on(t.pinId, t.userId, t.weekOf), index().on(t.weekOf)],
);

/** A "Nice one" on someone's log. One per person per log. */
export const pinCheer = pgTable(
  "pin_cheer",
  {
    doneId: text()
      .notNull()
      .references(() => pinDone.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.doneId, t.userId] })],
);

/** Drill catalog: every drill a coach or captain writes, reusable across sessions. */
export const drill = pgTable(
  "drill",
  {
    id: id(),
    authorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text().notNull(),
    howTo: text(),
    minutes: smallint(),
    focus: text(),
    link: text(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.title)],
);

/** The ordered drills planned for one training session. */
export const sessionDrill = pgTable(
  "session_drill",
  {
    eventId: text()
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    drillId: text()
      .notNull()
      .references(() => drill.id, { onDelete: "cascade" }),
    position: smallint().notNull(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.drillId] }), index().on(t.eventId, t.position)],
);

export const ladderRow = pgTable("ladder_row", {
  position: smallint().primaryKey(),
  team: text().notNull(),
  played: smallint().notNull().default(0),
  won: smallint().notNull().default(0),
  lost: smallint().notNull().default(0),
  drawn: smallint().notNull().default(0),
  pointsFor: integer().notNull().default(0),
  pointsAgainst: integer().notNull().default(0),
  percentage: real().notNull().default(0),
  premiershipPoints: smallint().notNull().default(0),
  updatedAt: updatedAt(),
});

/**
 * Every game in our grade between other clubs (our own games are events), so each team's page can show its
 * season round by round. Team names are as the ladder writes them. Points are null until the result is in.
 */
export const gradeGame = pgTable(
  "grade_game",
  {
    id: id(),
    round: text(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    home: text().notNull(),
    away: text().notNull(),
    homePoints: smallint(),
    awayPoints: smallint(),
    playhqGameId: text().unique(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.startsAt)],
);

export const appSetting = pgTable("app_setting", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------------ */
/* Relations (for the relational query API)                                  */
/* ------------------------------------------------------------------------ */

export const userRelations = relations(user, ({ one }) => ({
  profile: one(playerProfile, {
    fields: [user.id],
    references: [playerProfile.userId],
  }),
}));

export const noteRelations = relations(note, ({ one }) => ({
  author: one(user, { fields: [note.authorId], references: [user.id] }),
}));

export const pinRelations = relations(pin, ({ one }) => ({
  author: one(user, { fields: [pin.authorId], references: [user.id] }),
}));

export type Role = (typeof roleEnum.enumValues)[number];
export type Position = (typeof positionEnum.enumValues)[number];
export type EventKind = (typeof eventKindEnum.enumValues)[number];
export type AvailabilityStatus = (typeof availabilityEnum.enumValues)[number];
export type Board = (typeof boardEnum.enumValues)[number];
export type EventRow = typeof event.$inferSelect;
export type LadderRow = typeof ladderRow.$inferSelect;
export type GradeGame = typeof gradeGame.$inferSelect;
export type DrillRow = typeof drill.$inferSelect;
