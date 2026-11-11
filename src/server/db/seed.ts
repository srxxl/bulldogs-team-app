/**
 * Local demo data. Refuses to run against a real database.
 * Dev accounts sign in with password "bulldogs-dev" (ENABLE_DEV_LOGIN=true).
 */
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { CLUB, isUs } from "@/lib/club";
import { sameTeam } from "@/lib/club-colours";
import { CLUB_COLOURS } from "@/lib/club-colours.data";
import { autoFill } from "@/lib/positions";
import { perthAt, perthWeekday, perthWeekStart } from "@/lib/time";
import { TRAINING, upcomingTrainingSlots } from "@/lib/training";
import { createDb, isLocalDb } from "./client";
import * as t from "./schema";

if (!isLocalDb()) {
  console.error("Seed only runs against the local database (DATABASE_URL on localhost).");
  process.exit(1);
}

const PLAYERS: [string, number, t.Position, string?][] = [
  ["Jess Marlow", 0, "utility", "coach@bulldogs.test"],
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
  ["Amy Sutherland", 15, "forward"],
  ["Tash Kerr", 6, "midfielder"],
  ["Maddie Cole", 10, "defender"],
  ["Jas Singh", 13, "utility"],
  ["Imogen Price", 16, "forward"],
  ["Freya Lowe", 18, "defender"],
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
  await db.execute(sql`truncate "user", event, ladder_row, grade_game, app_setting cascade`);

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

  // A season straddling "now": six games played, eight to come, Saturdays at 12:20, with a bye in round 9.
  const now = new Date();
  // The Saturday six weeks back, on the Perth calendar (UTC can be a day out).
  const firstSat = perthAt(now, 12);
  firstSat.setTime(firstSat.getTime() - (((perthWeekday(now) + 1) % 7) + 7 * 6) * 86400_000);
  const games = OPPONENTS.concat(OPPONENTS.slice(0, 6)).map((opp, i) => {
    const week = i < 8 ? i : i + 1;
    const startsAt = perthAt(new Date(firstSat.getTime() + week * 7 * 86400_000), 12, 20);
    const played = startsAt < now;
    const home = i % 2 === 0;
    return {
      kind: "game" as const,
      title: `vs ${opp}`,
      opponent: opp,
      round: `Round ${week + 1}`,
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
  // Past seasons against every club on the ladder (built below), so each team's page has a head-to-head:
  // one or two games each in 2024 and 2025, with a spread of wins, losses and the odd draw.
  const history = [...new Set([...OPPONENTS, ...Object.keys(CLUB_COLOURS)])]
    .filter((team) => !isUs(team) && !OPPONENTS.some((o) => o !== team && sameTeam(o, team)))
    .flatMap((opp, i) =>
      [2025, 2024].slice(0, 1 + (i % 2)).map((year, j) => {
        const round = 1 + ((i * 3 + j * 5) % 18);
        const startsAt = perthAt(new Date(Date.UTC(year, 3, 12 + round * 7)), 12, 20);
        const home = (i + j) % 2 === 0;
        const n = i * 7 + j * 11;
        const teamGoals = 2 + (n % 8);
        const oppGoals = n % 13 === 0 ? teamGoals : 1 + ((n * 5) % 9);
        const [teamBehinds, oppBehinds] = n % 13 === 0 ? [4, 4] : [1 + ((n * 3) % 9), 2 + ((n * 2) % 7)];
        return {
          kind: "game" as const,
          title: `vs ${opp}`,
          opponent: opp,
          round: `Round ${round}`,
          isHome: home,
          startsAt,
          venueName: home ? "Karoonda Reserve, Oval 1" : `${opp} Oval`,
          venueAddress: home ? "Karoonda Reserve, Booragoon WA 6154" : `${opp} WA`,
          teamGoals,
          teamBehinds,
          oppGoals,
          oppBehinds,
        };
      }),
    );
  await db.insert(t.event).values(history);
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

  // RSVPs and a picked team for every game played and the next two to come, so every game page has people on
  // it. A couple of different players can't make each one. Votes for the last game played.
  const gameRows = inserted
    .filter((e) => e.kind === "game")
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const next = gameRows.find((e) => e.startsAt > now);
  const last = gameRows.filter((e) => e.startsAt < now).at(-1);
  const players = users.slice(1, PLAYERS.length);
  const covered = gameRows.filter((e) => e.startsAt < now).concat(gameRows.filter((e) => e.startsAt > now).slice(0, 2));
  for (const [g, game] of covered.entries()) {
    // last game: the voting below only goes to players who were in
    const out = game === last ? [7, 15] : [(g * 3) % players.length, (g * 3 + 8) % players.length];
    const rsvps = players.map((u, i) => ({
      eventId: game.id,
      userId: u.id,
      status: out.includes(i) ? ("no" as const) : ("yes" as const),
    }));
    await db.insert(t.availability).values(rsvps);
    // the game after next hasn't been picked yet
    if (game.startsAt > now && game !== next) continue;
    const lineup = autoFill(
      {},
      players.map((u, i) => ({
        id: u.id,
        position: PLAYERS[i + 1][2],
        secondaryPosition: null,
        available: rsvps[i].status === "yes",
      })),
    );
    await db
      .insert(t.lineupSlot)
      .values(Object.entries(lineup).map(([slot, userId]) => ({ eventId: game.id, slot, userId })));
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

  if (last) {
    await db.insert(t.note).values([
      {
        authorId: users[0].id,
        eventId: last.id,
        title: "What a second half",
        body: "Down at the main break and we kept running. Proud of every one of you. Recovery session Tuesday.",
        createdAt: new Date(last.startsAt.getTime() + 3 * 3600_000),
      },
      {
        authorId: users[4].id,
        eventId: last.id,
        title: "Pizza at the clubrooms",
        body: "Order's in for 4pm. Bring your own drinks.",
        createdAt: new Date(last.startsAt.getTime() + 2 * 3600_000),
      },
    ]);
  }
  if (next) {
    await db.insert(t.note).values([
      {
        authorId: users[1].id,
        eventId: next.id,
        title: "Bring the noise",
        body: "Away game, so let's be loud from the first bounce. Warm-up starts 45 minutes before.",
        createdAt: new Date(now.getTime() - 3600_000),
      },
      {
        authorId: users[0].id,
        eventId: next.id,
        title: "Win the contested ball",
        body: "Great effort on Saturday. This week we're working on clean hands at the stoppage and talking more in the back half.\n\nMouthguards in, and be there by 11:30.",
      },
    ]);
  }
  await seedFitnessAndRecipes(db, users, now);
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
  // Training RSVPs: the next sessions fill up like real weeks (busy, busy, quieter), a few can't make it,
  // and some players haven't answered yet. Skips the coach (users[0]) and the pending sign-up.
  const squad = users.slice(1, -1);
  const turnout = [0.75, 0.6, 0.4];
  const trainingRsvps: (typeof t.availability.$inferInsert)[] = [];
  trainingIds.slice(0, turnout.length).forEach((session, n) => {
    squad.forEach((u, i) => {
      const roll = ((i * 37 + n * 11) % 100) / 100;
      if (roll < turnout[n]) trainingRsvps.push({ eventId: session.id, userId: u.id, status: "yes" });
      else if (roll < turnout[n] + 0.12) trainingRsvps.push({ eventId: session.id, userId: u.id, status: "no" });
    });
  });
  if (trainingRsvps.length) await db.insert(t.availability).values(trainingRsvps);
  // Every PFL club (far more than a real grade) so each club's colours and guernsey can be checked, plus
  // the made-up opponents above. We sit second.
  const others = [...new Set([...OPPONENTS, ...Object.keys(CLUB_COLOURS)])].filter(
    (team) => !isUs(team) && !OPPONENTS.some((o) => o !== team && sameTeam(o, team)),
  );
  const ladder = [others[0], CLUB.ladderName, ...others.slice(1)];
  await db.insert(t.ladderRow).values(
    ladder.map((team, i) => {
      const won = Math.max(0, 6 - Math.floor((i * 7) / ladder.length));
      const pointsFor = 320 - i * 3;
      const pointsAgainst = 110 + i * 4;
      return {
        position: i + 1,
        team,
        played: 6,
        won,
        lost: 6 - won,
        pointsFor,
        pointsAgainst,
        percentage: Math.round((pointsFor / pointsAgainst) * 10000) / 100,
        premiershipPoints: won * 4,
      };
    }),
  );

  // The rest of the grade's games, round by round on our game days: everyone but our opponent that round
  // paired up (rotating, so each round has new matchups; an odd one out has a bye). Made-up scores once played.
  const gradeGames = games
    .filter((g) => g.kind === "game" && g.round)
    .flatMap((g, r) => {
      const pool = others.filter((team) => !sameTeam(team, g.opponent as string));
      const [first, ...rest] = pool;
      const turned = [first, ...rest.slice(r % rest.length), ...rest.slice(0, r % rest.length)];
      const half = Math.floor(turned.length / 2);
      const played = g.startsAt < now;
      return Array.from({ length: half }, (_, k) => {
        const [home, away] =
          k % 2 === r % 2 ? [turned[k], turned[turned.length - 1 - k]] : [turned[turned.length - 1 - k], turned[k]];
        const n = (r + 3) * 31 + k * 17;
        return {
          round: g.round,
          startsAt: g.startsAt,
          home,
          away,
          homePoints: played ? 12 + ((n * 7) % 50) : null,
          awayPoints: played ? 10 + ((n * 11) % 48) : null,
        };
      });
    });
  await db.insert(t.gradeGame).values(gradeGames);

  console.log(`Seeded ${users.length} members, ${games.length} events. Dev password: bulldogs-dev`);
  process.exit(0);
}

/* Fitness and nutrition ---------------------------------------------------- */

const RECIPES: { title: string; body: string; tag: string; link?: string }[] = [
  {
    title: "Overnight oats for game day",
    body: "½ cup oats, milk, Greek yoghurt, banana, honey. Make it Friday night, eat it 3 hours before the bounce.",
    tag: "Pre-game",
  },
  {
    title: "Chicken and sweet potato traybake",
    body: "Chicken thighs, sweet potato, red onion, capsicum. Olive oil, paprika, salt. 200°C for 35 minutes. Makes four lunches.",
    tag: "Dinner",
  },
  {
    title: "Recovery smoothie",
    body: "Frozen banana, a handful of berries, scoop of Greek yoghurt, milk, a spoon of peanut butter. Within an hour of the siren.",
    tag: "Recovery",
  },
  {
    title: "Hydration rule of thumb",
    body: "Pale yellow is the goal. Start drinking the day before, not the morning of.",
    tag: "Pre-game",
  },
  {
    title: "Banana bread (the less sugary one)",
    body: "3 ripe bananas, 2 eggs, 1½ cups wholemeal flour, ⅓ cup honey, 1 tsp bicarb, cinnamon. 180°C for 50 minutes. Slice and freeze.",
    tag: "Snack",
  },
  {
    title: "Post-game recovery",
    body: "Protein + carbs within an hour. Chocolate milk counts.",
    tag: "Recovery",
    link: "https://www.ais.gov.au/nutrition",
  },
  {
    title: "Big pasta night",
    body: "Wholemeal penne, beef mince bolognese with grated carrot and zucchini hidden in. Friday night before a game.",
    tag: "Dinner",
  },
  {
    title: "Egg and avo toast",
    body: "Two eggs any way, half an avo, sourdough, chilli flakes, lemon. Breakfast on training days.",
    tag: "Breakfast",
  },
  {
    title: "Bliss balls",
    body: "1 cup dates, ½ cup oats, ¼ cup cocoa, 2 tbsp peanut butter, coconut to roll. Blitz, roll, fridge. Good at half time.",
    tag: "Snack",
  },
  {
    title: "Tuna rice bowl",
    body: "Microwave rice, a tin of tuna, edamame, cucumber, soy and sesame. Five minutes after training.",
    tag: "Recovery",
  },
  {
    title: "Game morning pancakes",
    body: "1 banana, 2 eggs, ½ cup oats, blended. Small pancakes, maple syrup and berries. 3 hours before the bounce.",
    tag: "Pre-game",
  },
  {
    title: "Lentil and veg soup",
    body: "Red lentils, carrot, celery, onion, tinned tomatoes, stock, cumin. 30 minutes on the stove, freezes for weeks.",
    tag: "Dinner",
  },
];

/**
 * "run": logged with distance and time, around `km`. "timed": time only, around `minutes`. "plain": just done.
 */
const ACTIVITIES: {
  title: string;
  body: string;
  tag: string;
  kind: "run" | "timed" | "plain";
  km?: number;
  minutes?: number;
  link?: string;
}[] = [
  {
    title: "5 km easy run",
    body: "Conversational pace. If you can't talk, slow down.",
    tag: "Running",
    kind: "run",
    km: 5,
  },
  {
    title: "Pre-season running block",
    body: "Week 1: 3 × 1km at 5:30 pace, 2 min rest.\nWeek 2: 4 × 1km.\nWeek 3: 6 × 400m fast.",
    tag: "Running",
    kind: "run",
    km: 5.5,
  },
  {
    title: "Hip mobility, 10 minutes",
    body: "90/90 switches, couch stretch, glute bridges. Do it before every session.",
    tag: "Mobility",
    kind: "timed",
    minutes: 10,
  },
  {
    title: "ACL prevention warm-up",
    body: "The AFL's Prep to Play program. 15 minutes, cuts knee injuries a lot.",
    tag: "Injury prevention",
    kind: "plain",
    link: "https://www.afl.com.au/prep-to-play",
  },
  {
    title: "Lower body strength",
    body: "3 × 8 goblet squats, 3 × 8 Romanian deadlifts, 3 × 10 walking lunges each leg, 3 × 12 calf raises.",
    tag: "Strength",
    kind: "timed",
    minutes: 35,
  },
  {
    title: "Core circuit",
    body: "3 rounds: 30s plank, 30s side plank each side, 12 dead bugs, 10 Copenhagen planks each side.",
    tag: "Strength",
    kind: "timed",
    minutes: 15,
  },
  {
    title: "Hill sprints",
    body: "Find a hill. 8 × 20 second sprints up, walk back down. Full effort.",
    tag: "Running",
    kind: "run",
    km: 2.5,
  },
  {
    title: "Recovery walk or swim",
    body: "30 minutes, easy. The day after a game.",
    tag: "Recovery",
    kind: "timed",
    minutes: 30,
  },
  {
    title: "Kicking practice, both feet",
    body: "50 kicks, 25 on each foot, at a target. Grab a mate or a wall.",
    tag: "Skills",
    kind: "plain",
  },
  {
    title: "Foam roll and stretch",
    body: "Quads, hamstrings, calves, glutes, upper back. A minute on each.",
    tag: "Recovery",
    kind: "timed",
    minutes: 12,
  },
];

const NOTES = [
  "Legs are cooked",
  "Did it with Tayla, much easier with company",
  "Felt great",
  "Hills are evil",
  "Before work, sunrise was worth it",
  "Knee feels better already",
  "Slow but done",
  "PB!",
  "Rain didn't stop me",
  "Back on it after a week off",
];

// How keen each player is (out of 100), by squad position. Ash (the skip) and Mia never miss.
/**
 * Mia (admin@bulldogs.test), the account you sign in with: how much of each week she did, this week first
 * (index 0) and going back 20 weeks. A streak of two now, a best of four, and plenty of weeks not finished (part
 * done or nothing at all), so "Your weeks" has something to show. Byes (weeks 5 and 13) have nothing picked.
 */
const MIA = [0.5, 1, 1, 0, 0.67, 0, 1, 0.33, 1, 1, 1, 1, 0, 0, 0.5, 0, 1, 0.67, 0.33, 1];
const BYES = [5, 13];

const KEEN = [100, 100, 80, 70, 55, 85, 35, 60, 45, 75, 25, 65, 50, 40, 90, 30, 55, 20, 70, 45, 60, 35, 50];

/**
 * Recipes, saved fitness activities, and twenty weeks of picks with the squad's logs, so your
 * hoop, streaks, the team's week and history all have something in them. One week has nothing picked (a bye).
 */
async function seedFitnessAndRecipes(db: ReturnType<typeof createDb>, users: { id: string }[], now: Date) {
  const squad = users.slice(1, -1); // not the coach, not the pending sign-up
  // a steady made-up "random": the same numbers every seed
  const roll = (...n: number[]) => n.reduce((a, b) => (a * 31 + b * 17 + 7) % 1009, 13) % 100;
  const DAY = 86_400_000;

  await db.insert(t.pin).values(
    RECIPES.map((r, i) => ({
      board: "nutrition" as const,
      authorId: squad[(i * 5) % squad.length].id,
      ...r,
      createdAt: new Date(now.getTime() - (RECIPES.length - i) * 3 * DAY),
    })),
  );
  const activities = await db
    .insert(t.pin)
    .values(
      ACTIVITIES.map(({ kind: _, km: __, minutes: ___, ...a }, i) => ({
        board: "fitness" as const,
        authorId: i % 3 === 0 ? users[0].id : squad[0].id,
        ...a,
        createdAt: new Date(now.getTime() - 150 * DAY + i * DAY),
      })),
    )
    .returning({ id: t.pin.id });

  const picks: (typeof t.pinPick.$inferInsert)[] = [];
  const done: (typeof t.pinDone.$inferInsert)[] = [];
  for (let w = MIA.length - 1; w >= 0; w--) {
    if (BYES.includes(w)) continue; // bye weeks: nothing picked, doesn't break a streak
    const monday = new Date(now.getTime() - w * 7 * DAY);
    const weekOf = perthWeekStart(monday);
    const weekStart = new Date(`${weekOf}T07:00:00+08:00`);
    // three a week (four in a couple of weeks), always with a run in it
    const count = w % 3 === 1 ? 4 : 3;
    const chosen = [...new Set([[0, 1, 6][w % 3], (w * 3 + 2) % 10, (w * 7 + 4) % 10, (w * 5 + 3) % 10])]
      .filter((n) => ![0, 1, 6].includes(n) || n === [0, 1, 6][w % 3])
      .slice(0, count);
    for (const n of chosen) picks.push({ pinId: activities[n].id, weekOf, createdAt: weekStart });

    squad.forEach((u, i) => {
      chosen.forEach((n, k) => {
        // this week has only just started, so fewer logs so far
        const keen = w === 0 ? KEEN[i] * 0.4 : KEEN[i];
        let does = roll(i, w, k) < keen;
        if (i === 0) does = w > 0 || k === 0; // Ash: a run of closed weeks, one done this week
        if (i === 1) does = k < Math.round(MIA[w] * chosen.length); // Mia: see MIA
        if (!does) return;
        const when = new Date(
          Math.min(now.getTime() - 3_600_000, weekStart.getTime() + (roll(i, k, w) % 6) * DAY + 11 * 3_600_000),
        );
        const { kind, km = 5, minutes = 15 } = ACTIVITIES[n];
        // a bit either side of the usual: most run the 5 km as 5 to 5.6 km, the 10 minutes takes 10 to 14
        const distanceM = kind === "run" ? Math.round(km * 1000 + (roll(w, i, k) % 13) * 50) : null;
        const pace = 290 + roll(k, i, w) * 1.1; // seconds per km
        const durationS =
          kind === "run" && distanceM
            ? Math.round((distanceM / 1000) * pace)
            : kind === "timed"
              ? minutes * 60 + (roll(i, k) % 9) * 30
              : null;
        done.push({
          pinId: activities[n].id,
          userId: u.id,
          weekOf,
          distanceM,
          durationS,
          note: roll(i, w, k, 3) < 30 ? NOTES[roll(i, k, w, 1) % NOTES.length] : null,
          createdAt: when,
        });
      });
    });
  }
  await db.insert(t.pinPick).values(picks);
  await db.insert(t.pinDone).values(done);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
