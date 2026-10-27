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
- **Drizzle ORM + Postgres** through the standard `pg` driver everywhere (`src/server/db/client.ts`). Production: Neon. Local: `pnpm dev` starts a PGlite socket server on port 54329 with data in `~/.cache/bbfc/pglite` (outside the repo: the dev server watches project files, and database writes inside the project trigger an endless recompile and reload loop), so every Next.js process shares one database. Never open PGlite in-process: Next 16 runs some routes in separate processes and two openers corrupt the data folder. `pnpm db:migrate` / `db:seed` work while `pnpm dev` is running; seed refuses any non-localhost URL.
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

- **Roles**: team role `pending` < `player` < `captain` < `coach`, plus a separate **`isAdmin` flag** for whoever runs the app (approvals, fixture and scores, PFL data, settings). Admin is deliberately not a rank above coach: the person running the app is usually a player, so admins do **not** see the vote tally or the anonymous inbox (coach-only, `isCoach`), and the coach doesn't need to touch admin screens. Guards: `requireMember`, `requireRole`, `requireAdmin`. Training session plans (drills) can be edited by captains, coaches and admins (`canPlanSessions`). People in `ADMIN_EMAILS` join as approved players with `isAdmin`; everyone else starts `pending`. Admins can't remove their own admin flag, so there's always one left.
- **Anonymous feedback is anonymous**: the `feedback` table has no user column and stores only a _date_ (not a timestamp) so entries can't be matched to logins. Do not add logging, user ids or precise timestamps to that path.
- **Player's player votes**: 3-2-1 per game, can't vote for yourself, one ballot per voter per game. Window opens 2h after bounce and closes 4 days later (`src/lib/votes.ts`). Tallies are visible to coaches/admins only.
- **Training**: Tues + Thurs 18:00–19:30, Karoonda Reserve Oval 2 (West). Sessions are generated 14 days ahead by the daily cron while the `training_enabled` setting is on.
- **PlayHQ**: never scrape playhq.com — it blocks bots and we respect that. Data comes from the official public API (`PLAYHQ_API_KEY`, tenant `afl`) or a coach pasting a table copied from the PlayHQ site into Admin → PFL data. Synced events are matched by `playhqGameId`; manual edits to synced fields are overwritten on the next sync.

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
- Pin boards (fitness, nutrition, drills) use CSS-column masonry with mixed card heights.
- Radius hierarchy: panels `rounded-[28px]`, cards `rounded-2xl`, controls `rounded-xl`, chips `rounded-full`. No default grey drop shadows — use borders (`border-ink/10`) or the offset `shadow-stamp`.
- Mobile first: bottom tab bar < `md`, side rail ≥ `md`. 44px min touch targets, visible focus rings, `prefers-reduced-motion` respected.
- Copy: plain, active, sentence case. Buttons say what happens ("Save lineup", "I'm in"). Errors say what to do next.

## Skills in this repo

`.claude/skills/`: `frontend-design` (visual direction), `react-best-practices` + `composition-patterns` (Vercel React rules), `web-design-guidelines` (UI audit), `webapp-testing` (Playwright screenshots). Use them.

## Environment

See `.env.example`. Production needs: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET`, `ADMIN_EMAILS`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN`; optional `PLAYHQ_API_KEY`, `PLAYHQ_TEAM_ID`, `PLAYHQ_GRADE_ID`.
