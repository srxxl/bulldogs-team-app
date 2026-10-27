"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createNote, deleteNote } from "@/server/actions/content";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "./forms";
import { Sheet } from "./sheet";

/** "Write a note" for one game. Anyone in the squad. */
export function NoteForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createNote, null);
  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);
  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Write a note"
      trigger={
        <>
          <Plus size={18} /> Write a note
        </>
      }
    >
      <form action={action} className="space-y-4">
        <input type="hidden" name="eventId" value={eventId} />
        <Field label="Title" name="title" state={state}>
          <Input name="title" required maxLength={100} placeholder="Win the contested ball" state={state} />
        </Field>
        <Field label="Note" name="body" state={state}>
          <Textarea name="body" required rows={8} maxLength={4000} state={state} />
        </Field>
        <FormMessage state={state && !state.ok ? state : null} />
        <SubmitButton pending="Posting…" className="w-full">
          Post note
        </SubmitButton>
      </form>
    </Sheet>
  );
}

export function DeleteNoteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label="Delete note"
      disabled={pending}
      onClick={() => confirm("Delete this note?") && start(async () => void (await deleteNote(id)))}
      className="-my-2.5 -mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-ink/50 hover:bg-mist hover:text-red"
    >
      <Trash2 size={16} />
    </button>
  );
}
