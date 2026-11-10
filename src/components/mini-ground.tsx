import { FIELD_SLOTS, sideways } from "@/lib/positions";
import { GROUND_LABEL_ROOM, GROUND_M, GroundLines } from "./ground-lines";

const W = GROUND_M.width;
const H = GROUND_M.height;
const SIDE = GROUND_LABEL_ROOM;
const PAD = 4;

/**
 * The team board in miniature: the whiteboard ground (GroundLines) with a magnet per position. With `labels`,
 * each picked spot shows the player's initials (yours in red), like a tiny team sheet; without, they're plain
 * dots and yours gets a "You" tag. Empty spots are dashed rings.
 */
export function MiniGround({
  id,
  players,
  mine,
  labels,
  className,
}: {
  /** Unique on the page: names the ground's clip. */
  id: string;
  /** Initials by slot id, for the spots with someone in them. */
  players: Record<string, string>;
  /** Your slot, if you're on the ground. */
  mine?: string;
  labels?: boolean;
  className?: string;
}) {
  const at = (s: { x: number; y: number }) => {
    const p = sideways(s);
    return { cx: p.x * W, cy: p.y * H };
  };
  const me = FIELD_SLOTS.find((s) => s.id === mine);
  const r = labels ? 7.6 : 4.4;
  return (
    <svg viewBox={`${-SIDE} ${-PAD} ${W + SIDE * 2} ${H + PAD * 2}`} className={className} aria-hidden>
      <GroundLines id={id} />
      {FIELD_SLOTS.map((s) => {
        const { cx, cy } = at(s);
        const isMe = s.id === mine;
        if (!players[s.id])
          return (
            <circle
              key={s.id}
              cx={cx}
              cy={cy}
              r={labels ? 6.5 : 4}
              fill="none"
              className="stroke-navy/40"
              strokeWidth={1}
              strokeDasharray="2 1.6"
            />
          );
        return (
          <g key={s.id}>
            {/* a navy magnet, red for you */}
            <circle cx={cx} cy={cy + 0.9} r={r} className="fill-ink/20" />
            <circle
              cx={cx}
              cy={cy}
              r={isMe && !labels ? r + 1 : r}
              className={isMe ? "fill-red stroke-white" : "fill-navy stroke-white"}
              strokeWidth={1}
            />
            {labels && (
              <text
                x={cx}
                y={cy + 2.6}
                textAnchor="middle"
                className="fill-white"
                style={{ font: "800 7.4px var(--font-display)" }}
              >
                {players[s.id]}
              </text>
            )}
          </g>
        );
      })}
      {/* without names, a tag on your spot */}
      {me &&
        !labels &&
        (() => {
          const { cx, cy } = at(me);
          const top = cy - 19;
          return (
            <g>
              <rect x={cx - 11} y={top} width={22} height={11} rx={5.5} className="fill-red" />
              <path
                d={`M${cx - 2.4} ${top + 10.5} L${cx} ${top + 13.2} L${cx + 2.4} ${top + 10.5} Z`}
                className="fill-red"
              />
              <text
                x={cx}
                y={top + 7.8}
                textAnchor="middle"
                className="fill-white"
                style={{ font: "700 6.6px var(--font-sans)" }}
              >
                You
              </text>
            </g>
          );
        })()}
    </svg>
  );
}
