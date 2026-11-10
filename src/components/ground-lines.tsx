/**
 * The ground as a coach's whiteboard, from above and on its side (forwards on the right), to scale in metres:
 * white surface, navy boundary, the 50 m arcs, centre square and circles, goal squares and posts, and Back and
 * Forward at the ends so you can tell which way we're kicking. Draw it inside an SVG whose oval spans
 * 0 to GROUND_M.width across and 0 to GROUND_M.height down; the end labels sit just outside, so leave room
 * (or `overflow: visible`).
 */
export const GROUND_M = { width: 165, height: 132 } as const;
/** Room either side for the Back and Forward labels, in the same units. */
export const GROUND_LABEL_ROOM = 12;

const W = GROUND_M.width;
const H = GROUND_M.height;
const CX = W / 2;
const CY = H / 2;

export function GroundLines({ id }: { id: string }) {
  const clip = `${id}-clip`;
  const posts = (x: number) =>
    [-9.6, -3.2, 3.2, 9.6].map((d, i) => (
      <circle key={d} cx={x} cy={CY + d} r={i === 1 || i === 2 ? 1.2 : 0.85} className="fill-navy" />
    ));
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <ellipse cx={CX} cy={CY} rx={W / 2} ry={H / 2} />
        </clipPath>
      </defs>
      <ellipse cx={CX} cy={CY} rx={W / 2} ry={H / 2} fill="#fbfcff" />
      <g fill="none" className="stroke-navy" strokeOpacity={0.5} strokeWidth={0.8} clipPath={`url(#${clip})`}>
        <rect x={CX - 25} y={CY - 25} width={50} height={50} />
        <circle cx={CX} cy={CY} r={5} />
        <circle cx={CX} cy={CY} r={1.5} />
        <circle cx={1} cy={CY} r={50} />
        <circle cx={W - 1} cy={CY} r={50} />
        <rect x={1} y={CY - 3.2} width={9} height={6.4} />
        <rect x={W - 10} y={CY - 3.2} width={9} height={6.4} />
      </g>
      <ellipse
        cx={CX}
        cy={CY}
        rx={W / 2 - 0.8}
        ry={H / 2 - 0.8}
        fill="none"
        className="stroke-navy"
        strokeWidth={1.6}
      />
      {posts(1)}
      {posts(W - 1)}
      <g className="fill-ink/50" style={{ font: "700 6.5px var(--font-sans)" }} textAnchor="middle">
        <text transform={`translate(${-GROUND_LABEL_ROOM / 2 + 1} ${CY}) rotate(-90)`}>Back</text>
        <text transform={`translate(${W + GROUND_LABEL_ROOM / 2 - 1} ${CY}) rotate(90)`}>Forward</text>
      </g>
    </g>
  );
}
