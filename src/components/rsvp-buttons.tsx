"use client";

import { Check, X } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { setAvailability } from "@/server/actions/availability";
import type { AvailabilityStatus } from "@/server/db/schema";

const OPTIONS: {
  value: AvailabilityStatus;
  label: string;
  icon: typeof Check;
  on: string;
}[] = [
  {
    value: "yes",
    label: "I'm in",
    icon: Check,
    on: "bg-navy text-white border-navy",
  },
  { value: "no", label: "Can't", icon: X, on: "bg-red text-white border-red" },
];

export function RsvpButtons({
  eventId,
  status,
  tone = "light",
  size = "md",
}: {
  eventId: string;
  status: AvailabilityStatus | null;
  tone?: "light" | "dark";
  size?: "sm" | "md";
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const choose = (value: AvailabilityStatus) =>
    startTransition(async () => {
      setError(null);
      setOptimistic(value);
      const res = await setAvailability({ eventId, status: value });
      if (!res.ok) setError(res.error);
    });

  return (
    <div>
      <fieldset className="flex gap-2" aria-busy={pending}>
        <legend className="sr-only">Are you coming?</legend>
        {OPTIONS.map(({ value, label, icon: Icon, on }) => {
          const selected = optimistic === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => choose(value)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 font-semibold transition-[background-color,color,transform] active:scale-95",
                size === "sm" ? "min-h-10 px-2.5 text-xs" : "min-h-11 px-3 text-sm",
                selected
                  ? tone === "dark" && value === "yes"
                    ? "border-white bg-white text-navy" // navy-on-navy would vanish on the match card
                    : on
                  : tone === "dark"
                    ? "border-white/25 text-white hover:border-white/60"
                    : "border-navy/15 bg-white text-navy hover:border-navy/40",
              )}
            >
              <Icon size={size === "sm" ? 14 : 16} strokeWidth={2.5} />
              {label}
            </button>
          );
        })}
      </fieldset>
      {error && (
        <p role="alert" className={cn("mt-2 text-sm font-medium", tone === "dark" ? "text-powder" : "text-red")}>
          {error}
        </p>
      )}
    </div>
  );
}
