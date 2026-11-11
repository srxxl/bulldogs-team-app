"use client";

import { useEffect, useRef } from "react";
import { Confetti } from "./confetti";
import { HoopRing } from "./hoop-ring";

const WORDS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/**
 * Closing your hoop: a full-screen moment with the closed ring, the bulldog playing with its footy, confetti,
 * and your streak.
 */
export function HoopCelebration({ total, streak, onClose }: { total: number; streak: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const count = WORDS[streak] ?? String(streak);
  // "an eight week streak", "an 11 week streak"
  const article = /^(eight|8|11|18)/.test(count) ? "an" : "a";
  const line =
    streak > 1 ? `That's ${article} ${count} week streak.` : "Your streak starts here. Keep it going next week.";

  return (
    <dialog
      ref={ref}
      aria-label="Complete"
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#3a4aa0_0,var(--color-navy)_55%,var(--color-navy-deep)_100%)] p-0 text-white backdrop:bg-ink/60"
    >
      <Confetti variant="burst" />
      <div className="relative z-20 mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <HoopRing total={total} done={total} size={200}>
          <span className="font-display text-6xl leading-none font-black">
            {total}/{total}
          </span>
        </HoopRing>
        {/* biome-ignore lint/performance/noImgElement: an animated SVG; next/image adds nothing here. */}
        <img src="/mascot/play.svg" alt="" className="relative -mt-8 w-44" draggable={false} />
        <h2 className="mt-2 font-display text-6xl leading-[0.9] font-black">Complete</h2>
        <p className="mt-3 text-white/85">{line}</p>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="mt-8 min-h-12 w-full rounded-xl bg-white font-semibold text-navy hover:bg-mist"
        >
          Done
        </button>
      </div>
    </dialog>
  );
}
