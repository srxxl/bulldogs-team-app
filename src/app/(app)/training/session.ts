import { formatTime, perthAt } from "@/lib/time";
import { TRAINING } from "@/lib/training";

/** A session at the usual time and place, which the Training page's intro already says. */
export const usual = (s: { startsAt: Date; endsAt: Date | null; venueName: string | null }) =>
  formatTime(s.startsAt) === formatTime(perthAt(s.startsAt, TRAINING.startHour)) &&
  s.endsAt != null &&
  formatTime(s.endsAt) === formatTime(perthAt(s.endsAt, TRAINING.endHour, TRAINING.endMinute)) &&
  (s.venueName ?? TRAINING.venueName) === TRAINING.venueName;

/** "6pm to 7:30pm, Karoonda Reserve Oval 2 (West)" */
export const whenWhere = (s: { startsAt: Date; endsAt: Date | null; venueName: string | null }) =>
  `${formatTime(s.startsAt)}${s.endsAt ? ` to ${formatTime(s.endsAt)}` : ""}, ${s.venueName ?? TRAINING.venueName}`;
