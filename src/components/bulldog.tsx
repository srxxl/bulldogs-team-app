/**
 * A tiny original bulldog mascot (white pup, red spiked collar: a nod to the crest).
 * Pure SVG; animation comes from CSS classes on the parent (see .pup-* in globals.css).
 */

const NAVY = "#28357c";
const RED = "#d32427";
const WHITE = "#ffffff";
const stroke = { stroke: NAVY, strokeWidth: 2.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Side view, facing right. `asleep` lies him down with closed eyes. */
export function BulldogSide({ asleep = false, className }: { asleep?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 72 52" className={className} aria-hidden>
      {/* tail */}
      <path d="M12 24 q-6 -4 -4 -9" fill="none" {...stroke} className="pup-tail" />
      {/* back legs, front legs (hidden when asleep) */}
      {!asleep && (
        <g className="pup-legs" fill={WHITE} {...stroke}>
          <rect className="pup-leg-a" x="15" y="31" width="7" height="13" rx="3.5" />
          <rect className="pup-leg-b" x="23" y="31" width="7" height="13" rx="3.5" />
          <rect className="pup-leg-b" x="38" y="31" width="7" height="13" rx="3.5" />
          <rect className="pup-leg-a" x="46" y="31" width="7" height="13" rx="3.5" />
        </g>
      )}
      <g transform={asleep ? "translate(0 9)" : undefined}>
        {/* body with a navy back patch */}
        <rect x="11" y="17" width="42" height="21" rx="10.5" fill={WHITE} {...stroke} />
        <path d="M20 18.5 q7 -2 13 0 q-1 7 -7 8 q-6 -1 -6 -8z" fill={NAVY} />
        {/* collar with studs */}
        <path d="M45 15 l4 23" stroke={RED} strokeWidth="5" strokeLinecap="round" />
        <circle cx="46" cy="21" r="1.1" fill={WHITE} />
        <circle cx="47.3" cy="27" r="1.1" fill={WHITE} />
        <circle cx="48.6" cy="33" r="1.1" fill={WHITE} />
        {/* head */}
        <g className="pup-head">
          <path d="M50 8 q-3 -6 -8 -3 q1 6 5 8z" fill={NAVY} {...stroke} />
          <circle cx="55" cy="19" r="12.5" fill={WHITE} {...stroke} />
          {/* muzzle + jowls */}
          <path d="M57 21 q8 -3 11 2 q1 7 -6 8 q-5 0 -6 -3" fill={WHITE} {...stroke} />
          <ellipse cx="66.5" cy="21.5" rx="2.6" ry="2" fill={NAVY} />
          <path d="M60 28 q3 2 6 0" fill="none" {...stroke} strokeWidth="1.8" />
          {asleep ? (
            <path d="M53 16.5 q2.5 2 5 0" fill="none" {...stroke} strokeWidth="2" />
          ) : (
            <g className="pup-eye">
              <circle cx="56" cy="16" r="2.2" fill={NAVY} />
              <circle cx="56.8" cy="15.2" r="0.7" fill={WHITE} />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

/** Front view of head and paws, for peeking up over the bottom edge. */
export function BulldogFront({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 50" className={className} aria-hidden>
      <g className="pup-head">
        {/* ears */}
        <path d="M11 13 q-6 -8 -1 -11 q7 1 9 8z" fill={NAVY} {...stroke} />
        <path d="M45 13 q6 -8 1 -11 q-7 1 -9 8z" fill={NAVY} {...stroke} />
        {/* head */}
        <ellipse cx="28" cy="22" rx="18" ry="16" fill={WHITE} {...stroke} />
        {/* eye patch on one side */}
        <ellipse cx="20" cy="18" rx="6" ry="5.5" fill={NAVY} opacity="0.9" />
        <g className="pup-eye">
          <circle cx="20" cy="18.5" r="2.4" fill={WHITE} />
          <circle cx="20.4" cy="18.8" r="1.4" fill={NAVY} />
          <circle cx="35" cy="18.5" r="2.4" fill={NAVY} />
          <circle cx="35.8" cy="17.7" r="0.8" fill={WHITE} />
        </g>
        {/* muzzle, nose, underbite */}
        <ellipse cx="28" cy="29" rx="10" ry="7" fill={WHITE} {...stroke} />
        <ellipse cx="28" cy="25.5" rx="3.6" ry="2.6" fill={NAVY} />
        <path d="M22 31 q6 4 12 0" fill="none" {...stroke} strokeWidth="1.8" />
        <path d="M25 31.8 v-1.6 M31 31.8 v-1.6" {...stroke} strokeWidth="1.4" />
      </g>
      {/* collar + paws on the ledge */}
      <path d="M13 37 q15 6 30 0" fill="none" stroke={RED} strokeWidth="5" strokeLinecap="round" />
      <circle cx="21" cy="39.6" r="1.1" fill={WHITE} />
      <circle cx="28" cy="40.6" r="1.1" fill={WHITE} />
      <circle cx="35" cy="39.6" r="1.1" fill={WHITE} />
      <ellipse cx="17" cy="46" rx="6" ry="4" fill={WHITE} {...stroke} />
      <ellipse cx="39" cy="46" rx="6" ry="4" fill={WHITE} {...stroke} />
    </svg>
  );
}

/** A little Sherrin for the chase. */
export function Footy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <ellipse cx="12" cy="8" rx="10.5" ry="6.5" fill={RED} stroke={NAVY} strokeWidth="1.8" />
      <path d="M8 8 h8 M10 6.5 v3 M12 6.5 v3 M14 6.5 v3" stroke={WHITE} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
