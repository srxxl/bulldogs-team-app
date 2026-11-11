<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bulldogs — agent guide

Team app for the **Brentwood Booragoon Bulldogs Women's (C3 grade, Perth Football League)**.
Players sign in with Google or Microsoft; a coach approves them. Deployed on Vercel.
Read `PLAN.md` for the feature map and roadmap.

## Commands

| Task                                                   | Command                            |
| ------------------------------------------------------ | ---------------------------------- |
| Dev server + local database (PGlite on :54329) | `pnpm dev` |
| Apply migrations                                       | `pnpm db:migrate`                  |
| New migration after editing `schema.ts`                | `pnpm db:generate`                 |
| Seed local data (dev only)                             | `pnpm db:seed`                     |
| Type-check                                             | `pnpm typecheck`                   |
| Lint + format check                                    | `pnpm lint` (fix: `pnpm lint:fix`) |
| Unit tests                                             | `pnpm test`                        |
| Everything CI runs                                     | `pnpm check`                       |

Run `pnpm check` before calling any task done. Do not leave the tree with type errors or lint failures.

## Stack and why

- **Next.js 16 App Router**, server components by default, **server actions** for every mutation. No API routes except auth, cron and blob uploads.
- `cacheComponents` is **off on purpose**: every page is behind auth and per-user, so pages are dynamic. After a mutation call `revalidatePath` for the affected route(s).
- Request interception lives in `src/proxy.ts` (Next 16 renamed `middleware` → `proxy`). It only does an optimistic cookie check; **real authorisation happens in the DAL** (`src/server/auth/session.ts`). Never trust the proxy alone.
- **Better Auth** (`src/server/auth/index.ts`) with Google + Microsoft Entra ID. A dev-only email/password login exists when `ENABLE_DEV_LOGIN=true` and `NODE_ENV !== "production"`.
- **Drizzle ORM + Postgres** through the standard `pg` driver everywhere (`src/server/db/client.ts`). Production: Neon. Local: `pnpm dev` starts a PGlite socket server on port 54329 with data in `~/.cache/bbfc/pglite` (outside the repo: the dev server watches project files, and database writes inside the project trigger an endless recompile and reload loop), so every Next.js process shares one database. Never open PGlite in-process: Next 16 runs some routes in separate processes and two openers corrupt the data folder. `pnpm db:migrate` / `db:seed` work while `pnpm dev` is running; seed refuses any non-localhost URL. `src/server/db/index.ts` caches only the `pg` pool across hot reloads and rebuilds Drizzle each load, so schema changes apply without a restart.
  - `drizzle-kit generate` prompts (and fails here) when a change looks like a rename. Split it into separate drop and add steps, each generated on its own.
- **Tailwind v4** with tokens in `src/app/globals.css` (`@theme`). No component library.
  - Never use `backdrop-filter`/`backdrop-blur` (or `transform`/`filter`) on an ancestor of a dnd-kit board: it becomes the containing block for the fixed drag overlay and dragging lands in the wrong place.
  - Never put `<` or `>` in a CSS comment (e.g. `<Component />`). The Turbopack/Tailwind pipeline silently drops every rule after it, with no error.
- **dnd-kit** for the team board. **Vercel Blob** for uploads (falls back to `public/uploads` locally).
- **zod** validates every server action input and every external payload (PlayHQ).
- Time zone is always **Australia/Perth** (UTC+8, no DST). Store `timestamptz`, format with helpers in `src/lib/time.ts`. Never call `toLocaleString` ad hoc.

## Layout

```
src/
  app/
    (auth)/          login, pending-approval
    (app)/           everything behind auth; layout renders nav
    api/auth/[...all]  Better Auth handler
    api/cron/daily     training generation + PlayHQ sync (Vercel Cron)
  components/        presentational + client components (no data access)
  lib/               pure, framework-free helpers (time, positions, votes, ladder parsing). Unit-tested.
  server/
    auth/            Better Auth config + session/role guards
    db/              schema, client, migrate, seed
    queries/         read functions used by server components (one file per domain)
    actions/         "use server" mutations (one file per domain)
    playhq/          PlayHQ API client + mapping + sync
```

Rules of thumb:
- Server components call `src/server/queries/*`. Client components never import from `src/server` (enforced by `server-only`).
- Every action starts with a guard: `const me = await requireMember()` or `requireRole("coach")`. Then parse input with zod. Then write. Then `revalidatePath`.
- Actions return `ActionResult` (`src/lib/action-result.ts`) — never throw for user errors; throw only for bugs.
- Pure logic (vote rules, training dates, ladder/fixture parsing, PlayHQ mapping) lives in `src/lib` or `src/server/playhq/map.ts` with tests beside it (`*.test.ts`).
- Prefer `Promise.all` for independent queries in a page (no waterfalls).

## Domain rules (do not break)

