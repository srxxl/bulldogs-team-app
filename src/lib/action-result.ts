export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export const ok = <T>(message?: string, data?: T): ActionResult<T> => ({
  ok: true,
  message,
  data,
});
export const fail = (error: string, fieldErrors?: Record<string, string[] | undefined>): ActionResult<never> => ({
  ok: false,
  error,
  fieldErrors,
});

/** Initial state for useActionState. */
export const idle = null as ActionResult<unknown> | null;
