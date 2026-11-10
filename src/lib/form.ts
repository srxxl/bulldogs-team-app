import type { z } from "zod";
import { type ActionResult, fail } from "./action-result";

/** Parses FormData with a zod schema; returns data or a failed ActionResult with field errors. */
export function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { data: z.infer<T> } | { error: ActionResult<never> } {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData) if (!k.startsWith("$ACTION")) raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { data: parsed.data };
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return { error: fail("Check the highlighted fields", fieldErrors, formValues(formData)) };
}

/** The text a form sent (not files), to hand back with an error so the fields keep what was typed. */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData) {
    // never echo a password back, even by accident
    if (typeof v === "string" && !k.startsWith("$ACTION") && !/password/i.test(k)) values[k] = v;
  }
  return values;
}

/** "" → undefined, so optional text inputs work with zod. */
export const blank = (v: unknown) => (v === "" || v == null ? undefined : v);