- **Roles**: team role `pending` < `player` < `captain` < `coach`, plus a separate **`isAdmin` flag** for whoever runs the app (approvals, fixture and scores, PFL data, settings). Admin is deliberately not a rank above coach: the person running the app is usually a player, so admins do **not** see the vote tally (coach-only, `isCoach`), and the coach doesn't need to touch admin screens. Guards: `requireMember`, `requireRole`, `requireAdmin`. Training session plans (drills) and the team board can be edited by captains, coaches and admins (`canPlanSessions`, `canPickTeam`). Anyone in the squad can write a game note; skips and coaches get a red badge (`leaderBadge`).
- **"Skip" not "captain"**: the club calls captains skips. The role id stays `captain`; every label comes from `ROLE_LABEL` / `leaderBadge` in `src/lib/roles.ts`. People in `ADMIN_EMAILS` join as approved players with `isAdmin`; everyone else starts `pending`. Admins can't remove their own admin flag, so there's always one left.
- **Player's player votes**: 3-2-1 per game, only for players who said they were in for that game, can't vote for yourself, coaches don't vote, one ballot per voter per game.  Voting is open any time (no window). Tallies are visible to coaches/admins only.
- **Team size (PFL 2026 By-Laws, Laws of Australian Football 5.1)**: women play 18-a-side, 14–22 on the team sheet, so the interchange is 4 (not the AFLW's 16 + 5). The board also has 2 emergencies: club-named back-ups, not on the team sheet. Positions and their ground coordinates live in `src/lib/positions.ts` (followers sit around the centre square).
- **Fitness and nutrition ("close your hoop")**: `/boards` is two tiles (like a game's page) that each morph into their page: Fitness and Nutrition (showing a recipe of the day, `pickOfTheDay` in `src/lib/daily.ts`). Only **fitness** is tracked week to week. **Nutrition** (`/boards/nutrition`) is a recipe wall anyone can add to: never picked or logged. **Fitness** (`/boards/fitness`) is this week's activities. Skips, coaches and admins (`canPickPins`) add them the way drills go into a session: pick from the saved activities (every fitness `pin` ever written) or write a new one, which is saved for later weeks. A pick is a `pin_pick` row, one per pin per Perth Monday, so past weeks keep their picks. Players don't add fitness activities. Your hoop is a ring with a segment per pick, closed by logging them all ("I did it", `pin_done`: optional distance, time, note, photo; one per person per pin per week). Closing it brings up a celebration. Streaks are computed from logs in `src/lib/hoops.ts` (tested), never stored; there are no awards or badges; weeks with nothing picked don't break a streak. Under each activity on `/boards/fitness`, "x done" opens into a row per person who did it (number, name, distance/time/pace); a row with a note or photo opens again to show them. There are no cheers or reactions (the `pin_cheer` table is unused). Your weeks (your streak as a big outlined number, then a chip per week, red tick when complete, swiped month by month) sit at the foot of the Fitness page (`#weeks`; `/boards/history` redirects there); a past week's bar opens `/boards/team?week=` (the team feed for that week). **Only people who did something are ever shown**: nobody is listed for missing a week, there's no "x of 13", no leaderboard, and the day of the week something was done isn't shown.
- **Game day timeline**: every game page shows a left-to-right timeline from arriving (90 minutes before bounce) to bounce down. Steps are stored as minutes before bounce in `event.timeline` (null = `DEFAULT_TIMELINE` in `src/lib/timeline.ts`, tested), so they follow the game if its time changes. Skips, coaches and admins (`canPickTeam`) can change it per game or reset it.
- **The fixture is games only** (plus byes). No socials or club events: they can't be created (`saveEvent` takes `game` or `training`). Admins add a game by hand from Settings → PFL data when PlayHQ hasn't got it.
- **Won games** get soft blurred confetti behind the game page (`<Confetti variant="ambient" />`).
- **Training**: Tues + Thurs 18:00–19:30, Karoonda Reserve Oval 2 (West). Sessions are generated 14 days ahead by the daily cron while the `training_enabled` setting is on.
- **PlayHQ**: never scrape playhq.com — it blocks bots and we respect that. Data comes from the official public API (`PLAYHQ_API_KEY`, tenant `afl`) or a coach pasting a table copied from the PlayHQ site into Settings → PFL data. Synced events are matched by `playhqGameId`; manual edits to synced fields are overwritten on the next sync.

## Design system

Read `.claude/skills/frontend-design/SKILL.md` before UI work. The direction is **"footy record meets pin-board"** — bold, sporty, editorial; appeals to women without being girly. Avoid pastels-as-decoration, script fonts, hearts/sparkles.

Tokens (see `globals.css`):

| Token    | Hex       | Use                                                  |
| -------- | --------- | ---------------------------------------------------- |
| `navy`   | `#28357c` | Club navy (from crest). Primary surfaces, buttons    |
| `ink`    | `#151b45` | Body text, deep panels (never pure/near black)       |
| `red`    | `#d32427` | Club red. Hoop band, alerts, the one accent per view |
| `chalk`  | `#eef0f6` | Cool paper background (oval-line white, not cream)   |
| `powder` | `#c9d4ef` | Soft fills, chips, empty states                      |
- Type: **Big Shoulders** (display, numbers, headings) + **Hanken Grotesk** (body/UI). Sentence case everywhere; no tracked all-caps eyebrows, no `→` in buttons, no middle-dot meta strings, no monospace labels.
- Signature element: the **hoop band** (`<Hoop />`, red-white-red stripes from the crest). Use it once per screen at most.
- Guernsey numbers are huge outlined Big Shoulders numerals — the player card's hero.
- Pin boards (the nutrition recipes) use CSS-column masonry with mixed card heights.
- Radius hierarchy: panels `rounded-[28px]`, cards `rounded-2xl`, controls `rounded-xl`, chips `rounded-full`. No default grey drop shadows — use borders (`border-ink/10`) or the offset `shadow-stamp`.
- Mobile first: bottom tab bar < `md`, side rail ≥ `md`. 44px min touch targets, visible focus rings, `prefers-reduced-motion` respected.
- Copy: plain, active, sentence case. Buttons say what happens ("Save lineup", "I'm in"). Errors say what to do next.

## Skills in this repo

`.claude/skills/`: `frontend-design` (visual direction), `react-best-practices` + `composition-patterns` (Vercel React rules), `web-design-guidelines` (UI audit), `webapp-testing` (Playwright screenshots). Use them.

## Environment

See `.env.example`. Production needs: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET`, `ADMIN_EMAILS`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN`; optional `PLAYHQ_API_KEY`, `PLAYHQ_TEAM_ID`, `PLAYHQ_GRADE_ID`.
