import { isUs } from "@/lib/club";
import { cn } from "@/lib/cn";
import type { LadderRow } from "@/server/db/schema";

/*
 * Small charts for a team's page on the ladder. This team's marks wear its club colours, one solid colour per
 * chart (--team-bar), ours wear club navy, and every other team is a quiet grey. Numbers stay in ink, beside the
 * marks. Each chart says what it shows in words too (aria-label, and a title on each mark for hover).
 */

const OURS = "#28357c";

/** 1st, 2nd, 3rd, 11th */
export const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${s}`;
};

/** A titled chart block with its headline number or words on the right. */
function Chart({ title, value, children }: { title: string; value: string; children: React.ReactNode }) {
  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink/70">{title}</span>
        <span className="font-display text-2xl font-bold text-ink">{value}</span>
      </figcaption>
      {children}
    </figure>
  );
}

/** Won, drawn and lost as one bar split by games, with the counts written underneath. */
export function WinLoss({ row }: { row: LadderRow }) {
  const parts = [
    { label: "won", n: row.won, className: "bg-[var(--team-bar)]" },
    { label: "drawn", n: row.drawn, className: "bg-ink/35" },
    { label: "lost", n: row.lost, className: "bg-ink/12" },
  ].filter((p) => p.n > 0);
  const summary = parts.map((p) => `${p.n} ${p.label}`).join(", ");
  return (
    <Chart title="Results" value={`${row.won}-${row.lost}${row.drawn ? `-${row.drawn}` : ""}`}>
      {row.played === 0 ? (
        <p className="text-sm text-ink/60">No games yet.</p>
      ) : (
        <>
          <div className="flex h-5 gap-0.5" role="img" aria-label={`${row.played} games: ${summary}`}>
            {parts.map((p) => (
              <div
                key={p.label}
                title={`${p.n} ${p.label}`}
                className={cn("rounded", p.className)}
                style={{ flexGrow: p.n }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-sm text-ink/70">{summary}</p>
        </>
      )}
    </Chart>
  );
}

/** Every team's premiership points in ladder order, with this team and us picked out. */
export function LadderPoints({ row, rows }: { row: LadderRow; rows: LadderRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.premiershipPoints));
  const ours = rows.find((r) => isUs(r.team));
  const top = rows[0];
  const behind = top && top.team !== row.team ? top.premiershipPoints - row.premiershipPoints : 0;
  return (
    <Chart title="On the ladder" value={`${ordinal(row.position)} of ${rows.length}`}>
      <div
        className="flex h-20 items-end gap-px"
        role="img"
        aria-label={`Premiership points for every team in ladder order. ${row.team} is ${ordinal(row.position)} on ${row.premiershipPoints} points.`}
      >
        {rows.map((r) => {
          const me = r.team === row.team;
          const usBar = !me && isUs(r.team);
          return (
            <div
              key={r.position}
              title={`${ordinal(r.position)} ${r.team}, ${r.premiershipPoints} points`}
              className={cn("min-w-px flex-1 rounded-t-sm", !me && !usBar && "bg-ink/12")}
              style={{
                height: `${Math.max(4, (r.premiershipPoints / max) * 100)}%`,
                background: me ? "var(--team-bar)" : usBar ? OURS : undefined,
              }}
            />
          );
        })}
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-4 text-sm text-ink/70">
        <span>
          <span className="mr-1.5 inline-block size-2.5 rounded-sm bg-[var(--team-bar)] align-middle" aria-hidden />
          {row.premiershipPoints} points{behind > 0 ? `, ${behind} behind top` : top?.team === row.team ? ", top" : ""}
        </span>
        {ours && ours.team !== row.team && (
          <span>
            <span
              className="mr-1.5 inline-block size-2.5 rounded-sm align-middle"
              style={{ background: OURS }}
              aria-hidden
            />
            Us, {ordinal(ours.position)} on {ours.premiershipPoints}
          </span>
        )}
      </p>
    </Chart>
  );
}

/** Points for and against on one scale, each with a tick at the league average. */
export function Scoring({ row, rows }: { row: LadderRow; rows: LadderRow[] }) {
  const avg = (pick: (r: LadderRow) => number) => rows.reduce((t, r) => t + pick(r), 0) / Math.max(1, rows.length);
  const scale = Math.max(1, ...rows.flatMap((r) => [r.pointsFor, r.pointsAgainst]));
  const lines = [
    {
      label: "Points for",
      value: row.pointsFor,
      average: avg((r) => r.pointsFor),
      className: "bg-[var(--team-bar)]",
    },
    { label: "Points against", value: row.pointsAgainst, average: avg((r) => r.pointsAgainst), className: "bg-ink/30" },
  ];
  const diff = row.pointsFor - row.pointsAgainst;
  return (
    <Chart title="Scoring" value={`${diff > 0 ? "+" : ""}${diff}`}>
      <div className="space-y-2.5">
        {lines.map((l) => (
          <div key={l.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-ink/70">{l.label}</span>
              <span className="font-semibold tabular-nums">{l.value}</span>
            </div>
            <div
              className="relative h-3 rounded bg-chalk"
              role="img"
              aria-label={`${l.label} ${l.value}, league average ${Math.round(l.average)}`}
            >
              <div className={cn("h-full rounded", l.className)} style={{ width: `${(l.value / scale) * 100}%` }} />
              <div
                title={`League average ${Math.round(l.average)}`}
                className="absolute -inset-y-1 w-0.5 rounded bg-ink"
                style={{ left: `${(l.average / scale) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-sm text-ink/60">
        <span className="mr-1.5 inline-block h-3 w-0.5 rounded bg-ink align-middle" aria-hidden />
        League average
      </p>
    </Chart>
  );
}

/** Percentage (points for over against) against the 100% line where a team scores what it concedes. */
export function Percentage({ row, rows }: { row: LadderRow; rows: LadderRow[] }) {
  const scale = Math.max(150, ...rows.map((r) => r.percentage)) * 1.05;
  return (
    <Chart title="Percentage" value={`${row.percentage.toFixed(1)}%`}>
      <div
        className="relative h-3 rounded bg-chalk"
        role="img"
        aria-label={`Percentage ${row.percentage.toFixed(1)}, where 100 means scoring as much as they concede`}
      >
        <div
          className="h-full rounded bg-[var(--team-bar)]"
          style={{ width: `${(Math.min(row.percentage, scale) / scale) * 100}%` }}
        />
        <div className="absolute -inset-y-1 w-0.5 rounded bg-ink" style={{ left: `${(100 / scale) * 100}%` }} />
      </div>
      <p className="mt-1.5 text-sm text-ink/60">
        {row.percentage >= 100 ? "Scoring more than they concede" : "Conceding more than they score"} (line is 100%)
      </p>
    </Chart>
  );
}
