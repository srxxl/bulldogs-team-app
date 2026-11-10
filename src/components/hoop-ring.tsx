import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const R = 50;
const W = 14;

/**
 * Your hoop for the week: a ring with one segment per pick. A done segment is drawn as the club's hoop band
 * (red, white, red); one still to do is a faint segment. `tone` is the surface it sits on.
 */
export function HoopRing({
  total,
  done,
  size = 132,
  tone = "dark",
  children,
  className,
}: {
  total: number;
  done: number;
  size?: number;
  tone?: "dark" | "light";
  /** What sits in the middle, e.g. "2/3". */
  children?: ReactNode;
  className?: string;
}) {
  const gap = total > 1 ? 3 : 0;
  const seg = total > 0 ? 100 / total : 100;
  const faint = tone === "dark" ? "rgb(255 255 255 / 0.16)" : "rgb(40 53 124 / 0.13)";
  const arc = (i: number) => ({
    pathLength: 100,
    strokeDasharray: `${seg - gap} ${100 - seg + gap}`,
    strokeDashoffset: -(i * seg) - gap / 2,
  });
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        {total === 0 && <circle cx="60" cy="60" r={R} fill="none" stroke={faint} strokeWidth={W} />}
        {Array.from({ length: total }, (_, i) => {
          const key = `seg-${i}`;
          return i < done ? (
            <g key={key}>
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-red)" strokeWidth={W} {...arc(i)} />
              <circle cx="60" cy="60" r={R} fill="none" stroke="#fff" strokeWidth={W * 0.34} {...arc(i)} />
            </g>
          ) : (
            <circle key={key} cx="60" cy="60" r={R} fill="none" stroke={faint} strokeWidth={W} {...arc(i)} />
          );
        })}
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  );
}
