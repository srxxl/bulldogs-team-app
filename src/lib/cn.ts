import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our custom shadow tokens so later classes win cleanly.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { shadow: [{ shadow: ["stamp", "stamp-sm"] }] } },
});

/** Joins class names; later Tailwind classes override earlier conflicting ones. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
