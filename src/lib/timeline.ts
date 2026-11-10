import { z } from "zod";

/**
 * A game day's timeline, from arriving to bounce. Each step is stored as minutes before bounce (not a clock
 * time), so it follows the game if its start time changes. A game with no timeline of its own uses DEFAULT.
 */
export type Step = { label: string; minutesBefore: number };

export const DEFAULT_TIMELINE: Step[] = [
  { label: "Arrive", minutesBefore: 90 },
  { label: "Free time", minutesBefore: 85 },
  { label: "Coach's talk in the rooms", minutesBefore: 60 },
  { label: "Line meetings", minutesBefore: 50 },
  { label: "Team warm-up", minutesBefore: 40 },
  { label: "Free time", minutesBefore: 25 },
  { label: "Drills and kicking", minutesBefore: 20 },
  { label: "Free time", minutesBefore: 8 },
  { label: "Bounce down", minutesBefore: 0 },
];

/** What a saved timeline must look like: 1 to 20 named steps, each between 4 hours before bounce and bounce. */
export const timelineSchema = z
  .array(
    z.object({
      label: z.string().trim().min(1, "Every step needs a name").max(60, "Keep step names to a line or two"),
      minutesBefore: z
        .number()
        .int()
        .min(0, "Steps can't be after bounce")
        .max(240, "Keep it within 4 hours of bounce"),
    }),
  )
  .min(1, "Add at least one step")
  .max(20, "That's a lot of steps; keep it to 20");

/** The game's own timeline if it has one (and it's valid), otherwise the default; earliest step first. */
export function timelineFor(saved: unknown): Step[] {
  const parsed = timelineSchema.safeParse(saved);
  return sortSteps(parsed.success ? parsed.data : DEFAULT_TIMELINE);
}

/** Free time between the planned steps ("Free time", "Free" or "Own time"); the timeline sets it quieter. */
export const isOwnTime = (label: string) => /^(free|own time|free time)$/i.test(label.trim());

export const sortSteps = (steps: Step[]) => [...steps].sort((a, b) => b.minutesBefore - a.minutesBefore);

/** When each step starts, and when it ends (the next step's start; bounce ends nothing). */
export function scheduled(steps: Step[], bounce: Date) {
  const sorted = sortSteps(steps);
  return sorted.map((s, i) => ({
    ...s,
    at: new Date(bounce.getTime() - s.minutesBefore * 60_000),
    until: i < sorted.length - 1 ? new Date(bounce.getTime() - sorted[i + 1].minutesBefore * 60_000) : null,
  }));
}

/** Which step is happening at `now` (index), or null outside the timeline. */
export function currentStep(steps: Step[], bounce: Date, now: Date): number | null {
  const s = scheduled(steps, bounce);
  if (s.length === 0 || now < s[0].at || now >= new Date(bounce.getTime() + 60_000)) return null;
  for (let i = s.length - 1; i >= 0; i--) if (now >= s[i].at) return i;
  return null;
}

/** Same steps as the default, so there's nothing to reset. */
export const isDefault = (steps: Step[]) =>
  JSON.stringify(sortSteps(steps)) === JSON.stringify(sortSteps(DEFAULT_TIMELINE));
