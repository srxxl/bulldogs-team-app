/**
 * Local demo data. Refuses to run against a real database.
 * Dev accounts sign in with password "bulldogs-dev" (ENABLE_DEV_LOGIN=true).
 */
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { perthAt } from "@/lib/time";
import { TRAINING, upcomingTrainingSlots } from "@/lib/training";
import { createDb, isLocalDb } from "./client";
import * as t from "./schema";

if (!isLocalDb()) {
  console.error("Seed only runs against the local database (DATABASE_URL on localhost).");
  process.exit(1);
}

const PLAYERS: [string, number, t.Position, string?][] = [
  ["Coach Jess Marlow", 0, "utility", "coach@bulldogs.test"],
  ["Ash Tran", 7, "midfielder", "captain@bulldogs.test"],
  ["Mia Kowalski", 12, "forward", "admin@bulldogs.test"],
  ["Priya Nair", 3, "midfielder", "player@bulldogs.test"],
  ["Tayla Brooks", 21, "ruck"],
  ["Georgia Hale", 5, "defender"],
  ["Sophie Lam", 9, "forward"],
  ["Ellie Fraser", 14, "defender"],
  ["Jordan Reid", 17, "midfielder"],
  ["Hannah O'Neill", 2, "defender"],
  ["Kate Moretti", 11, "forward"],
  ["Leah Dube", 23, "utility"],
  ["Rosie Clarke", 30, "midfielder"],
  ["Nina Patel", 8, "defender"],
  ["Zoe Walker", 19, "forward"],
  ["Chloe Ng", 4, "midfielder"],
  ["Bec Harding", 25, "ruck"],
  ["Lucy Adams", 1, "defender"],
];

const OPPONENTS = [
  "Kingsway",
  "Bayswater",
  "Hills Rangers",
  "Mt Lawley",
  "Yanchep",
  "Carlisle",
  "Ballajura",
  "Kalamunda",
];

