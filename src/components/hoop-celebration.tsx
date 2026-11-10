"use client";

import Link from "next/link";
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

  const line =
    streak > 1
      ? `That's ${WORDS[streak] ?? streak} weeks in a row.`
      : "Your first week in a row. Keep it going next week.";

  return (
    <dialog
      ref={ref}
      aria-label="Hoop closed"
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
        <h2 className="mt-2 font-display text-6xl leading-[0.9] font-black">Hoop closed</h2>
        <p className="mt-3 text-white/85">{line}</p>
        <div className="mt-8 grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="min-h-12 rounded-xl border-2 border-white/40 font-semibold hover:border-white"
          >
            Done
          </button>
          <Link
            href="/boards/team"
            onClick={() => ref.current?.close()}
            className="grid min-h-12 place-items-center rounded-xl bg-white font-semibold text-navy hover:bg-mist"
          >
            See the team
          </Link>
        </div>
      </div>
    </dialog>
  );
}
