import type { TeamTheme } from "@/lib/club-colours";

/** A sleeveless footy guernsey, front on: round neck, shoulder straps, armholes, straight hem. */
const SHAPE =
  "M70 8 C84 26 116 26 130 8 L166 18 C158 44 160 66 178 84 L174 208 Q100 218 26 208 L22 84 C40 66 42 44 34 18 Z";
const NECK = "M70 8 C84 26 116 26 130 8";

/**
 * A club's guernsey: its design (and emblem, where it has one) from `src`, cut to a guernsey's shape, or
 * stripes of its colours when we don't have the design. `id` keeps each one's clip path unique on the page.
 */
export function Guernsey({
  id,
  src,
  theme,
  outline,
  className,
}: {
  id: string;
  src: string | null;
  theme: TeamTheme;
  /** The outline and collar colour, chosen to stand out from whatever the guernsey sits on. */
  outline: string;
  className?: string;
}) {
  const clip = `guernsey-${id}`;
  const stripe = 160 / theme.colours.length;
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={SHAPE} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {src ? (
          <image href={src} x="20" y="4" width="160" height="212" preserveAspectRatio="xMidYMid slice" />
        ) : (
          theme.colours.map((c, i) => <rect key={c} x={20 + i * stripe} y="0" width={stripe} height="220" fill={c} />)
        )}
      </g>
      <path d={SHAPE} fill="none" stroke={outline} strokeOpacity="0.55" strokeWidth="3" strokeLinejoin="round" />
      <path d={NECK} fill="none" stroke={outline} strokeOpacity="0.8" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
