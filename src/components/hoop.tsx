import { cn } from "@/lib/cn";

/**
 * The red-and-white band from the crest. The club's signature mark:
 * use at most once per screen.
 */
export function Hoop({
  className,
  tone = "onNavy",
  animate = false,
}: {
  className?: string;
  tone?: "onNavy" | "onChalk";
  animate?: boolean;
}) {
  const edge = tone === "onNavy" ? "bg-white" : "bg-navy";
  return (
    <div aria-hidden className={cn("flex flex-col", animate && "animate-hoop", className)}>
      <span className={cn("h-1.5", edge)} />
      <span className="h-2.5 bg-red" />
      <span className={cn("h-1.5", edge)} />
    </div>
  );
}
