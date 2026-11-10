import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { BackButton } from "@/components/back-button";
import { Morph, morphName } from "@/components/morph";
import { SeasonRun } from "@/components/season-run";
import { SectionPanel } from "@/components/section-panel";
import { LadderPoints, Percentage, Scoring, WinLoss } from "@/components/team-charts";
import { CLUB, isUs } from "@/lib/club";
import { clubDesignSide, clubGuernsey, sameTeam, teamSlug, teamTheme } from "@/lib/club-colours";
import { cn } from "@/lib/cn";
import { headToHead, points, scoresOf } from "@/lib/score";
import { gamesRun, type RunGame, roundNumber, seasonRun } from "@/lib/season-run";
import { formatDay, formatTime, formatYear, seasonStart } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import type { GradeGame } from "@/server/db/schema";
import { getGradeGames, getLadder } from "@/server/queries/content";
import { getGames } from "@/server/queries/events";

async function findTeam(slug: string) {
  const rows = await getLadder();
  return { rows, row: rows.find((r) => teamSlug(r.team) === slug) ?? null };
}

export async function generateMetadata({ params }: PageProps<"/ladder/[team]">): Promise<Metadata> {
  const { row } = await findTeam((await params).team);
  return { title: row?.team ?? "Ladder" };
}

/** A team on the ladder, in its club colours: its numbers, and how we've gone against it. */
export default async function TeamPage({ params, searchParams }: PageProps<"/ladder/[team]">) {
  await requireMember();
  // opened from a game's opponent tile (?from=<game id>): the way back is to that game
  const from = (await searchParams).from;
  const fromGame = typeof from === "string" && /^[\w-]+$/.test(from) ? from : null;
  const [{ row, rows }, games, grade] = await Promise.all([findTeam((await params).team), getGames(), getGradeGames()]);
  if (!row) notFound();

  const us = isUs(row.team);
  const theme = teamTheme(row.team);
  const guernsey = clubGuernsey(row.team);
  const onLeft = clubDesignSide(row.team) === "left";
  const now = new Date();
  const against = us ? [] : games.filter((g) => g.opponent && !g.cancelled && sameTeam(g.opponent, row.team));
  const past = against.filter((g) => g.startsAt < now).reverse();
  const next = against.find((g) => g.startsAt >= now);
  const h2h = headToHead(past);
  const style = {
    "--team": theme.primary,
    "--on-team": theme.onPrimary,
    "--team-accent": theme.accent,
    "--team-title": theme.title,
    "--team-bar": theme.bar,
    "--team-badge": theme.badge,
    "--on-team-badge": theme.onBadge,
    "--team-numeral": theme.numeral,
  } as CSSProperties;

  const toRun = (g: (typeof games)[number]): RunGame => {
    const sc = scoresOf(g);
    return {
      id: g.id,
      href: `/fixture/${g.id}`,
      round: g.round,
      startsAt: g.startsAt,
      cancelled: g.cancelled,
      score: sc && { ours: points(sc.team), theirs: points(sc.opp) },
      opponent: g.opponent,
    };
  };
  const thisSeason = seasonStart(now);
  // this team's season round by round: our games as they are, theirs from the grade's results plus their
  // games against us (seen from their side), each round showing who they played
  const thisYear = games.filter((g) => g.startsAt >= thisSeason);
  const theirSide = (g: (typeof games)[number]): RunGame => {
    const run = toRun(g);
    return {
      ...run,
      score: run.score && { ours: run.score.theirs, theirs: run.score.ours },
      opponent: CLUB.ladderName,
    };
  };
  const fromGrade = (g: GradeGame): RunGame => {
    const home = sameTeam(g.home, row.team);
    const opponent = home ? g.away : g.home;
    const done = g.homePoints != null && g.awayPoints != null;
    return {
      id: g.id,
      href: `/ladder/${teamSlug(opponent)}`,
      round: g.round,
      startsAt: g.startsAt,
      cancelled: false,
      score: done
        ? {
            ours: (home ? g.homePoints : g.awayPoints) as number,
            theirs: (home ? g.awayPoints : g.homePoints) as number,
          }
        : null,
      opponent,
    };
  };
  const season = seasonRun(
    us
      ? thisYear.map(toRun)
      : [
          ...thisYear.filter((g) => g.opponent && sameTeam(g.opponent, row.team)).map(theirSide),
          ...grade
            .filter((g) => g.startsAt >= thisSeason && (sameTeam(g.home, row.team) || sameTeam(g.away, row.team)))
            .map(fromGrade),
        ],
    now,
  );
  // against one club the opponent is the same every game, so no guernsey per slot
  const againstRun = gamesRun(
    against.map((g) => ({ ...toRun(g), opponent: null })),
    (g) => (g.startsAt >= thisSeason ? `R${roundNumber(g.round) ?? ""}` : `'${formatYear(g.startsAt).slice(2)}`),
    now,
  );

  return (
    <div className="space-y-6" style={style}>
      {/* grows out of the team's ladder row when you open it, and back into it when you go back */}
      <Morph name={morphName.team(teamSlug(row.team))}>
        <header className="relative overflow-hidden rounded-[28px] bg-[var(--team)] text-[var(--on-team)]">
          {/* the club's guernsey design as wallpaper, fading in from behind the text, on whichever side keeps its
            emblem clear of the fade */}
          {guernsey && (
            <div
              aria-hidden
              className={cn("team-pattern absolute bg-cover bg-center", onLeft && "team-pattern-left")}
              style={{ backgroundImage: `url(${guernsey})` }}
            />
          )}
          {/* the way back: always the card's top-left corner, like on a game or a player, level with the grade line */}
          <BackButton
            href={fromGame ? `/fixture/${fromGame}` : "/ladder"}
            to={fromGame ? "the game" : "the ladder"}
            className={cn(
              "absolute top-5 left-5 z-10 md:top-12 md:left-8",
              // over the club's design (emblem on the left) it needs a solid fill to stand out
              onLeft && "bg-[var(--team)] ring-1 ring-current/25 hover:bg-[var(--team)] hover:ring-current/50",
            )}
          />
          <div className={cn("relative max-w-xl p-5 md:p-8 md:py-12", onLeft && "ml-auto text-right")}>
            {/* the grade, beside the back button (clear of it when the text starts on the left) */}
            <div className={cn("flex min-h-11 items-center", !onLeft && "pl-14")}>
              <p className={cn("text-sm font-semibold opacity-80", onLeft && "ml-auto")}>
                <abbr title={CLUB.league} className="no-underline">
                  {CLUB.leagueShort}
                </abbr>{" "}
                {CLUB.grade}
              </p>
            </div>
            <h1 className="mt-3 text-5xl leading-[0.9] font-extrabold md:text-7xl">{row.team}</h1>
            {/* the number sits on the outer edge: on the left normally, on the right when the text is */}
            <div className={cn("mt-4 flex items-end gap-3", onLeft && "flex-row-reverse")}>
              <span className="sr-only">Ladder position {row.position}</span>
              <span
                className="display-num num-outline text-7xl font-extrabold text-[var(--team-numeral)] md:text-8xl"
                aria-hidden
              >
                {row.position}
              </span>
              <p className="pb-1 text-sm leading-snug">
                <span className="block font-semibold" aria-hidden>
                  on the ladder
                </span>
                <span className="opacity-80">
                  {row.won} won, {row.lost} lost{row.drawn > 0 && `, ${row.drawn} drawn`}, {row.premiershipPoints}{" "}
                  points
                </span>
              </p>
            </div>
          </div>
        </header>
      </Morph>

      {season.length > 0 && (
        <SectionPanel title="Matches" titleClassName="text-[var(--team-title)]">
          <SeasonRun slots={season} winColour={us ? undefined : "var(--team-bar)"} />
        </SectionPanel>
      )}

      <div className={cn("grid gap-6", !us && "lg:grid-cols-[3fr_2fr]")}>
        <SectionPanel title="Performance" titleClassName="text-[var(--team-title)]">
          <div className="grid gap-7 sm:grid-cols-2">
            <WinLoss row={row} />
            <Percentage row={row} rows={rows} />
            <div className="sm:col-span-2">
              <LadderPoints row={row} rows={rows} />
            </div>
            <div className="sm:col-span-2">
              <Scoring row={row} rows={rows} />
            </div>
          </div>
          {!theme.known && (
            <p className="mt-4 text-sm text-ink/60">
              We don't have this club's colours yet, so it's shown in plain grey.
            </p>
          )}
        </SectionPanel>

        {!us && (
          <SectionPanel title="vs Bulldogs" titleClassName="text-[var(--team-title)]">
            {next && (
              <Link
                href={`/fixture/${next.id}`}
                className="mb-5 block overflow-hidden rounded-2xl bg-[var(--team)] p-4 text-[var(--on-team)] hover:opacity-90"
              >
                <span className="block text-sm font-semibold opacity-80">Coming up</span>
                <span className="mt-1 block font-display text-2xl font-bold">
                  {[next.round, formatDay(next.startsAt), formatTime(next.startsAt)].filter(Boolean).join(", ")}
                </span>
                {next.venueName && <span className="text-sm opacity-80">{next.venueName}</span>}
                {/* the club's other colours as hoops along the bottom */}
                {theme.colours.length > 1 && (
                  <span aria-hidden className="-mx-4 -mb-4 mt-4 block">
                    {theme.colours.slice(1).map((c) => (
                      <span key={c} className="block h-1.5" style={{ background: c }} />
                    ))}
                  </span>
                )}
              </Link>
            )}
            {h2h.played === 0 ? (
              <p className="text-ink/70">We haven't played them yet this season.</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink/80">Match history</p>
                <div className="mt-3">
                  <SeasonRun slots={againstRun} lossColour="var(--team-bar)" />
                </div>
              </>
            )}
          </SectionPanel>
        )}
      </div>
    </div>
  );
}
