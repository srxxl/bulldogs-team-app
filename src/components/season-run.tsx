import Link from "next/link";
import { clubGuernsey, teamTheme } from "@/lib/club-colours";
import { cn } from "@/lib/cn";
import type { RunSlot } from "@/lib/season-run";
import { Guernsey } from "./guernsey";

/**
 * Round-by-round margins: a slot per round (or game), with a bar up from the line for a win and down for a
 * loss, as long as the margin. Byes are marked, games still to come are empty outlines, and the next one is
 * outlined in red. Each game's slot links to it.
 */
export function SeasonRun({
  slots,
  stats,
  winColour = "var(--color-navy)",
  lossColour = "var(--color-red)",
  caption,
}: {
  slots: RunSlot[];
  /** Headline numbers across the top, e.g. ladder position, won-lost-drawn and percentage. */
  stats?: { label: string; value: string }[];
  /** The colour of a win bar (navy on ours; the club's colour on other teams' pages). */
  winColour?: string;
  /** The colour of a loss bar (red, or the opponent's colour when it's their win against us). */
  lossColour?: string;
  caption: string;
}) {
  const biggest = Math.max(1, ...slots.map((s) => (s.kind === "played" ? Math.abs(s.margin) : 0)));
  const RESULT_CLASS = { W: "text-navy", L: "text-red", D: "text-navy" } as const;
  return (
    <figure className="m-0">
      {stats && (
        <div className="mb-5 flex flex-wrap justify-between gap-x-6 gap-y-3">
          {stats.map((s, i) => (
            <div key={s.label} className={cn(i === stats.length - 1 && stats.length > 2 && "text-right")}>
              <p className="text-sm font-semibold text-ink/60">{s.label}</p>
              <p className="display-num text-5xl font-extrabold text-ink md:text-6xl">{s.value}</p>
            </div>
          ))}
        </div>
      )}
      <ol className="flex gap-1">
        {slots.map((s) => {
          const outline = s.kind === "upcoming" || s.kind === "unscored";
          const half = s.kind === "played" ? Math.max(6, (Math.abs(s.margin) / biggest) * 100) : 0;
          const title =
            s.kind === "played"
              ? `${s.label}${s.opponent ? ` vs ${s.opponent}` : ""}: ${s.result === "D" ? "drawn" : `${s.result === "W" ? "won" : "lost"} by ${Math.abs(s.margin)}`}`
              : s.kind === "bye"
                ? `${s.label}: bye`
                : s.kind === "upcoming"
                  ? `${s.label}${s.opponent ? ` vs ${s.opponent}` : ""}: ${s.next ? "next game" : "to come"}`
                  : `${s.label}: no score yet`;
          const body = (
            <>
              <span className="relative block h-28">
                {/* the line through the middle, with the bar above (win) or below (loss) it */}
                <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-powder" />
                {s.kind === "played" && s.margin !== 0 && (
                  <span
                    className={cn(
                      "absolute inset-x-[18%]",
                      s.margin > 0 ? "bottom-1/2 rounded-t-md" : "top-1/2 rounded-b-md",
                    )}
                    style={{ height: `${half / 2}%`, background: s.margin > 0 ? winColour : lossColour }}
                  />
                )}
                {s.kind === "played" && s.margin === 0 && (
                  <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rounded-full bg-navy" />
                )}
              </span>
              <span className="mt-1 block text-center leading-tight">
                <span
                  className={cn(
                    "block font-display text-lg font-bold",
                    s.kind === "played" ? RESULT_CLASS[s.result] : "text-ink/50",
                    s.kind === "bye" && "text-sm",
                  )}
                >
                  {s.kind === "played" ? s.result : s.kind === "bye" ? "Bye" : " "}
                </span>
                <span className="block text-xs text-ink/60 tabular-nums">{s.label}</span>
                {/* who we played that round */}
                {"opponent" in s && s.opponent && (
                  <Guernsey
                    id={`run-${s.key}`}
                    src={clubGuernsey(s.opponent)}
                    theme={teamTheme(s.opponent)}
                    outline="#151b45"
                    className="mx-auto mt-1 w-6 md:w-8"
                  />
                )}
              </span>
            </>
          );
          const box = cn(
            "block min-w-0 flex-1 rounded-xl pb-1",
            outline && "border-2",
            outline && (s.kind === "upcoming" && s.next ? "border-red" : "border-powder"),
          );
          return (
            <li key={s.key} className="min-w-0 flex-1">
              {"id" in s ? (
                <Link href={s.href} title={title} aria-label={title} className={cn(box, "hover:bg-chalk")}>
                  {body}
                </Link>
              ) : (
                <span title={title} className={box}>
                  <span className="sr-only">{title}</span>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-3 text-sm text-ink/60">{caption}</figcaption>
    </figure>
  );
}
