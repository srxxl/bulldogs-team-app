import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/**
 * A page section people can minimise. Built on <details>, so it works without JavaScript,
 * keyboard and screen readers get expand/collapse for free, and #anchors open it.
 */
export function Collapsible({
  id,
  title,
  meta,
  defaultOpen = true,
  children,
}: {
  id?: string;
  title: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} open={defaultOpen} className="group scroll-mt-6 rounded-[28px] bg-white">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-[28px] p-5 md:px-7 [&::-webkit-details-marker]:hidden">
        <h2 className="min-w-0 flex-1 text-3xl font-bold text-navy">
          {title}
          {meta != null && <span className="ml-2 font-sans text-base font-medium text-ink/50">{meta}</span>}
        </h2>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl text-navy group-hover:bg-mist">
          <ChevronDown size={20} className="transition-transform group-open:rotate-180" aria-hidden />
        </span>
      </summary>
      <div className="px-5 pb-5 md:px-7 md:pb-7">{children}</div>
    </details>
  );
}
