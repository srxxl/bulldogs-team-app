import { requireMember } from "@/server/auth/session";
import { getEvent } from "@/server/queries/events";

const ics = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/** Single-event .ics so players can drop a game into their own calendar. */
export async function GET(_req: Request, ctx: RouteContext<"/fixture/[id]/calendar.ics">) {
  await requireMember();
  const ev = await getEvent((await ctx.params).id);
  if (!ev) return new Response("Not found", { status: 404 });
  const end = ev.endsAt ?? new Date(ev.startsAt.getTime() + 2 * 3600_000);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bulldogs//Team app//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@bulldogs`,
    `DTSTAMP:${ics(new Date())}`,
    `DTSTART:${ics(ev.startsAt)}`,
    `DTEND:${ics(end)}`,
    `SUMMARY:${esc(`Bulldogs ${ev.title}`)}`,
    ev.venueAddress || ev.venueName ? `LOCATION:${esc(ev.venueAddress ?? ev.venueName ?? "")}` : "",
    ev.details ? `DESCRIPTION:${esc(ev.details)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="bulldogs-${ev.id}.ics"`,
    },
  });
}
