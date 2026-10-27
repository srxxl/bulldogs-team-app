# Bulldogs app — plan

Team hub for the Brentwood Booragoon Bulldogs Women's C3 side (Perth Football League).

## Research notes (Oct 2026)

- Club colours from brentwoodbooragoonfc.com: navy `#28357c`, red `#d32427`, white. Crest saved at `public/brand/crest.png`.
- Women train Tues + Thurs 18:00–19:30 at Karoonda Reserve, Oval 2 (West), Booragoon.
- PFL fixtures/ladders live on **PlayHQ** (tenant `afl`). playhq.com blocks automated access, so we do **not** scrape. Options:
  1. **Official public API** — club admin requests an API Client ID from PlayHQ support (reviewed by PlayHQ + PFL). Endpoints used: `GET /v1/teams/:teamId/fixture`, `GET /v1/grades/:gradeId/ladder` with headers `x-api-key`, `x-phq-tenant: afl`. Response shapes are validated loosely with zod; confirm field names against a real response once a key exists (`src/server/playhq/map.ts`).
  2. **Paste import** — a coach copies the ladder table from the PlayHQ page in their browser and pastes it into Admin → PFL data.
  3. Manual event entry (always available).
- 2026 season started 11 April and is finished; the app targets the 2027 season.

## Features → where they live

| Feature                                            | Route                                  | Notes                                                     |
| -------------------------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| Sign in (Google / Microsoft) + approval            | `/login`, `/pending`, `/admin`         | Better Auth; coach approves new members and sets roles    |
| Home: mascot, next game, my RSVPs, coach note, vote prompt, ladder widget | `/` | Bulldog mascot greets by name; ladder expands in place |
| Squad by position, numbers, about me               | `/squad`, `/squad/[id]`, `/me`         | Players edit their own profile + photo                    |
| Season fixture (list or calendar) | `/fixture`, `/fixture?view=calendar`, `/fixture/[id]` | Venue, time, opponent, head-to-head + opponent ladder row |
| Game availability poll | `/fixture/[id]` | In / can't (no maybe) |
| Training polls (Tue/Thu 6pm) | `/training` | Each session is one card: RSVP, who's coming, drills |
| Coach / captain notes | `/fixture/[id]` (per game) | Latest note for the next game shows on home |
| Training drills | `/training` (on each session card) | Per-session plan from a reusable drill catalog; captains, coaches, admins edit |
| Fitness + nutrition boards                         | `/boards/fitness`, `/boards/nutrition` | Pinterest-style pins, anyone adds                         |
| Team board (drag & drop lineup: 18 on the ground, 4 interchange, 2 emergencies) | `/fixture/[id]` (games) | Captains/coaches edit; auto-fill from RSVPs; everyone views |
| Player's player votes (3-2-1) | `/fixture/[id]` (per game), `/votes` (season) | Players vote on the game page; coaches see that game's results and the season tally |
| Live ladder | `/` (widget) | From PlayHQ sync or paste |
| Anonymous reflections / suggestions                | `/feedback`                            | No user id stored; coaches read                           |
| Admin                                              | `/admin`                               | Members, events, PFL data, settings                       |

## Data model (Drizzle, `src/server/db/schema.ts`)

`user/session/account/verification` (Better Auth, `user.role`, `user.isAdmin`) · `player_profile` · `event` · `availability` (yes/no) · `vote` · `lineup_slot` · `note` (per game) · `pin` (board = fitness | nutrition) · `drill` + `session_drill` · `feedback` · `ladder_row` · `app_setting`.

## Phases

1. ✅ Research, plan, AGENTS.md, skills, scaffold.
2. ✅ Schema, auth, layout + design system, all feature pages, server actions, tests.
3. ⏳ Owner setup: Neon DB, Google + Microsoft OAuth apps, Vercel project + env vars, first deploy (see README).
4. ⏳ PlayHQ API key → set env vars → verify mapping against a real response.
5. Later: push notifications for polls (web push), season awards page, photo gallery.
