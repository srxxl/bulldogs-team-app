"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { greeting, type MascotState, nextStep, reactToTap, type Step } from "@/lib/mascot";
import { BulldogSide } from "./bulldog-side";
import { BulldogSit } from "./bulldog-sit";

const START: Step = { pose: "stand", x: 12, facing: "right", say: null, ms: 900 };

/**
 * The home-screen bulldog: wanders the stage on its own (walks, sits, naps, barks, sniffs)
 * and reacts when tapped. Holds still for people who prefer reduced motion.
 */
export function HomeMascot({ firstName }: { firstName: string }) {
  const [step, setStep] = useState<Step>(START);
  const stateRef = useRef<MascotState>(START);
  const timer = useRef<number | undefined>(undefined);
  const [still, setStill] = useState(false);

  // Each step schedules the next one when it ends.
  const play = (next: Step) => {
    window.clearTimeout(timer.current);
    stateRef.current = next;
    setStep(next);
    timer.current = window.setTimeout(() => play(nextStep(stateRef.current)), next.ms);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: play only touches refs and state setters.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      setStep({ ...START, pose: "sit", say: `G'day, ${firstName}!` });
      return;
    }
    timer.current = window.setTimeout(() => play(greeting(firstName)), START.ms);
    return () => window.clearTimeout(timer.current);
  }, [firstName]);

  const onTap = () => {
    if (still) return;
    play(reactToTap(stateRef.current));
  };

  const walking = step.pose === "walk";
  return (
    <div className="mascot-stage">
      <div
        className={cn("mascot", `mascot-${step.pose}`, step.facing === "right" && "mascot-right")}
        style={{
          left: `${step.x}%`,
          translate: `-${step.x}% 0`,
          transitionDuration: walking ? `${step.ms}ms` : "0ms",
        }}
      >
        {step.say && (
          <span key={step.say + step.pose} className="mascot-say">
            {step.say}
          </span>
        )}
        <button type="button" className="mascot-dog" onClick={onTap} aria-label="Club bulldog. Tap to play.">
          {step.pose === "sit" ? (
            <BulldogSit className="mascot-sit-svg" />
          ) : (
            <BulldogSide asleep={step.pose === "sleep"} className="mascot-side-svg" />
          )}
        </button>
        {step.pose === "sleep" && (
          <span className="mascot-zzz" aria-hidden>
            <i>z</i>
            <i>z</i>
            <i>Z</i>
          </span>
        )}
      </div>
    </div>
  );
}
