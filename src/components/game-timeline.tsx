"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/cn";
import { formatTime, fromLocalInput, toLocalInput } from "@/lib/time";
import { currentStep, DEFAULT_TIMELINE, isDefault, type Step, scheduled, sortSteps } from "@/lib/timeline";
import { saveTimeline } from "@/server/actions/timeline";
import { FormMessage } from "./forms";
import { buttonClass } from "./ui";

/** Free time between the planned steps ("Free", or "Own time") is set quieter. */
const isOwnTime = (label: string) => /^(free|own time|free time)$/i.test(label.trim());

/**
 * A game's timeline from arriving to bounce down, running left to right. On game day the step that's on now is lit up (it moves on by
 * itself). Skips, coaches and admins can change it for this game, or put it back to the usual one.
 */
export function GameTimeline({
  eventId,
  bounce,
  steps,
  custom,
  canEdit,
}: {
  eventId: string;
  bounce: Date;
  steps: Step[];
  /** This game has its own timeline rather than the usual one. */
  custom: boolean;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  // which step is on now: worked out in the browser (and every half minute), so it's never stale
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const on = now ? currentStep(steps, bounce, now) : null;
  // on a phone the track scrolls sideways: bring the step that's on now into view
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (on == null) return;
    track.current?.querySelector("[data-on]")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [on]);

  if (editing)
    return <TimelineEditor eventId={eventId} bounce={bounce} steps={steps} onDone={() => setEditing(false)} />;

  return (
    <div>
      {/* left to right, ending at bounce: all of it across a laptop, swiped sideways on a phone */}
      <div ref={track} className="-mx-5 overflow-x-auto px-5 pb-2 md:-mx-7 md:px-7">
        <ol className="flex min-w-max md:min-w-0">
          {scheduled(steps, bounce).map((s, i) => {
            const first = i === 0;
            const last = i === steps.length - 1;
            const quiet = isOwnTime(s.label);
            return (
              <li
                key={`${s.minutesBefore}-${s.label}`}
                data-on={on === i || undefined}
                className={cn(
                  "flex w-24 shrink-0 flex-col items-center text-center md:w-auto md:flex-1",
                  on === i && "rounded-2xl bg-red/[0.07]",
                )}
              >
                <time
                  dateTime={s.at.toISOString()}
                  className={cn(
                    "pt-2 font-display text-lg font-bold tabular-nums",
                    quiet ? "text-ink/45" : "text-navy",
                    (last || on === i) && "text-red",
                  )}
                >
                  {formatTime(s.at)}
                </time>
                {/* the track: a line through every step, with a dot per step */}
                <div className="relative my-2 flex h-5 w-full items-center justify-center" aria-hidden>
                  <span
                    className={cn(
                      "absolute h-0.5 bg-ink/12",
                      first ? "left-1/2 right-0" : last ? "right-1/2 left-0" : "inset-x-0",
                    )}
                  />
                  <span
                    className={cn(
                      "relative rounded-full",
                      last ? "size-5 bg-red" : quiet ? "size-2.5 bg-ink/25" : "size-3.5 bg-navy",
                      on === i && "size-5 bg-red ring-4 ring-red/20",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "px-1 pb-2 text-sm leading-tight text-balance",
                    quiet ? "text-ink/55" : "font-semibold text-ink",
                    last && "font-display text-xl leading-none font-black text-red",
                  )}
                >
                  {s.label}
                  {on === i && !last && <span className="block text-xs font-semibold text-red">Now</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {canEdit && (
        // the panel's top-right corner, level with its title
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Change the timeline for this game"
          title="Change for this game"
          className="absolute top-4 right-4 grid size-11 place-items-center rounded-xl text-navy hover:bg-mist focus-visible:outline-2 focus-visible:outline-navy md:top-6 md:right-6"
        >
          <Pencil size={18} aria-hidden />
        </button>
      )}
      {canEdit && custom && <p className="mt-3 text-sm text-ink/55">Changed from the usual timeline</p>}
    </div>
  );
}

type Row = { key: number; label: string; time: string };
let nextKey = 0;

/** Edit the steps as clock times on the day; they're saved as minutes before bounce. */
function TimelineEditor({
  eventId,
  bounce,
  steps,
  onDone,
}: {
  eventId: string;
  bounce: Date;
  steps: Step[];
  onDone: () => void;
}) {
  const day = toLocalInput(bounce).slice(0, 10);
  const toRow = (s: Step): Row => ({
    key: nextKey++,
    label: s.label,
    time: toLocalInput(new Date(bounce.getTime() - s.minutesBefore * 60_000)).slice(11),
  });
  const [rows, setRows] = useState<Row[]>(() => sortSteps(steps).map(toRow));
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  const toSteps = (): Step[] =>
    rows.map((r) => ({
      label: r.label,
      minutesBefore: Math.round((bounce.getTime() - fromLocalInput(`${day}T${r.time || "00:00"}`).getTime()) / 60_000),
    }));
  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const save = (steps: Step[] | null) =>
    start(async () => {
      const res = await saveTimeline({ eventId, steps });
      setResult(res);
      if (res.ok) onDone();
    });

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/60">Bounce is at {formatTime(bounce)}. Times are for this game only.</p>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`t-${r.key}`}>
              Time for step {i + 1}
            </label>
            <input
              id={`t-${r.key}`}
              type="time"
              value={r.time}
              onChange={(e) => update(r.key, { time: e.target.value })}
              className="min-h-11 w-32 shrink-0 rounded-xl border border-ink/15 bg-white px-3 tabular-nums"
            />
            <label className="sr-only" htmlFor={`l-${r.key}`}>
              Step {i + 1}
            </label>
            <input
              id={`l-${r.key}`}
              value={r.label}
              maxLength={40}
              onChange={(e) => update(r.key, { label: e.target.value })}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3"
            />
            <button
              type="button"
              aria-label={`Remove ${r.label || `step ${i + 1}`}`}
              onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-ink/50 hover:bg-red/10 hover:text-red"
            >
              <Trash2 size={17} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setRows((rs) => [...rs, { key: nextKey++, label: "", time: rs.at(-1)?.time ?? "" }])}
        className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-navy hover:bg-mist"
      >
        <Plus size={16} aria-hidden /> Add a step
      </button>
      <FormMessage state={result && !result.ok ? result : null} />
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" disabled={pending} onClick={() => save(toSteps())} className={buttonClass("primary")}>
          {pending ? "Saving…" : "Save timeline"}
        </button>
        <button type="button" disabled={pending} onClick={onDone} className={buttonClass("ghost")}>
          Cancel
        </button>
        {!isDefault(steps) && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setRows(DEFAULT_TIMELINE.map(toRow));
              save(null);
            }}
            className={buttonClass("ghost", "text-red")}
          >
            Use the usual timeline
          </button>
        )}
      </div>
    </div>
  );
}
