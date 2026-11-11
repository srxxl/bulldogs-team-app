"use client";

import { Plus, Search, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { createActivity, pickPinForWeek } from "@/server/actions/content";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "./forms";
import { Sheet } from "./sheet";

export type SavedActivity = { id: string; title: string; body: string | null; tag: string | null };

/**
 * Pick this week's activities, like a training session's drills: from the ones saved in earlier weeks, or write a
 * new one (saved for next time). Skips, coaches and admins.
 */
export function AddActivitySheet({
  saved,
  picked,
  tags,
  triggerClassName,
}: {
  saved: SavedActivity[];
  /** Already on this week. */
  picked: string[];
  tags: string[];
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"saved" | "new">(saved.length ? "saved" : "new");
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [state, action] = useActionState(createActivity, null);
  const onWeek = useMemo(() => new Set(picked), [picked]);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return saved.filter(
      (a) =>
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.tag?.toLowerCase().includes(q) ||
        a.body?.toLowerCase().includes(q),
    );
  }, [saved, query]);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Add an activity"
      triggerClassName={triggerClassName}
      trigger={
        <>
          <Plus size={18} aria-hidden /> Add activity
        </>
      }
    >
      <div role="tablist" aria-label="Add an activity" className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-mist p-1">
        {(
          [
            ["saved", `Saved (${saved.length})`],
            ["new", "New activity"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "min-h-10 rounded-lg text-sm font-semibold",
              tab === key ? "bg-white text-navy" : "text-navy/70 hover:text-navy",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "saved" ? (
        <div className="space-y-3">
          <div className="relative">
            <label htmlFor="activity-search" className="sr-only">
              Search activities
            </label>
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink/40" aria-hidden />
            <Input
              type="search"
              name="activity-search"
              placeholder="Search by name or tag"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {results.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/60">
              No activities match.{" "}
              <button type="button" className="font-semibold text-navy underline" onClick={() => setTab("new")}>
                Write a new one
              </button>
            </p>
          ) : (
            <ul className="max-h-[50dvh] space-y-2 overflow-y-auto">
              {results.map((a) => {
                const isOn = onWeek.has(a.id) || added.has(a.id);
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy">{a.title}</p>
                      <p className="truncate text-xs text-ink/60">{a.tag ?? a.body ?? "No details yet"}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isOn || pending}
                      onClick={() =>
                        start(async () => {
                          const res = await pickPinForWeek({ id: a.id, picked: true });
                          if (res.ok) setAdded((s) => new Set(s).add(a.id));
                        })
                      }
                      className="min-h-10 shrink-0 rounded-lg bg-navy px-3 text-sm font-semibold text-white disabled:bg-mist disabled:text-navy/60"
                    >
                      {isOn ? "Added" : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <Field label="Name" name="title" state={state}>
            <Input name="title" required maxLength={100} placeholder="5 km easy run" state={state} />
          </Field>
          <Field label="What to do" name="body" state={state} hint="Distance, sets and reps, how hard.">
            <Textarea name="body" maxLength={1500} rows={4} state={state} />
          </Field>
          <Field label="Tag" name="tag" state={state}>
            <Input name="tag" list="activity-tags" maxLength={24} state={state} />
            <datalist id="activity-tags">
              {tags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Video or link" name="link" state={state} hint="Optional">
            <Input name="link" type="url" inputMode="url" placeholder="https://" state={state} />
          </Field>
          <FormMessage state={state && !state.ok ? state : null} />
          <SubmitButton pending="Adding…" className="w-full">
            Add to this week and save
          </SubmitButton>
        </form>
      )}
    </Sheet>
  );
}

/** Takes an activity off this week. It stays saved for another week. */
export function RemoveActivityButton({ id, title, dark }: { id: string; title: string; dark: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={`Take ${title} off this week`}
      title="Take off this week"
      disabled={pending}
      onClick={() => start(async () => void (await pickPinForWeek({ id, picked: false })))}
      className={cn(
        "grid size-10 place-items-center rounded-full transition-colors disabled:opacity-40",
        dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-navy/60 hover:bg-mist hover:text-navy",
      )}
    >
      <X size={18} aria-hidden />
    </button>
  );
}
