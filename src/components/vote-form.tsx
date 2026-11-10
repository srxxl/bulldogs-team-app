"use client";

import { useActionState, useState } from "react";
import { cn } from "@/lib/cn";
import type { Ballot } from "@/lib/votes";
import { submitBallot } from "@/server/actions/votes";
import { Avatar } from "./avatar";
import { FormMessage, SubmitButton } from "./forms";

type Candidate = {
  id: string;
  name: string;
  guernsey: number | null;
  image: string | null;
  played: boolean;
};
const SLOTS = [
  { key: "three", points: 3 },
  { key: "two", points: 2 },
  { key: "one", points: 1 },
] as const;

/** Tap players in order: first tap is 3 votes, then 2, then 1. Tap again to remove. */
export function VoteForm({
  eventId,
  candidates,
  ballot,
}: {
  eventId: string;
  candidates: Candidate[];
  ballot: Ballot | null;
}) {
  const [picks, setPicks] = useState<string[]>(ballot ? [ballot.three, ballot.two, ballot.one] : []);
  const [state, action] = useActionState(submitBallot, null);

  const toggle = (id: string) =>
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));
  const byId = new Map(candidates.map((c) => [c.id, c]));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="eventId" value={eventId} />
      {SLOTS.map((s, i) => (
        <input key={s.key} type="hidden" name={s.key} value={picks[i] ?? ""} />
      ))}

      {/* your 3, 2 and 1 across the top, filling in as you tap */}
      <div className="space-y-3">
        <ol className="grid grid-cols-3 gap-2">
          {SLOTS.map((s, i) => {
            const c = byId.get(picks[i]);
            return (
              <li
                key={s.key}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl p-3 text-center",
                  c ? "bg-chalk" : "border-2 border-dashed border-navy/20",
                )}
              >
                <span className="display-num text-5xl leading-none font-black text-red">{s.points}</span>
                {c ? (
                  <>
                    <Avatar name={c.name} src={c.image} size={40} />
                    <span className="w-full truncate text-sm font-semibold">{c.name.split(" ")[0]}</span>
                  </>
                ) : (
                  <span className="grid min-h-[4.25rem] place-items-center text-sm text-ink/50">Pick a player</span>
                )}
              </li>
            );
          })}
        </ol>
        <FormMessage state={state} />
        <SubmitButton pending="Submitting…" disabled={picks.length < 3} className="w-full">
          {picks.length < 3 ? `Pick ${3 - picks.length} more` : ballot ? "Update my votes" : "Submit votes"}
        </SubmitButton>
      </div>

      <div>
        <p className="mb-3 text-sm text-ink/70">Tap your 3-vote player first, then 2, then 1.</p>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {candidates.map((c) => {
            const rank = picks.indexOf(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={rank !== -1}
                  className={cn(
                    "relative flex w-full flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-center transition-colors",
                    rank !== -1 ? "bg-navy text-white" : "hover:bg-mist",
                    !c.played && rank === -1 && "opacity-70",
                  )}
                >
                  <Avatar name={c.name} src={c.image} size={52} />
                  <span className="w-full truncate text-sm font-semibold">{c.name.split(" ")[0]}</span>
                  {c.guernsey != null && <span className="text-xs opacity-60">#{c.guernsey}</span>}
                  {rank !== -1 && (
                    <span className="display-num absolute top-1.5 right-2 text-3xl font-black text-red">
                      {3 - rank}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </form>
  );
}
