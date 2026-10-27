import { noteRole } from "@/lib/roles";
import { formatDay } from "@/lib/time";
import type { GameNote } from "@/server/queries/content";
import { DeleteNoteButton, NoteForm } from "./note-form";

/** Notes for one game, newest first, with "Write a note" for captains, coaches and admins. */
export function GameNotes({
  eventId,
  notes,
  canWrite,
  canDelete,
}: {
  eventId: string;
  notes: GameNote[];
  canWrite: boolean;
  /** Whether this viewer may delete a given note (author, coach or admin). */
  canDelete: (n: GameNote) => boolean;
}) {
  return (
    <div className="space-y-4">
      {canWrite && <NoteForm eventId={eventId} />}
      {notes.length === 0 ? (
        <p className="text-sm text-ink/60">
          {canWrite ? "No notes for this game yet." : "The coaches haven't written a note for this game yet."}
        </p>
      ) : (
        <ol className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl bg-chalk p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink/60">
                  {[noteRole(n.role), n.preferredName || n.name].filter(Boolean).join(" ")}, {formatDay(n.createdAt)}
                </p>
                {canDelete(n) && <DeleteNoteButton id={n.id} />}
              </div>
              <h3 className="mt-1 text-2xl font-bold text-navy">{n.title}</h3>
              <p className="mt-2 max-w-prose whitespace-pre-line text-ink/85">{n.body}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
