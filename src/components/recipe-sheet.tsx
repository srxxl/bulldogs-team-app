"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { createRecipe } from "@/server/actions/content";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "./forms";
import { Sheet } from "./sheet";

/** Add a recipe to the nutrition board. Anyone in the squad. */
export function AddRecipeSheet({ label, tags }: { label: string; tags: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createRecipe, null);
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
        <Field label="Name" name="title" state={state}>
          <Input name="title" required maxLength={100} placeholder="Overnight oats" state={state} />
        </Field>
        <Field label="Ingredients and method" name="body" state={state} hint="Or why you love it.">
          <Textarea name="body" maxLength={1500} rows={6} state={state} />
        </Field>
        <Field label="Link" name="link" state={state} hint="Optional. A recipe site, YouTube, Instagram.">
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
          <Input name="tag" list="recipe-tags" maxLength={24} state={state} />
          <datalist id="recipe-tags">
            {tags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <FormMessage state={state && !state.ok ? state : null} />
        <SubmitButton pending="Adding…" className="w-full">
          Add recipe
        </SubmitButton>
      </form>
    </Sheet>
  );
}
