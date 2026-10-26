import { Pin } from "lucide-react";
import type { Metadata } from "next";
import { DeleteNoteButton, NoteForm } from "@/components/note-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { canLead, canModerate } from "@/lib/roles";
import { formatDay } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getNotes } from "@/server/queries/content";

export const metadata: Metadata = { title: "Coach's notes" };

export default async function NotesPage() {
  const me = await requireMember();
  const notes = await getNotes();
  return (
    <>
      <PageHeader
        title="Notes from the coaches"
        intro="The week's focus, reminders and messages from the coaches and captains."
      >
        {canLead(me.role) && <NoteForm />}
      </PageHeader>
      {notes.length === 0 ? (
        <EmptyState title="No notes yet">The coaches' weekly notes will show up here.</EmptyState>
      ) : (
        <ol className="space-y-4">
          {notes.map((n) => (
            <li key={n.id}>
              <article className="rounded-[28px] bg-white p-5 md:p-8">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ink/60">
                    {n.role === "captain" ? "Captain" : "Coach"} {n.preferredName || n.name}, {formatDay(n.createdAt)}
                  </p>
                  <div className="flex items-center gap-1">
                    {n.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red px-2.5 py-0.5 text-xs font-bold text-white">
                        <Pin size={12} /> On home
                      </span>
                    )}
                    {(n.authorId === me.id || canModerate(me)) && <DeleteNoteButton id={n.id} />}
                  </div>
                </div>
                <h2 className="mt-2 text-4xl font-extrabold text-navy">{n.title}</h2>
                <p className="mt-3 max-w-prose whitespace-pre-line text-ink/85">{n.body}</p>
              </article>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
