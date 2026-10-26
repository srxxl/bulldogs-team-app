"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { markFeedbackRead, submitFeedback } from "@/server/actions/content";
import { Field, FormMessage, Select, SubmitButton, Textarea } from "./forms";

export function FeedbackForm({ games }: { games: { id: string; label: string }[] }) {
  const [state, action] = useActionState(submitFeedback, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">What kind of note?</legend>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["reflection", "Reflection"],
            ["suggestion", "Suggestion"],
            ["shoutout", "Shout-out"],
          ].map(([v, l], i) => (
            <label
              key={v}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-2 border-navy/15 bg-white px-2 text-sm font-semibold text-navy has-checked:border-navy has-checked:bg-navy has-checked:text-white"
            >
              <input type="radio" name="kind" value={v} defaultChecked={i === 0} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="About a game?" name="eventId" state={state}>
        <Select name="eventId" defaultValue="">
          <option value="">Not about a specific game</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Your note" name="body" state={state}>
        <Textarea
          name="body"
          required
          minLength={3}
          maxLength={2000}
          rows={6}
          state={state}
          placeholder="What went well, what we could do better, what you'd like to try…"
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pending="Sending…" className="w-full">
        Send anonymously
      </SubmitButton>
    </form>
  );
}

export function MarkReadButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => void (await markFeedbackRead(id)))}
      className="ml-auto rounded-lg px-2 py-1 font-semibold text-navy underline underline-offset-4 hover:bg-mist"
    >
      Mark as read
    </button>
  );
}
