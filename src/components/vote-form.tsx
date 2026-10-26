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
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="eventId" value={eventId} />
      {SLOTS.map((s, i) => (
        <input key={s.key} type="hidden" name={s.key} value={picks[i] ?? ""} />
      ))}

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

      <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
        {SLOTS.map((s, i) => {
          const c = byId.get(picks[i]);
          return (
            <div key={s.key} className="flex items-center gap-3 rounded-2xl bg-white p-3">
              <span className="display-num w-10 text-center text-5xl font-black text-red">{s.points}</span>
              {c ? (
                <span className="flex items-center gap-2 font-semibold">
                  <Avatar name={c.name} src={c.image} size={32} />
                  {c.name}
                </span>
              ) : (
                <span className="text-sm text-ink/50">Pick a player</span>
              )}
            </div>
          );
        })}
        <FormMessage state={state} />
        <SubmitButton pending="Submitting…" className="w-full">
          {ballot ? "Update my votes" : "Submit votes"}
        </SubmitButton>
      </aside>
    </form>
  );
}
