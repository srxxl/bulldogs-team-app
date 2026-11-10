"use client";

import { Check } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/cn";
import { toggleCheer } from "@/server/actions/content";

/** "Nice one" on a teammate's log. Turns red straight away; the server catches up. */
export function CheerButton({ doneId, cheered }: { doneId: string; cheered: boolean }) {
  const [on, setOn] = useOptimistic(cheered);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await toggleCheer(doneId);
        })
      }
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold transition-colors",
        on ? "border-red bg-red text-white" : "border-navy/20 text-navy hover:border-navy",
      )}
    >
      <Check size={16} aria-hidden /> Nice one
    </button>
  );
}
