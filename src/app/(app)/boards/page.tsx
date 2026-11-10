import { Apple, Check, Dumbbell } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BoardsNav } from "@/components/boards-nav";
import { HoopRing } from "@/components/hoop-ring";
import { Morph, morphName } from "@/components/morph";
import { DoneSheet } from "@/components/pin-actions";
import { TitleRow } from "@/components/ui";
import { BOARD_KEYS, BOARDS } from "@/lib/boards";
import { cn } from "@/lib/cn";
import { currentStreak, hoop } from "@/lib/hoops";
import { perthWeekStart } from "@/lib/time";
import { formatDistance, formatDuration, formatPace } from "@/lib/workout";
import { requireMember } from "@/server/auth/session";
import { getMyHoopWeeks, getPinCounts, getWeekDone, getWeekPicks } from "@/server/queries/content";

export const metadata: Metadata = { title: "Fitness" };

const ICON = { fitness: Dumbbell, nutrition: Apple } as const;
const HOOP_BAND =
  "bg-[repeating-linear-gradient(180deg,var(--color-red)_0_33%,#fff_33%_66%,var(--color-red)_66%_100%)] ring-2 ring-red";

/**
 * Your week: one line for your hoop and streak, then this week's picks as big workout cards (swipe through them
 * on a phone, side by side on a laptop), the ones still to do first. The two boards sit up in the header so
 * they're always a tap away.
 */
export default async function YourWeekPage() {
  const me = await requireMember();
  const week = perthWeekStart();
  const [picks, done, hoops, counts] = await Promise.all([
    getWeekPicks(week),
    getWeekDone(week),
    getMyHoopWeeks(me.id, week),
    getPinCounts(),
  ]);
  const mine = done.filter((d) => d.userId === me.id);
  const ring = hoop({ picks: picks.map((p) => ({ pinId: p.id, board: p.board })), mine });
  const streak = currentStreak(hoops.weeks, week);
  const logOf = (id: string) => mine.find((m) => m.pinId === id) ?? null;
  // the ones still to do first, then what you've done
  const ordered = [...picks.filter((p) => !logOf(p.id)), ...picks.filter((p) => logOf(p.id))];

  const headline =
    picks.length === 0 ? "Nothing picked yet" : ring.closed ? "Hoop closed" : `${ring.done} of ${ring.total} done`;
  const subline =
    picks.length === 0
      ? "The skips and coaches pick a few things each week."
      : ring.closed
        ? "Nice work. See what the team's been up to."
        : null;

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <TitleRow>Fitness</TitleRow>
        {/* the boards, always a tap away: side by side on a phone, beside the title on a laptop */}
        <div className="grid grid-cols-2 gap-2 md:flex">
          {BOARD_KEYS.map((key) => {
            const Icon = ICON[key];
            return (
              <Morph key={key} name={morphName.board(key)}>
                <Link
                  href={`/boards/${key}`}
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold md:px-4 md:text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
                    key === "fitness" ? "bg-navy text-white hover:bg-navy-deep" : "bg-white text-navy hover:bg-mist",
                  )}
                >
                  <Icon size={18} aria-hidden />
                  <span>
                    {BOARDS[key].title} board
                    <span
                      className={cn("ml-2 text-sm font-normal", key === "fitness" ? "text-white/70" : "text-ink/55")}
                    >
                      {counts[key]}
                    </span>
                  </span>
                </Link>
              </Morph>
            );
          })}
        </div>
      </header>
      <BoardsNav current="/boards" />

      <section
        aria-label="Your hoop this week"
        className="flex max-w-2xl items-center gap-4 rounded-2xl border border-ink/[0.06] bg-white p-3 pr-4"
      >
        <HoopRing total={ring.total} done={ring.done} size={56} tone="light" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-3xl leading-none font-black text-navy">{headline}</h2>
          {subline && <p className="mt-1 text-sm text-ink/60">{subline}</p>}
        </div>
        {streak > 0 && (
          <p className="flex shrink-0 items-center gap-2 text-sm font-semibold text-navy">
            <span className="grid size-8 place-items-center rounded-full bg-red font-display text-lg font-black text-white">
              {streak}
            </span>
            <span className="hidden sm:inline">{streak === 1 ? "week in a row" : "weeks in a row"}</span>
            <span className="sm:hidden">in a row</span>
          </p>
        )}
      </section>

      {picks.length > 0 && (
        // swipe sideways on a phone (each card snaps into place, the next one peeking in); a row of cards on a laptop
        <ul
          aria-label="This week's picks"
          className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3"
        >
          {ordered.map((p) => {
            const log = logOf(p.id);
            const pace = log?.distanceM != null && log.durationS != null && formatPace(log.distanceM, log.durationS);
            return (
              <li
                key={p.id}
                className={cn(
                  "relative flex min-h-80 w-[82%] shrink-0 snap-start flex-col rounded-[28px] p-5 md:w-auto",
                  log ? "border border-ink/[0.06] bg-white text-ink" : "bg-navy text-white",
                )}
              >
                {log && (
                  <span
                    aria-hidden
                    className={cn("absolute top-4 right-4 grid size-9 place-items-center rounded-full", HOOP_BAND)}
                  >
                    <Check size={16} strokeWidth={3.5} className="text-navy" />
                  </span>
                )}
                <h3 className={cn("pr-10 font-display text-4xl leading-[0.92] font-black", log && "text-navy")}>
                  <Link href={`/boards/${p.board}`} className="hover:underline">
                    {p.title}
                  </Link>
                </h3>

                {log ? (
                  <div className="mt-auto pt-6">
                    <p className="font-display text-6xl leading-[0.9] font-black text-navy">
                      {log.distanceM != null ? (
                        <>
                          {formatDistance(log.distanceM).replace(/ (km|m)$/, "")}
                          <span className="ml-1 text-2xl">
                            {formatDistance(log.distanceM).endsWith("km") ? "km" : "m"}
                          </span>
                        </>
                      ) : log.durationS != null ? (
                        formatDuration(log.durationS)
                      ) : (
                        "Done"
                      )}
                    </p>
                    {(log.distanceM != null && log.durationS != null) || log.note ? (
                      <p className="mt-1.5 text-sm text-ink/65">
                        {[log.distanceM != null && log.durationS != null && formatDuration(log.durationS), pace]
                          .filter(Boolean)
                          .join(", ")}
                        {log.note && <span className="block truncate text-ink/80">{log.note}</span>}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <DoneSheet
                        pinId={p.id}
                        title={p.title}
                        fitness={p.board === "fitness"}
                        mine={log}
                        dark={false}
                        triggerClassName="-ml-2 inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-semibold text-navy/75 hover:bg-mist hover:text-navy"
                        trigger="Change"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {p.body && (
                      <p className="mt-3 line-clamp-4 text-sm text-pretty whitespace-pre-line text-white/80">
                        {p.body}
                      </p>
                    )}
                    <div className="mt-auto pt-6">
                      <DoneSheet
                        pinId={p.id}
                        title={p.title}
                        fitness={p.board === "fitness"}
                        mine={null}
                        dark
                        triggerClassName="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-lg font-bold text-navy transition-colors hover:bg-mist"
                      />
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
