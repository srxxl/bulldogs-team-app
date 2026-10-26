"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { type PupVisit, planVisit, shouldVisit } from "@/lib/pup";
import { BulldogFront, BulldogSide, Footy } from "./bulldog";

const LAST_KEY = "bulldogs:pup-last";

const readLast = () => {
  try {
    const v = sessionStorage.getItem(LAST_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
};
const writeLast = (t: number) => {
  try {
    sessionStorage.setItem(LAST_KEY, String(t));
  } catch {
    // Private mode etc: the pup just shows up a little more often.
  }
};

/**
 * Easter egg: now and then a tiny bulldog wanders across the screen.
 * Never for people who prefer reduced motion. Add `?pup=trot` (or peek, footy, nap, zoomies) to summon him.
 */
export function BulldogEasterEgg() {
  const pathname = usePathname();
  const [visit, setVisit] = useState<PupVisit | null>(null);
  const [woof, setWoof] = useState(false);

  useEffect(() => {
    // Re-plan on every page change.
    void pathname;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const forced = new URLSearchParams(window.location.search).get("pup");
    if (forced !== null) {
      setVisit(planVisit(Math.random, forced));
      return;
    }
    const timer = window.setTimeout(
      () => {
        const now = Date.now();
        if (!shouldVisit(now, readLast(), Math.random())) return;
        writeLast(now);
        setVisit(planVisit());
      },
      15_000 + Math.random() * 30_000,
    );
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!visit) return null;

  const done = (e: React.AnimationEvent) => {
    // Only the outer track ending finishes the visit (inner loops like leg swings never end).
    if (e.target === e.currentTarget) {
      setVisit(null);
      setWoof(false);
    }
  };
  const bark = () => {
    setWoof(true);
    window.setTimeout(() => setWoof(false), 1600);
  };

  const sideways = visit.trick === "trot" || visit.trick === "footy" || visit.trick === "zoomies";

  return (
    <div aria-hidden className="pup-stage">
      <div
        key={visit.id}
        className={cn("pup", `pup-${visit.trick}`, sideways && visit.rtl && "pup-rtl")}
        style={sideways ? undefined : { left: `${visit.x}%` }}
        onAnimationEnd={done}
      >
        <button type="button" tabIndex={-1} className="pup-body" onClick={bark}>
          {visit.trick === "peek" ? (
            <BulldogFront className="w-12" />
          ) : (
            <BulldogSide asleep={visit.trick === "nap"} className="w-16" />
          )}
        </button>
        {visit.trick === "footy" && <Footy className="pup-ball w-5" />}
        {visit.trick === "nap" && (
          <span className="pup-zzz">
            <i>z</i>
            <i>z</i>
            <i>Z</i>
          </span>
        )}
        {woof && <span className="pup-woof">Go Doggies!</span>}
      </div>
    </div>
  );
}
