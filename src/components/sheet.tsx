"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { buttonClass } from "./ui";

/**
 * Native <dialog> sheet: focus trapping, Esc and backdrop come for free.
 * Bottom sheet on mobile, centred card on desktop.
 */
export function Sheet({
  trigger,
  triggerClassName,
  title,
  open,
  onOpenChange,
  children,
}: {
  trigger: ReactNode;
  /** Trigger button style; a primary button by default. */
  triggerClassName?: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button type="button" className={triggerClassName ?? buttonClass("primary")} onClick={() => onOpenChange(true)}>
        {trigger}
      </button>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click only; <dialog> handles Esc natively */}
      <dialog
        ref={ref}
        aria-label={title}
        onClose={() => onOpenChange(false)}
        onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
        className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[28px] bg-chalk p-0 text-ink md:m-auto md:max-w-lg md:rounded-[28px]"
      >
        <div className="p-5 md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-navy">{title}</h2>
            <button
              type="button"
              aria-label="Close"
              className={buttonClass("ghost", "w-11 px-0")}
              onClick={() => onOpenChange(false)}
            >
              <X size={20} />
            </button>
          </div>
          {/* Only build the contents while open, so several sheets on one page never share form field ids. */}
          {open && children}
        </div>
      </dialog>
    </>
  );
}
