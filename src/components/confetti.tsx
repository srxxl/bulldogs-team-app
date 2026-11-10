"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const COLOURS = ["var(--color-red)", "#fff", "var(--color-powder)", "var(--color-navy)"];

type Piece = {
  left: number;
  size: number;
  colour: string;
  duration: number;
  delay: number;
  sway: number;
  round: boolean;
};

/** Random pieces, made after mount so the server and the browser never disagree about them. */
function makePieces(count: number, slow: boolean): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    size: slow ? 8 + Math.random() * 10 : 6 + Math.random() * 6,
    colour: COLOURS[i % COLOURS.length],
    duration: slow ? 14 + Math.random() * 12 : 2.2 + Math.random() * 1.6,
    // the background kind starts mid-fall, so the screen isn't empty at first
    delay: slow ? -Math.random() * 26 : Math.random() * 0.6,
    sway: (Math.random() - 0.5) * (slow ? 120 : 80),
    round: Math.random() < 0.3,
  }));
}

/**
 * Club-colour confetti. `burst` falls once over everything (closing your hoop); `ambient` drifts slowly and
 * blurred behind the page, forever (a game we won). Nothing at all with reduced motion. Only ever a sibling of
 * page content, never wrapped around it: the pieces move with transforms.
 */
export function Confetti({ variant }: { variant: "burst" | "ambient" }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPieces(makePieces(variant === "ambient" ? 48 : 70, variant === "ambient"));
  }, [variant]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 overflow-hidden",
        variant === "ambient" ? "-z-[1] confetti-ambient" : "z-10",
      )}
    >
      {pieces.map((p, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: pieces never reorder
          key={i}
          className={cn("confetti-piece absolute top-0", p.round ? "rounded-full" : "rounded-[2px]")}
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 1.8,
              background: p.colour,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              animationIterationCount: variant === "ambient" ? "infinite" : 1,
              "--sway": `${p.sway}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
