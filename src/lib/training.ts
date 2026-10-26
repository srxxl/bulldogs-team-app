import { addDays, perthAt, perthWeekday } from "./time";

export const TRAINING = {
  weekdays: [2, 4], // Tuesday, Thursday
  startHour: 18,
  endHour: 19,
  endMinute: 30,
  venueName: "Karoonda Reserve, Oval 2 (West)",
  venueAddress: "Karoonda Reserve, Booragoon WA 6154",
} as const;

/** Training session start/end times in the next `days` days (Perth calendar). */
export function upcomingTrainingSlots(from: Date, days: number) {
  const slots: { startsAt: Date; endsAt: Date }[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(from, i);
    if (!(TRAINING.weekdays as readonly number[]).includes(perthWeekday(day))) continue;
    const startsAt = perthAt(day, TRAINING.startHour);
    if (startsAt <= from) continue;
    slots.push({
      startsAt,
      endsAt: perthAt(day, TRAINING.endHour, TRAINING.endMinute),
    });
  }
  return slots;
}
