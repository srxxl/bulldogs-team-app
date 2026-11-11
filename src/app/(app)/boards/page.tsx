import { Check } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { GameTile } from "@/components/game-tile";
import { HoopRing } from "@/components/hoop-ring";
import { morphName } from "@/components/morph";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { pickOfTheDay } from "@/lib/daily";
import { currentStreak, hoop } from "@/lib/hoops";
import { perthToday, perthWeekStart } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getMyHoopWeeks, getPins, getWeekDone, getWeekPicks } from "@/server/queries/content";

export const metadata: Metadata = { title: "Fitness" };

/**
 * Fitness and nutrition as tiles, like a game's page: your hoop and this week's activities, and the recipe of the
 * day. Each tile grows into its own page.
 */
export default async function BoardsPage() {
  const me = await requireMember();
  const week = perthWeekStart();
  const [picks, done, hoops, recipes] = await Promise.all([
    getWeekPicks(week),
    getWeekDone(week),
    getMyHoopWeeks(me.id, week),
    getPins("nutrition"),
  ]);
  const mine = new Set(done.filter((d) => d.userId === me.id).map((d) => d.pinId));
  const ring = hoop({
    picks: picks.map((p) => ({ pinId: p.id, board: p.board })),
    mine: done.filter((d) => d.userId === me.id),
  });
  const streak = currentStreak(hoops.weeks, week);
  // still to do first
  const ordered = [...picks.filter((p) => !mine.has(p.id)), ...picks.filter((p) => mine.has(p.id))];

  const today = pickOfTheDay(recipes, perthToday());

  return (
    <>
      <PageHeader title="Fitness" />
      {/* a phone: fitness above nutrition. Wider: side by side */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <GameTile
          href="/boards/fitness"
          name={morphName.board("fitness")}
          title="Fitness"
          tone="navy"
          big
          badge={streak > 0 ? `${streak} week streak` : undefined}
        >
          <div className="mt-3 flex items-center gap-4">
            <HoopRing total={ring.total} done={ring.done} size={84} tone="dark" />
            <p className="font-display text-4xl leading-[0.9] font-black">
              {picks.length === 0
                ? "Nothing picked yet"
                : ring.closed
                  ? "Complete"
                  : `${ring.done} of ${ring.total} done`}
            </p>
          </div>
          {ordered.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {ordered.map((p) => (
                <li key={p.id} className="flex min-w-0 items-center gap-3">
                  {mine.has(p.id) ? (
                    <span
                      aria-hidden
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-red text-white"
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                  ) : (
                    <span aria-hidden className="size-6 shrink-0 rounded-full border-2 border-white/35" />
                  )}
                  <span className={cn("truncate font-semibold", mine.has(p.id) && "text-white/60")}>
                    {p.title}
                    <span className="sr-only">{mine.has(p.id) ? ", done" : ", to do"}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-white/75">The skips and coaches pick a few things each week.</p>
          )}
        </GameTile>

        <GameTile href="/boards/nutrition" name={morphName.board("nutrition")} title="Nutrition" big>
          {today ? (
            <div className="mt-2 flex min-w-0 items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">Recipe of the day</p>
                <p className="mt-1 font-display text-3xl leading-[0.95] font-black text-ink text-balance">
                  {today.title}
                </p>
                {today.body && <p className="mt-1.5 line-clamp-2 text-sm text-ink/60">{today.body}</p>}
                {today.tag && (
                  <span className="mt-2 inline-block rounded-full bg-powder px-2.5 py-0.5 text-xs font-semibold text-navy">
                    {today.tag}
                  </span>
                )}
              </div>
              {today.imageUrl && (
                <Image
                  src={today.imageUrl}
                  alt=""
                  width={240}
                  height={240}
                  sizes="(min-width: 768px) 10vw, 28vw"
                  className="aspect-square w-24 shrink-0 rounded-xl object-cover md:w-32"
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-ink/60">Share your go-to pre-game meal.</p>
          )}
        </GameTile>
      </div>
    </>
  );
}
