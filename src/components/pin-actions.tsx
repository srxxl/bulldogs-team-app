"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createPin, deletePin } from "@/server/actions/content";
import type { Board } from "@/server/db/schema";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "./forms";
import { Sheet } from "./sheet";

export function AddPinSheet({ board, label, tags }: { board: Board; label: string; tags: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createPin, null);
  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title={label}
      trigger={
        <>
          <Plus size={18} /> {label}
        </>
      }
    >
      <form action={action} className="space-y-4">
        <input type="hidden" name="board" value={board} />
        <Field label="Title" name="title" state={state}>
          <Input name="title" required maxLength={100} state={state} />
        </Field>
        <Field label="Details" name="body" state={state} hint="Recipe, sets and reps, why you love it…">
          <Textarea name="body" maxLength={1500} state={state} />
        </Field>
        <Field label="Link" name="link" state={state} hint="Optional. YouTube, Instagram, a recipe site.">
          <Input name="link" type="url" inputMode="url" placeholder="https://" state={state} />
        </Field>
        <Field label="Photo" name="image" state={state} hint="Optional, up to 5 MB">
          <Input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-mist file:px-3 file:py-1.5 file:font-semibold file:text-navy"
          />
        </Field>
        <Field label="Tag" name="tag" state={state}>
          <Input name="tag" list={`${board}-tags`} maxLength={24} state={state} />
          <datalist id={`${board}-tags`}>
            {tags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <FormMessage state={state && !state.ok ? state : null} />
        <SubmitButton pending="Pinning…" className="w-full">
          Pin it
        </SubmitButton>
      </form>
    </Sheet>
  );
}

export function DeletePinButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label="Remove pin"
      disabled={pending}
      onClick={() => confirm("Remove this pin?") && start(async () => void (await deletePin(id)))}
      className="-m-2 grid size-9 place-items-center rounded-lg opacity-60 hover:opacity-100 disabled:opacity-30"
    >
      <Trash2 size={15} />
    </button>
  );
}
