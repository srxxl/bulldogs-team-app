"use client";

import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Plus, Search, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { addDrillToSession, createDrill, removeDrillFromSession, reorderSessionDrills } from "@/server/actions/drills";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "./forms";
import { Sheet } from "./sheet";

export type PlanDrill = {
  id: string;
  title: string;
  howTo: string | null;
  minutes: number | null;
  focus: string | null;
  link: string | null;
};

const FOCUS = ["Warm-up", "Skills", "Contested", "Fitness", "Match sim", "Cool-down"];

/** A training session's drills in running order, with a catalog picker for captains, coaches and admins. */
export function SessionPlan({
  eventId,
  drills,
  catalog,
  editable,
}: {
  eventId: string;
  drills: PlanDrill[];
  catalog: PlanDrill[];
  editable: boolean;
}) {
  const [order, setOrder] = useOptimistic(drills);
  const [, start] = useTransition();
  const total = order.reduce((sum, d) => sum + (d.minutes ?? 0), 0);

  const move = (index: number, by: -1 | 1) =>
    start(async () => {
      const next = [...order];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      setOrder(next);
      await reorderSessionDrills(
        eventId,
        next.map((d) => d.id),
      );
    });
  const remove = (id: string) =>
    start(async () => {
      setOrder(order.filter((d) => d.id !== id));
      await removeDrillFromSession(eventId, id);
    });

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink/60">
          {order.length === 0
            ? editable
              ? "No drills yet. Add from the catalog or write a new one."
              : "The coaches haven't planned this session yet."
            : `${order.length} ${order.length === 1 ? "drill" : "drills"}${total > 0 ? `, about ${total} minutes` : ""}`}
        </p>
        {editable && <AddDrillSheet eventId={eventId} catalog={catalog} planned={new Set(order.map((d) => d.id))} />}
      </div>

      {order.length > 0 && (
        <ol className="space-y-1.5">
          {order.map((d, i) => (
            <li key={d.id} className="flex items-start gap-1 rounded-xl bg-chalk">
              <details className="group min-w-0 flex-1">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                  <span className="display-num w-5 shrink-0 text-2xl font-black text-red">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-navy">{d.title}</span>
                    {(d.minutes != null || d.focus) && (
                      <span className="block text-xs text-ink/60">
                        {[d.minutes != null && `${d.minutes} min`, d.focus].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </span>
                  {(d.howTo || d.link) && (
                    <ChevronDown
                      size={16}
                      className="shrink-0 text-navy/60 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  )}
                </summary>
                {(d.howTo || d.link) && (
                  <div className="px-3 pb-3 pl-11">
                    {d.howTo && <p className="whitespace-pre-line text-sm text-ink/80">{d.howTo}</p>}
                    {d.link && (
                      <a
                        href={d.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-red underline underline-offset-4"
                      >
                        <ExternalLink size={14} aria-hidden /> Watch or read more
                      </a>
                    )}
                  </div>
                )}
              </details>
              {editable && (
                <div className="flex shrink-0 items-center py-1 pr-1">
                  <IconButton label={`Move ${d.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp size={16} />
                  </IconButton>
                  <IconButton
                    label={`Move ${d.title} down`}
                    disabled={i === order.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={16} />
                  </IconButton>
                  <IconButton label={`Remove ${d.title} from this session`} onClick={() => remove(d.id)}>
                    <X size={16} />
                  </IconButton>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg text-navy hover:bg-white disabled:opacity-25"
    >
      {children}
    </button>
  );
}

function AddDrillSheet({ eventId, catalog, planned }: { eventId: string; catalog: PlanDrill[]; planned: Set<string> }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"catalog" | "new">(catalog.length ? "catalog" : "new");
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [state, action] = useActionState(createDrill, null);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.focus?.toLowerCase().includes(q) ||
        d.howTo?.toLowerCase().includes(q),
    );
  }, [catalog, query]);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Add a drill"
      trigger={
        <>
          <Plus size={18} /> Add drill
        </>
      }
    >
      <div role="tablist" aria-label="Add a drill" className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-mist p-1">
        {(
          [
            ["catalog", `From the catalog (${catalog.length})`],
            ["new", "New drill"],
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

      {tab === "catalog" ? (
        <div className="space-y-3">
          <div className="relative">
            <label htmlFor="drill-search" className="sr-only">
              Search drills
            </label>
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink/40" aria-hidden />
            <Input
              type="search"
              name="drill-search"
              placeholder="Search by name or focus"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {results.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/60">
              No drills match.{" "}
              <button type="button" className="font-semibold text-navy underline" onClick={() => setTab("new")}>
                Write a new one
              </button>
            </p>
          ) : (
            <ul className="max-h-[50dvh] space-y-2 overflow-y-auto">
              {results.map((d) => {
                const inSession = planned.has(d.id) || added.has(d.id);
                return (
                  <li key={d.id} className="flex items-center gap-3 rounded-xl bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy">{d.title}</p>
                      <p className="truncate text-xs text-ink/60">
                        {[d.focus, d.minutes != null && `${d.minutes} min`].filter(Boolean).join(", ") ||
                          "No details yet"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={inSession || pending}
                      onClick={() =>
                        start(async () => {
                          const res = await addDrillToSession(eventId, d.id);
                          if (res.ok) setAdded((s) => new Set(s).add(d.id));
                        })
                      }
                      className="min-h-10 shrink-0 rounded-lg bg-navy px-3 text-sm font-semibold text-white disabled:bg-mist disabled:text-navy/60"
                    >
                      {inSession ? "Added" : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="eventId" value={eventId} />
          <Field label="Name" name="title" state={state}>
            <Input name="title" required maxLength={80} placeholder="Kick to advantage" state={state} />
          </Field>
          <Field label="How to run it" name="howTo" state={state} hint="Set-up, numbers, what to coach.">
            <Textarea name="howTo" maxLength={1500} rows={4} state={state} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Minutes" name="minutes" state={state}>
              <Input name="minutes" type="number" inputMode="numeric" min={1} max={90} state={state} />
            </Field>
            <Field label="Focus" name="focus" state={state}>
              <Input name="focus" list="drill-focus" maxLength={24} state={state} />
              <datalist id="drill-focus">
                {FOCUS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field label="Video or link" name="link" state={state} hint="Optional">
            <Input name="link" type="url" inputMode="url" placeholder="https://" state={state} />
          </Field>
          <FormMessage state={state && !state.ok ? state : null} />
          <SubmitButton pending="Adding…" className="w-full">
            Add to session and catalog
          </SubmitButton>
        </form>
      )}
    </Sheet>
  );
}
