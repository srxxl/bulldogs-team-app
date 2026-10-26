"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { CLUB, isUs } from "@/lib/club";
import { cn } from "@/lib/cn";
import type { LadderRow } from "@/server/db/schema";

/** Home-screen ladder: the teams around us, expandable to the full table. */
export function LadderWidget({ rows, updated }: { rows: LadderRow[]; updated: string | null }) {
  const [full, setFull] = useState(false);
  const us = rows.findIndex((r) => isUs(r.team));
  const shown = full ? rows : us === -1 ? rows.slice(0, 4) : rows.slice(Math.max(0, us - 2), us + 2);

  return (
    <section className="rounded-[28px] bg-white p-5 md:p-7" aria-labelledby="ladder-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="ladder-heading" className="text-3xl font-bold text-navy">
          Ladder
        </h2>
        <span className="text-xs text-ink/50">{[CLUB.grade, updated].filter(Boolean).join(", ")}</span>
      </div>
      <table className="w-full border-separate border-spacing-y-1 text-right text-sm">
        <caption className="sr-only">PFL {CLUB.grade} ladder</caption>
        <thead className={cn(!full && "sr-only")}>
          <tr className="text-xs text-ink/50">
            <th scope="col" className="px-2 text-left font-semibold">
              Team
            </th>
            <th scope="col" className="px-1 font-semibold">
              P
            </th>
            <th scope="col" className="px-1 font-semibold">
              W
            </th>
            <th scope="col" className="hidden px-1 font-semibold sm:table-cell">
              L
            </th>
            <th scope="col" className="px-1 font-semibold">
              %
            </th>
            <th scope="col" className="px-2 font-semibold">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => {
            const mine = isUs(r.team);
            return (
              <tr key={r.position} className={cn(mine ? "bg-navy text-white" : full && "odd:bg-chalk/70")}>
                <th scope="row" className="rounded-l-xl px-2 py-2 text-left font-medium">
                  <span className="display-num mr-2 inline-block w-6 text-2xl font-bold">{r.position}</span>
                  {r.team}
                </th>
                <td className={cn("px-1 tabular-nums", !full && "sr-only")}>{r.played}</td>
                <td className={cn("px-1 tabular-nums", !full && "sr-only")}>{r.won}</td>
                <td className={cn("hidden px-1 tabular-nums sm:table-cell", !full && "sr-only")}>{r.lost}</td>
                <td className="px-1 tabular-nums opacity-70">{r.percentage.toFixed(1)}</td>
                <td className="display-num rounded-r-xl px-2 text-2xl font-bold">{r.premiershipPoints}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length > shown.length || full ? (
        <button
          type="button"
          onClick={() => setFull((f) => !f)}
          aria-expanded={full}
          className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-navy hover:bg-mist"
        >
          {full ? "Show less" : "Show full ladder"}
          <ChevronDown size={16} className={cn("transition-transform", full && "rotate-180")} aria-hidden />
        </button>
      ) : null}
    </section>
  );
}
