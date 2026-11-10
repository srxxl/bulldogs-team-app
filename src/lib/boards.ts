import type { Board } from "@/server/db/schema";

/** The fitness and nutrition boards: their names, wording and suggested tags. */
export const BOARDS: Record<
  Board,
  { title: string; intro: string; add: string; tags: string[]; empty: string; topics: string }
> = {
  fitness: {
    title: "Fitness",
    intro: "Running programs, gym sessions, mobility and injury prevention. Pin what's working for you.",
    add: "Pin a workout",
    tags: ["Running", "Strength", "Mobility", "Injury prevention", "Recovery"],
    empty: "Share a running program, a gym session or your favourite stretch.",
    topics: "Running, strength, mobility",
  },
  nutrition: {
    title: "Nutrition",
    intro: "How to fuel for game day and recover after. Recipes, snacks and hydration tips from the team.",
    add: "Pin a tip",
    tags: ["Pre-game", "Game day", "Recovery", "Hydration", "Recipe"],
    empty: "Share your go-to pre-game meal or recovery snack.",
    topics: "Pre-game, hydration, recovery",
  },
};

export const BOARD_KEYS = Object.keys(BOARDS) as Board[];
export const isBoard = (b: string): b is Board => b in BOARDS;

/** Each board's cover on the hub, and its header once open: fitness in navy, nutrition on white. */
export const COVER = {
  fitness: { card: "bg-navy text-white", title: "text-white", soft: "text-white/70", item: "bg-white/10" },
  nutrition: { card: "bg-white text-ink", title: "text-navy", soft: "text-ink/60", item: "bg-mist" },
} as const;
