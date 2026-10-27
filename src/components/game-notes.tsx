import { leaderBadge } from "@/lib/roles";
import { formatDay } from "@/lib/time";
import type { GameNote } from "@/server/queries/content";
import { DeleteNoteButton } from "./note-form";

/** Notes for one game, newest first. Skips and coaches get a red badge. */
export function GameNotes({
  notes,
  canDelete,
}: {
  notes: GameNote[];
  /** Whether this viewer may delete a given note (author, coach or admin). */
  canDelete: (n: GameNote) => boolean;
}) {
  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <p className="text-sm text-ink/60">No notes for this game yet. Share a reminder, a plan or a shout-out.</p>
      ) : (
        <ol className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl bg-chalk p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
                  <span className="font-semibold text-ink">{n.preferredName || n.name}</span>
                  {leaderBadge(n.role) && (
                    <span className="rounded-full bg-red px-2 py-0.5 text-xs font-bold text-white">
                      {leaderBadge(n.role)}
                    </span>
                  )}
                  <span>{formatDay(n.createdAt)}</span>
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
