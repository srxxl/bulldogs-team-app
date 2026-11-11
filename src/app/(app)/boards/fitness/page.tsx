import { Check, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { AddActivitySheet, RemoveActivityButton } from "@/components/activity-picker";
import { BackButton } from "@/components/back-button";
import { HoopRing } from "@/components/hoop-ring";
import { Morph, morphName } from "@/components/morph";
import { DoneSheet, UndoDoneButton } from "@/components/pin-actions";
import { PinDoneList } from "@/components/pin-done";
import { EmptyState } from "@/components/ui";
import { YourWeeks } from "@/components/your-weeks";
import { BOARDS } from "@/lib/boards";
import { cn } from "@/lib/cn";
import { currentStreak, hoop } from "@/lib/hoops";
import { canPickPins } from "@/lib/roles";
import { formatDateOnly, perthWeekStart } from "@/lib/time";
import { formatDistance, formatDuration, formatPace } from "@/lib/workout";
import { requireMember } from "@/server/auth/session";
import { getMyHoopWeeks, getPins, getWeekDone, getWeekPicks } from "@/server/queries/content";

export const metadata: Metadata = { title: "Fitness" };

/**
 * This week's activities: the Fitness tile grown into a page. Your hoop up top, then a card per activity to log
 * ("I did it"), the ones still to do first. Skips, coaches and admins add activities from the saved ones or
 * write new ones, like a training session's drills.
 */
export default async function FitnessPage() {
  const me = await requireMember();
  const week = perthWeekStart();
  const planner = canPickPins(me);
  const [picks, done, hoops, saved] = await Promise.all([
    getWeekPicks(week),
    getWeekDone(week),
    getMyHoopWeeks(me.id, week),
    planner ? getPins("fitness") : [],
  ]);
  const mine = done.filter((d) => d.userId === me.id);
  const ring = hoop({ picks: picks.map((p) => ({ pinId: p.id, board: p.board })), mine });
  const streak = currentStreak(hoops.weeks, week);
  const logOf = (id: string) => mine.find((m) => m.pinId === id) ?? null;
  const ordered = [...picks.filter((p) => !logOf(p.id)), ...picks.filter((p) => logOf(p.id))];
  const b = BOARDS.fitness;

  const headline =
    picks.length === 0 ? "Nothing picked yet" : ring.closed ? "Complete" : `${ring.done} of ${ring.total} done`;

  return (
    <div className="space-y-6">
      <Morph name={morphName.board("fitness")}>
        <header className="rounded-[28px] bg-navy p-5 text-white md:p-8">
          <div className="flex items-center gap-3">
            <BackButton href="/boards" to="fitness and nutrition" />
            <p className="text-sm font-semibold text-white/70">Week of {formatDateOnly(week)}</p>
          </div>
          <div className="mt-5 flex items-center gap-5">
            <HoopRing total={ring.total} done={ring.done} size={104} tone="dark" />
            <div className="min-w-0">
              <h1 className="text-6xl leading-[0.9] font-black md:text-7xl">Fitness</h1>
              <p className="mt-2 font-display text-2xl font-bold text-white/85">
                {headline}
                {streak > 0 && (
                  <span className="ml-2 font-sans text-sm font-semibold text-white/65">{streak} week streak</span>
                )}
              </p>
            </div>
          </div>
          {planner && (
            <div className="mt-5">
              <AddActivitySheet
                saved={saved.map((p) => ({ id: p.id, title: p.title, body: p.body, tag: p.tag }))}
                picked={picks.map((p) => p.id)}
                tags={b.tags}
                triggerClassName="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 font-semibold text-navy transition-colors hover:bg-mist"
              />
            </div>
          )}
        </header>
      </Morph>

      {picks.length === 0 ? (
        <EmptyState title={b.empty}>
          {planner
            ? "Add one from the saved activities, or write a new one."
            : "The skips and coaches pick a few things each week."}
        </EmptyState>
      ) : (
        <ul aria-label="This week's activities" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ordered.map((p) => {
            const log = logOf(p.id);
            const forPin = done.filter((d) => d.pinId === p.id);
            const pace = log?.distanceM != null && log.durationS != null && formatPace(log.distanceM, log.durationS);
            // your numbers, if you logged any; with none, the tick says it's done and the card keeps its description
            const logged = log && (log.distanceM != null || log.durationS != null) ? log : null;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex min-h-72 min-w-0 flex-col rounded-[28px] p-5",
                  log ? "bg-powder text-navy" : "bg-white text-ink",
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {p.tag && <p className="mb-1 text-sm font-semibold text-red">{p.tag}</p>}
                    <h2 className="font-display text-4xl leading-[0.92] font-black text-navy">{p.title}</h2>
                  </div>
                  {log && (
                    <span
                      role="img"
                      aria-label="You did it"
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-red text-white"
                    >
                      <Check size={20} strokeWidth={3} aria-hidden />
                    </span>
                  )}
                  {planner && <RemoveActivityButton id={p.id} title={p.title} dark={false} />}
                </div>

                {logged ? (
                  // your log in a navy box, so it reads as yours and not as part of the activity's name
                  <div className="mt-4 rounded-2xl bg-navy p-4 text-white">
                    <p className="text-sm font-semibold text-white/70">
                      {logged.distanceM != null ? "Your distance" : "Your time"}
                    </p>
                    <p className="mt-1 font-display text-5xl leading-[0.9] font-black">
                      {logged.distanceM != null
                        ? formatDistance(logged.distanceM)
                        : formatDuration(logged.durationS ?? 0)}
                    </p>
                    {logged.distanceM != null && logged.durationS != null && (
                      <p className="mt-1.5 text-sm font-medium text-white/75">
                        {[formatDuration(logged.durationS), pace].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                ) : (
                  p.body && <p className="mt-3 text-sm text-pretty whitespace-pre-line text-ink/80">{p.body}</p>
                )}
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-red underline underline-offset-4"
                  >
                    <ExternalLink size={14} aria-hidden /> Watch or read more
                  </a>
                )}

                <div className="mt-auto pt-4">
                  <PinDoneList done={forPin} onFill={!!log} />
                  <div className="mt-3">
                    {log ? (
                      <UndoDoneButton pinId={p.id} />
                    ) : (
                      <DoneSheet
                        pinId={p.id}
                        title={p.title}
                        mine={null}
                        dark={false}
                        triggerClassName="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-navy text-lg font-bold text-white transition-colors hover:bg-navy-deep"
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <YourWeeks weeks={hoops.weeks} thisWeek={week} />
    </div>
  );
}