async function main() {
  const db = createDb();
  await db.execute(sql`truncate "user", event, ladder_row, app_setting, feedback cascade`);

  const password = await hashPassword("bulldogs-dev");
  const users = PLAYERS.map(([name, , , email], i) => ({
    id: crypto.randomUUID(),
    name,
    email: email ?? `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@bulldogs.test`,
    emailVerified: true,
    role: (i === 0 ? "coach" : i === 1 ? "captain" : "player") as t.Role,
    // Mia is a player who also runs the app; the coach isn't an admin.
    isAdmin: i === 2,
  }));
  users.push({
    id: crypto.randomUUID(),
    name: "Sam Newbie",
    email: "newbie@bulldogs.test",
    emailVerified: true,
    role: "pending",
    isAdmin: false,
  });
  await db.insert(t.user).values(users);
  await db.insert(t.account).values(
    users.map((u) => ({
      id: crypto.randomUUID(),
      accountId: u.id,
      providerId: "credential",
      userId: u.id,
      password,
    })),
  );
  await db.insert(t.playerProfile).values(
    PLAYERS.slice(1).map(([, guernsey, position], i) => ({
      userId: users[i + 1].id,
      guernsey,
      position,
      bio: i % 3 === 0 ? "First season back since uni. Here for the hard ball gets and the post-game pizza." : null,
      yearsPlaying: (i % 5) + 1,
      footyHero: i % 2 ? "Ebony Marinoff" : "Erin Phillips",
      preGameSong: i % 2 ? "Dancing On My Own, Robyn" : "Bad Romance, Lady Gaga",
    })),
  );

  // A season straddling "now": six games played, eight to come, Saturdays at 12:20.
  const now = new Date();
  const firstSat = new Date(now);
  firstSat.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 1) % 7) - 7 * 6);
  const games = OPPONENTS.concat(OPPONENTS.slice(0, 6)).map((opp, i) => {
    const startsAt = perthAt(new Date(firstSat.getTime() + i * 7 * 86400_000), 12, 20);
    const played = startsAt < now;
    const home = i % 2 === 0;
    return {
      kind: "game" as const,
      title: `vs ${opp}`,
      opponent: opp,
      round: `Round ${i + 1}`,
      isHome: home,
      startsAt,
      venueName: home ? "Karoonda Reserve, Oval 1" : `${opp} Oval`,
      venueAddress: home ? "Karoonda Reserve, Booragoon WA 6154" : `${opp} WA`,
      teamGoals: played ? 3 + ((i * 7) % 6) : null,
      teamBehinds: played ? 2 + ((i * 3) % 7) : null,
      oppGoals: played ? 2 + ((i * 5) % 6) : null,
      oppBehinds: played ? 1 + ((i * 4) % 5) : null,
    };
  });
  games.push({
    ...games[0],
    kind: "social" as never,
    title: "Mid-season quiz night",
    opponent: null as never,
    round: null as never,
    isHome: null as never,
    startsAt: perthAt(new Date(now.getTime() + 10 * 86400_000), 19),
    venueName: "Bulldogs clubrooms",
    teamGoals: null,
    teamBehinds: null,
    oppGoals: null,
    oppBehinds: null,
  });
  const inserted = await db.insert(t.event).values(games).returning({
    id: t.event.id,
    startsAt: t.event.startsAt,
    kind: t.event.kind,
  });

  const trainingIds = await db
    .insert(t.event)
    .values(
      upcomingTrainingSlots(now, 14).map((s) => ({
        kind: "training" as const,
        title: "Training",
        ...s,
        venueName: TRAINING.venueName,
        venueAddress: TRAINING.venueAddress,
      })),
    )
    .returning({ id: t.event.id, startsAt: t.event.startsAt });
  await db.insert(t.appSetting).values([
    { key: "training_enabled", value: true },
    {
      key: "season_start",
      value: games[0].startsAt.toISOString().slice(0, 10),
    },
  ]);

  // RSVPs for the next game, votes for the last one.
  const next = inserted.filter((e) => e.kind === "game" && e.startsAt > now)[0];
  const last = inserted.filter((e) => e.kind === "game" && e.startsAt < now).at(-1);
  const statuses = ["yes", "yes", "yes", "maybe", "no"] as const;
  if (next) {
    await db.insert(t.availability).values(
      users.slice(1, 15).map((u, i) => ({
        eventId: next.id,
        userId: u.id,
        status: statuses[i % statuses.length],
      })),
    );
  }
  if (last) {
    await db.insert(t.vote).values(
      users.slice(3, 9).flatMap((u, i) => [
        {
          eventId: last.id,
          voterId: u.id,
          nomineeId: users[1 + ((i + 1) % 2)].id,
          points: 3,
        },
        {
          eventId: last.id,
          voterId: u.id,
          nomineeId: users[10 + (i % 3)].id,
          points: 2,
        },
        {
          eventId: last.id,
          voterId: u.id,
          nomineeId: users[13 + (i % 3)].id,
          points: 1,
        },
      ]),
    );
  }

  await db.insert(t.note).values({
    authorId: users[0].id,
    title: "Win the contested ball",
    body: "Great effort on Saturday. This week at training we're working on clean hands at the stoppage and talking more in the back half.\n\nBring a water bottle and your mouthguard Tuesday. Thursday is match sim.",
    pinned: true,
  });
  await db.insert(t.pin).values([
    {
      board: "nutrition",
      authorId: users[2].id,
      title: "Overnight oats for game day",
      body: "½ cup oats, milk, Greek yoghurt, banana, honey. Make it Friday night, eat it 3 hours before the bounce.",
      tag: "Pre-game",
    },
    {
      board: "nutrition",
      authorId: users[4].id,
      title: "Hydration rule of thumb",
      body: "Pale yellow is the goal. Start drinking the day before, not the morning of.",
      tag: "Hydration",
    },
    {
      board: "nutrition",
      authorId: users[5].id,
      title: "Post-game recovery",
      body: "Protein + carbs within an hour. Chocolate milk counts.",
      tag: "Recovery",
      link: "https://www.ais.gov.au/nutrition",
    },
    {
      board: "fitness",
      authorId: users[0].id,
      title: "Pre-season running block",
      body: "Week 1: 3 × 1km at 5:30 pace, 2 min rest.\nWeek 2: 4 × 1km.\nWeek 3: 6 × 400m fast.",
      tag: "Running",
    },
    {
      board: "fitness",
      authorId: users[3].id,
      title: "Hip mobility, 10 minutes",
      body: "90/90 switches, couch stretch, glute bridges. Do it before every session.",
      tag: "Mobility",
    },
    {
      board: "fitness",
      authorId: users[6].id,
      title: "ACL prevention warm-up",
      link: "https://www.afl.com.au/prep-to-play",
      body: "The AFL's Prep to Play program. 15 minutes, cuts knee injuries a lot.",
      tag: "Injury prevention",
    },
  ]);
  const catalog = await db
    .insert(t.drill)
    .values([
      {
        authorId: users[0].id,
        title: "Dynamic warm-up",
        minutes: 10,
        focus: "Warm-up",
        howTo: "Jog laps, high knees, butt kicks, leg swings, then Prep to Play hops and landings.",
      },
      {
        authorId: users[0].id,
        title: "Kick to advantage",
        minutes: 15,
        focus: "Skills",
        howTo: "Pairs, 25m. Leading player calls a side, kicker has to hit that side. Swap after 10.",
      },
      {
        authorId: users[0].id,
        title: "Stoppage 3v3",
        minutes: 15,
        focus: "Contested",
        howTo: "Coach bounces. Ruck taps to a call, mids work on blocking and first possession.",
      },
      {
        authorId: users[1].id,
        title: "Handball circle",
        minutes: 10,
        focus: "Skills",
        howTo: "Circle of 8 with two balls. Call a name, handball, follow your ball to their spot.",
      },
      {
        authorId: users[0].id,
        title: "Kick-in to the wing",
        minutes: 15,
        focus: "Match sim",
        howTo: "Backs set up the kick-in; mids lead to the wing. Run it three times each side.",
      },
      {
        authorId: users[0].id,
        title: "Goal kicking from 30m",
        minutes: 10,
        focus: "Skills",
        howTo: "Two lines on the 30m arc, one each side. Three shots each, then rotate.",
        link: "https://www.afl.com.au/",
      },
    ])
    .returning({ id: t.drill.id });
  if (trainingIds[0]) {
    await db
      .insert(t.sessionDrill)
      .values([0, 1, 2, 5].map((n, position) => ({ eventId: trainingIds[0].id, drillId: catalog[n].id, position })));
  }
  await db.insert(t.feedback).values([
    {
      kind: "suggestion",
      body: "Could we do a bit more goal kicking at the end of Thursday sessions?",
    },
    {
      kind: "shoutout",
      body: "Huge shoutout to Tayla for the ruck work on the weekend. Every centre bounce!",
    },
  ]);
  await db.insert(t.ladderRow).values(
    [
      "Bayswater",
      "Brentwood Booragoon",
      "Kingsway",
      "Hills Rangers",
      "Mt Lawley",
      "Yanchep",
      "Carlisle",
      "Ballajura",
      "Kalamunda",
    ].map((team, i) => ({
      position: i + 1,
      team,
      played: 6,
      won: Math.max(0, 6 - i),
      lost: Math.min(6, i),
      pointsFor: 300 - i * 25,
      pointsAgainst: 120 + i * 25,
      percentage: Math.round(((300 - i * 25) / (120 + i * 25)) * 10000) / 100,
      premiershipPoints: Math.max(0, 6 - i) * 4,
    })),
  );

  console.log(`Seeded ${users.length} members, ${games.length} events. Dev password: bulldogs-dev`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
