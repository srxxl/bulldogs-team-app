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

export const roleEnum = pgEnum("role", ["pending", "player", "captain", "coach", "admin"]);

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  role: roleEnum().notNull().default("pending"),
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
    cancelled: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.startsAt), index().on(t.kind, t.startsAt), index().on(t.opponent)],
);

export const availabilityEnum = pgEnum("availability_status", ["yes", "maybe", "no"]);

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

export const note = pgTable(
  "note",
  {
    id: id(),
    authorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text().notNull(),
    body: text().notNull(),
    pinned: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.createdAt)],
);

export const boardEnum = pgEnum("board", ["fitness", "nutrition", "drills"]);

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

export const feedbackKindEnum = pgEnum("feedback_kind", ["reflection", "suggestion", "shoutout"]);

/**
 * Anonymous by design: no user reference and only a calendar date,
 * so rows can't be correlated with sessions or logs.
 */
export const feedback = pgTable("feedback", {
  id: id(),
  kind: feedbackKindEnum().notNull(),
  eventId: text().references(() => event.id, { onDelete: "set null" }),
  body: text().notNull(),
  submittedOn: date().notNull().defaultNow(),
  readByCoach: boolean().notNull().default(false),
});

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
export type FeedbackKind = (typeof feedbackKindEnum.enumValues)[number];
export type EventRow = typeof event.$inferSelect;
export type LadderRow = typeof ladderRow.$inferSelect;
