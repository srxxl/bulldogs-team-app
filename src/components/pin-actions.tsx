"use client";

import { Check, Trash2, Undo2 } from "lucide-react";
import { type ReactNode, useActionState, useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/workout";
import { deletePin, logPinDone, undoPinDone } from "@/server/actions/content";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "./forms";
import { HoopCelebration } from "./hoop-celebration";
import { Sheet } from "./sheet";

export function DeletePinButton({ id, what = "recipe" }: { id: string; what?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={`Remove ${what}`}
      disabled={pending}
      onClick={() => confirm(`Remove this ${what}?`) && start(async () => void (await deletePin(id)))}
      className="-m-2 grid size-9 place-items-center rounded-lg opacity-60 hover:opacity-100 disabled:opacity-30"
    >
      <Trash2 size={15} />
    </button>
  );
}

/**
 * "I didn't do it": takes your log of an activity back (numbers, note and photo too), after a check. Sits where
 * "I did it" was, the same size, outlined instead of filled.
 */
export function UndoDoneButton({ pinId, className }: { pinId: string; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        confirm("Take back your log? Your numbers, note and photo go too.") &&
        start(async () => void (await undoPinDone(pinId)))
      }
      className={cn(
        "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-navy/25 text-lg font-bold text-navy transition-colors hover:border-navy disabled:opacity-50",
        className,
      )}
    >
      <Undo2 size={18} aria-hidden /> {pending ? "Taking it back…" : "I didn't do it"}
    </button>
  );
}

type MyDone = { distanceM: number | null; durationS: number | null; note: string | null; imageUrl: string | null };

/**
 * "I did it" on one of this week's activities: log it, with optional distance and time, a note and a photo.
 * Once logged, the button says so and reopens the form to change it or take it back.
 */
export function DoneSheet({
  pinId,
  title,
  mine,
  dark,
  triggerClassName,
  trigger,
}: {
  pinId: string;
  title: string;
  /** Restyle the button that opens it, e.g. a big "I did it" across a workout card. */
  triggerClassName?: string;
  /** What the button says, if not the usual "I did it" or "You did it". */
  trigger?: ReactNode;
  mine: MyDone | null;
  /** The pin is navy, so the button goes white. */
  dark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(logPinDone, null);
  const [undoing, startUndo] = useTransition();
  // closing your hoop with this log brings up the celebration
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (!state?.ok) return;
    setOpen(false);
    if (state.data) setCelebrating(true);
  }, [state]);

  return (
    <>
      {celebrating && state?.ok && state.data && (
        <HoopCelebration {...state.data} onClose={() => setCelebrating(false)} />
      )}
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={mine ? "You did it" : "I did it"}
        triggerClassName={
          triggerClassName ??
          cn(
            "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors",
            mine
              ? dark
                ? "border-2 border-white/40 text-white hover:border-white"
                : "border-2 border-navy/25 text-navy hover:border-navy"
              : dark
                ? "bg-white text-navy hover:bg-mist"
                : "bg-navy text-white hover:bg-navy-deep",
          )
        }
        trigger={
          trigger ??
          (mine ? (
            <>
              <Check size={18} aria-hidden /> You did it
            </>
          ) : (
            <>
              <Check size={18} aria-hidden /> I did it
            </>
          ))
        }
      >
        <form action={action} className="space-y-4">
          <p className="-mt-2 font-display text-xl font-bold text-navy">{title}</p>
          <input type="hidden" name="pinId" value={pinId} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Distance (km)" name="distanceKm" state={state} hint="Optional">
              <Input
                name="distanceKm"
                inputMode="decimal"
                placeholder="5.2"
                defaultValue={mine?.distanceM != null ? String(mine.distanceM / 1000) : ""}
                state={state}
              />
            </Field>
            <Field label="Time" name="time" state={state} hint="Optional, like 32:15">
              <Input
                name="time"
                inputMode="numeric"
                placeholder="32:15"
                defaultValue={mine?.durationS != null ? formatDuration(mine.durationS) : ""}
                state={state}
              />
            </Field>
          </div>
          <Field label="How did it go?" name="note" state={state} hint="Optional. The team can see this.">
            <Textarea name="note" maxLength={280} defaultValue={mine?.note ?? ""} state={state} />
          </Field>
          <Field
            label="Photo"
            name="image"
            state={state}
            hint={mine?.imageUrl ? "You've added one. Choose another to replace it." : "Optional, up to 5 MB"}
          >
            <Input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-mist file:px-3 file:py-1.5 file:font-semibold file:text-navy"
            />
          </Field>
          <FormMessage state={state && !state.ok ? state : null} />
          <SubmitButton pending="Logging…" className="w-full">
            {mine ? "Save" : "Log it"}
          </SubmitButton>
          {mine && (
            <button
              type="button"
              disabled={undoing}
              onClick={() =>
                startUndo(async () => {
                  const res = await undoPinDone(pinId);
                  if (res.ok) setOpen(false);
                })
              }
              className="w-full rounded-xl py-2 text-sm font-semibold text-red hover:bg-red/5 disabled:opacity-50"
            >
              {undoing ? "Taking it back…" : "I didn't do it after all"}
            </button>
          )}
        </form>
      </Sheet>
    </>
  );
}
