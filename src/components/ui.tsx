import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({ title, intro, children }: { title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-extrabold leading-[0.9] text-navy md:text-7xl">{title}</h1>
        {intro && <p className="mt-3 text-pretty text-ink/70">{intro}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
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
