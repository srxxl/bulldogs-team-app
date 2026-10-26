import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { FeedbackForm, MarkReadButton } from "@/components/feedback-form";
import { Chip, EmptyState, PageHeader, Panel, SectionTitle } from "@/components/ui";
import { canManage } from "@/lib/roles";
import { formatDateOnly } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getFeedback } from "@/server/queries/content";
import { getSeason } from "@/server/queries/events";

export const metadata: Metadata = { title: "Anonymous notes" };

const KIND = {
  reflection: "Reflection",
  suggestion: "Suggestion",
  shoutout: "Shout-out",
} as const;

export default async function FeedbackPage() {
  const me = await requireMember();
  const coach = canManage(me.role);
  const [games, entries] = await Promise.all([getSeason(), coach ? getFeedback() : []]);
  const recentGames = games
    .filter((g) => g.kind === "game" && g.startsAt < new Date())
    .slice(-6)
    .reverse();

  return (
    <>
      <PageHeader
        title="Anonymous notes"
        intro="Reflect on a game, suggest something, or shout out a teammate. Coaches read these, but nobody can see who wrote them."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panel>
          <p className="mb-5 flex gap-3 rounded-2xl bg-mist p-3 text-sm text-navy">
            <ShieldCheck className="shrink-0" size={20} />
            Your name isn't saved with your note, and neither is the time you sent it, only the date.
          </p>
          <FeedbackForm
            games={recentGames.map((g) => ({
              id: g.id,
              label: [g.round, g.title].filter(Boolean).join(", "),
            }))}
          />
        </Panel>
        {coach && (
          <section>
            <SectionTitle>Inbox</SectionTitle>
            {entries.length === 0 ? (
              <EmptyState title="Nothing yet">Notes from the team will show up here.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {entries.map((f) => (
                  <li
                    key={f.id}
                    className={
                      f.readByCoach ? "rounded-2xl bg-white/60 p-4" : "rounded-2xl bg-white p-4 ring-2 ring-navy"
                    }
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink/60">
                      <Chip className={f.kind === "shoutout" ? "bg-red text-white" : undefined}>{KIND[f.kind]}</Chip>
                      {f.eventTitle && <span>{[f.eventRound, f.eventTitle].filter(Boolean).join(", ")}</span>}
                      <span>{formatDateOnly(f.submittedOn)}</span>
                      {!f.readByCoach && <MarkReadButton id={f.id} />}
                    </div>
                    <p className="whitespace-pre-line text-ink/85">{f.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  );
}
