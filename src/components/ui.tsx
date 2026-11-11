import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { HomeMascot } from "./mascot/home-mascot";

/**
 * A page title with the club bulldog on the same row. The dog wanders the whole row, walking and chasing the
 * footy in front of the title, but moves into the clear space beside it to sit, nap or do a trick.
 */
export function TitleRow({ children }: { children: ReactNode }) {
  return (
    <div data-title-row className="relative flex min-w-0 flex-1 items-end">
      <h1 className="min-w-0 text-5xl font-extrabold leading-[0.9] text-navy md:text-7xl">{children}</h1>
      {/* room beside the title for the dog to settle in */}
      <span aria-hidden className="w-28 shrink-0 md:w-36" />
      <div className="absolute inset-x-0 bottom-0 z-10">
        <HomeMascot small />
      </div>
    </div>
  );
}

/**
 * A page's title row (title and the bulldog) and actions (buttons) on the right. No description under it, on any
 * page: a useful fact (when training is, when the ladder was updated) goes as a note at the foot of its list.
 */
export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 md:mb-10">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <TitleRow>{title}</TitleRow>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </header>
  );
}

export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-[28px] bg-white p-5 md:p-7", className)} {...props} />;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-3xl font-bold text-navy">{children}</h2>
      {action}
    </div>
  );
}

/**
 * A label followed by a thin club-red rule out to the edge: splits a long list into groups (months on the fixture
 * and in fitness history, the finals line on the ladder). Renders an h3 unless told otherwise.
 */
export function RedRule({
  as: Tag = "h3",
  className,
  ...props
}: { as?: "h2" | "h3" | "p" | "div" } & ComponentProps<"h3">) {
  return (
    <Tag
      className={cn(
        "flex items-center gap-3.5 font-display text-2xl font-bold text-navy after:h-0.5 after:flex-1 after:rounded-full after:bg-red",
        className,
      )}
      {...props}
    />
  );
}

type ButtonVariant = "primary" | "red" | "ghost" | "outline";
const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white hover:bg-navy-deep",
  red: "bg-red text-white hover:bg-red-deep",
  ghost: "text-navy hover:bg-mist",
  outline: "border-2 border-navy text-navy hover:bg-navy hover:text-white",
};

export const buttonClass = (variant: ButtonVariant = "primary", className?: string) =>
  cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    buttonStyles[variant],
    className,
  );

export function Button({ variant, className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Chip({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-navy",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-[28px] border-2 border-dashed border-navy/20 p-8 text-center">
      <p className="font-display text-2xl font-bold text-navy">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-ink/70">{children}</div>}
    </div>
  );
}
