import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A titled white panel on a detail page, with an optional action (e.g. "Add note") at the top right. */
export function SectionPanel({
  id,
  title,
  meta,
  action,
  titleClassName,
  children,
}: {
  id?: string;
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  /** Overrides the title's colour (a team's page titles its panels in the club colour). */
  titleClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative scroll-mt-6 rounded-[28px] bg-white p-5 md:p-7">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className={cn("min-w-0 text-3xl font-bold text-navy", titleClassName)}>
          {title}
          {meta != null && <span className="ml-2 font-sans text-base font-medium text-ink/50">{meta}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
