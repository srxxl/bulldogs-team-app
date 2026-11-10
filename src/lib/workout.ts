/** Logging the week's picked workouts and runs: reading what people type, and showing it back. */

/**
 * A time as people type it: "32" (minutes), "32:15" (minutes and seconds) or "1:02:30" (hours too).
 * Returns seconds, or null if it doesn't read as a time.
 */
export function parseDuration(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const [a, b, c] = parts.map(Number);
  if (parts.length === 1) return a * 60;
  if (b >= 60 || (c ?? 0) >= 60) return null;
  return parts.length === 2 ? a * 60 + b : a * 3600 + b * 60 + c;
}

/** "5.2 km", "10 km", or "800 m" under a kilometre. */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  const km = Math.round(metres / 100) / 10;
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}

const two = (n: number) => String(n).padStart(2, "0");

/** "32:15", or "1:02:30" past an hour. */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${two(m)}:${two(s % 60)}` : `${m}:${two(s % 60)}`;
}

/** Pace per kilometre, "6:12 /km", when there's enough distance for it to mean something. */
export function formatPace(metres: number, seconds: number): string | null {
  if (metres < 500 || seconds <= 0) return null;
  return `${formatDuration(seconds / (metres / 1000))} /km`;
}

/** How many people logged it, and the distance and time between them. */
export function teamTotals(rows: { userId: string; distanceM: number | null; durationS: number | null }[]) {
  return {
    people: new Set(rows.map((r) => r.userId)).size,
    distanceM: rows.reduce((t, r) => t + (r.distanceM ?? 0), 0),
    durationS: rows.reduce((t, r) => t + (r.durationS ?? 0), 0),
  };
}
