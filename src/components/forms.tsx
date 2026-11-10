"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/cn";
import { buttonClass } from "./ui";

const control =
  "w-full rounded-xl border-2 border-navy/15 bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink/40 focus:border-navy focus:outline-none aria-invalid:border-red";

export function Field({
  label,
  name,
  hint,
  state,
  children,
}: {
  label: string;
  name: string;
  hint?: ReactNode;
  state?: ActionResult<unknown> | null;
  children: ReactNode;
}) {
  const error = state && !state.ok ? state.fieldErrors?.[name]?.[0] : undefined;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-msg`} className="mt-1 text-sm font-medium text-red">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-msg`} className="mt-1 text-sm text-ink/60">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const invalid = (name?: string, state?: ActionResult<unknown> | null) =>
  !!(name && state && !state.ok && state.fieldErrors?.[name]);

/**
 * After a failed submit React clears the form back to each field's default, so a field's default becomes what
 * was typed (sent back with the error). Never for passwords or files.
 */
const typed = (name?: string, state?: ActionResult<unknown> | null) =>
  name && state && !state.ok ? state.values?.[name] : undefined;

/** Controls take their id from `name` so <Field>'s label and message point at them. */
const a11y = (name?: string) => ({ id: name, "aria-describedby": name && `${name}-msg` });

export function Input({
  className,
  state,
  ...props
}: ComponentProps<"input"> & { state?: ActionResult<unknown> | null }) {
  return (
    <input
      {...a11y(props.name)}
      className={cn(control, className)}
      aria-invalid={invalid(props.name, state)}
      {...props}
      {...(props.type === "password" || props.type === "file" || typed(props.name, state) === undefined
        ? {}
        : { defaultValue: typed(props.name, state) })}
    />
  );
}

export function Textarea({
  className,
  state,
  ...props
}: ComponentProps<"textarea"> & { state?: ActionResult<unknown> | null }) {
  return (
    <textarea
      {...a11y(props.name)}
      className={cn(control, "min-h-28 resize-y", className)}
      aria-invalid={invalid(props.name, state)}
      {...props}
      {...(typed(props.name, state) === undefined ? {} : { defaultValue: typed(props.name, state) })}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...a11y(props.name)} className={cn(control, className)} {...props} />;
}

export function SubmitButton({
  children,
  pending: pendingLabel,
  variant = "primary",
  disabled,
  className,
}: {
  children: ReactNode;
  pending?: string;
  variant?: "primary" | "red";
  /** Not ready to send yet (it's also off while sending). */
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className={buttonClass(variant, className)}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionResult<unknown> | null }) {
  if (!state) return null;
  const text = state.ok ? state.message : state.error;
  if (!text) return null;
  return (
    <p
      role="status"
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium",
        state.ok ? "bg-grass/10 text-grass" : "bg-red/10 text-red",
      )}
    >
      {text}
    </p>
  );
}
