import { TZDate } from "@date-fns/tz";
import { addDays, differenceInCalendarDays, format, startOfWeek } from "date-fns";

export const CLUB_TZ = "Australia/Perth";

const inPerth = (d: Date | string | number) => new TZDate(new Date(d), CLUB_TZ);

/** "Sat 12 Apr" */
export const formatDay = (d: Date) => format(inPerth(d), "EEE d MMM");
/** "Saturday 12 April" */
export const formatLongDay = (d: Date) => format(inPerth(d), "EEEE d MMMM");
/** "2:10pm" */
export const formatTime = (d: Date) => format(inPerth(d), "h:mmaaa");
/** Ticket-stub parts: { weekday: "Sat", day: "12" } */
export const dayStub = (d: Date) => ({
  weekday: format(inPerth(d), "EEE"),
  day: format(inPerth(d), "d"),
});
/** Today's Perth calendar date, "2027-04-12" (for date-only columns). */
export const perthToday = (now = new Date()) => format(inPerth(now), "yyyy-MM-dd");
/** Monday of this week on the Perth calendar, "2027-04-12". A pin picked for the week is stored against it. */
export const perthWeekStart = (now = new Date()) =>
  format(startOfWeek(inPerth(now), { weekStartsOn: 1 }), "yyyy-MM-dd");
/** "2027-04-12" (date-only column) → "12 Apr" */
export const formatDateOnly = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return format(new Date(y, m - 1, d), "d MMM");
};
/** "April 2027" */
export const formatMonth = (d: Date) => format(inPerth(d), "MMMM yyyy");
/** "2025" */
export const formatYear = (d: Date) => format(inPerth(d), "yyyy");
/** Stable grouping key, "2027-04" */
export const monthKey = (d: Date) => format(inPerth(d), "yyyy-MM");
/** For <input type="datetime-local"> values in Perth time */
export const toLocalInput = (d: Date) => format(inPerth(d), "yyyy-MM-dd'T'HH:mm");

/** Parse a datetime-local value ("2027-04-12T14:10") as Perth wall-clock time. */
export function fromLocalInput(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error(`Invalid datetime: ${value}`);
  const [, y, mo, d, h, mi] = m.map(Number);
  return new Date(new TZDate(y, mo - 1, d, h, mi, CLUB_TZ).getTime());
}

/** Midnight on 1 January in Perth, this year: a PFL season runs within one calendar year. */
export const seasonStart = (now = new Date()) => fromLocalInput(`${perthToday(now).slice(0, 4)}-01-01T00:00`);

/** Perth wall-clock date at a given hour/minute. */
export function perthAt(day: Date, hour: number, minute = 0): Date {
  const p = inPerth(day);
  return new Date(new TZDate(p.getFullYear(), p.getMonth(), p.getDate(), hour, minute, CLUB_TZ).getTime());
}

/** "Today", "Tomorrow", "In 5 days", "3 days ago" relative to Perth calendar days. */
export function relativeDay(d: Date, now = new Date()): string {
  const diff = differenceInCalendarDays(inPerth(d), inPerth(now));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
}

/** Perth weekday (0 = Sunday) for a date. */
export const perthWeekday = (d: Date) => inPerth(d).getDay();

export { addDays };
