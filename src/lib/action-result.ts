export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
      /** What was typed, so the form can show it again (a failed submit otherwise clears the fields). */
      values?: Record<string, string>;
    };

export const ok = <T>(message?: string, data?: T): ActionResult<T> => ({
  ok: true,
  message,
  data,
});
export const fail = (
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
  values?: Record<string, string>,
): ActionResult<never> => ({
  ok: false,
  error,
  fieldErrors,
  values,
});

/** Initial state for useActionState. */
export const idle = null as ActionResult<unknown> | null;
