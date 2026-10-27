# Bulldogs

Team app for the Brentwood Booragoon Bulldogs women's side (PFL Women's C3).
Fixture, availability polls, training RSVPs, squad profiles, the drag-and-drop team board,
player's player votes, fitness and nutrition boards, coach's notes, the ladder and anonymous notes.

## Run it locally

```bash
pnpm install
cp .env.example .env.local      # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm dev                        # starts a local database (~/.cache/bbfc, no Postgres install needed) + http://localhost:3000
pnpm db:migrate                 # in a second terminal, while dev is running
pnpm db:seed                    # demo squad, fixture and content
```

With `ENABLE_DEV_LOGIN=true` the sign-in page shows a **Local dev login** box. Pick Coach, Captain,
Player, the admin (a player who runs the app) or a pending sign-up. Re-run `pnpm db:seed` any time to reset
the demo data.

`pnpm check` runs lint, types and tests.

## Deploy to Vercel

1. **Push this repo to GitHub** and import it at vercel.com/new. The framework is detected automatically.
2. **Database**: in the Vercel project go to Storage → Marketplace → **Neon** → Create. This sets `DATABASE_URL`.
   Migrations run on each deploy (`vercel-build`).
3. **Photo storage**: Storage → **Blob** → Create. This sets `BLOB_READ_WRITE_TOKEN`.
4. **Google sign-in**: Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web).
   - Authorised redirect URI: `https://<your-domain>/api/auth/callback/google`
   - Copy the ID and secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. **Microsoft sign-in**: entra.microsoft.com → App registrations → New registration.
   - Supported account types: *Any organizational directory and personal Microsoft accounts*.
   - Redirect URI (Web): `https://<your-domain>/api/auth/callback/microsoft`
   - Certificates & secrets → New client secret. Set `MICROSOFT_CLIENT_ID` (Application ID) and `MICROSOFT_CLIENT_SECRET`.
6. **Other env vars** (Settings → Environment Variables):
   - `BETTER_AUTH_SECRET`: `openssl rand -base64 32`
   - `BETTER_AUTH_URL`: `https://<your-domain>`
   - `ADMIN_EMAILS`: your email (comma-separate several). These people run the app: they join as approved
     players with admin access. The coach doesn't need to be an admin; give them the Coach role instead.
   - `CRON_SECRET`: any long random string (secures the daily sync).
7. Redeploy, sign in with your admin email, then in **Admin**:
   - Switch on training polls when pre-season starts.
   - Approve players as they sign up, set captains and coaches, and tick Admin for anyone else who helps run the app.
     Admins don't see the player's player tally or the anonymous notes; those are for coaches only.

## PlayHQ (fixture + ladder)

The PFL publishes fixtures and ladders on PlayHQ. The app reads them through PlayHQ's **official public API**.
It never scrapes playhq.com.

1. Ask the club's PlayHQ administrator to request a public API key (Client ID) from PlayHQ support for
   the Brentwood Booragoon organisation, tenant `afl`.
2. Find the team and grade IDs in the playhq.com URLs for the C3 Women team and grade.
3. Set `PLAYHQ_API_KEY`, `PLAYHQ_TEAM_ID` and `PLAYHQ_GRADE_ID` in Vercel. The daily cron (6am Perth) syncs
   games and the ladder, and Admin → **Sync now** runs it on demand.
4. After the first sync, check the games and ladder look right. The field mapping in
   `src/server/playhq/map.ts` is written against PlayHQ's documented shape but hasn't been checked against a live response.

Until then, coaches add games in **Admin → Add event** and update the ladder by copying the table from
playhq.com and pasting it into **Admin → PFL data**.

## For contributors and agents

Read `AGENTS.md` (conventions, architecture, design system) and `PLAN.md` (features and roadmap).
