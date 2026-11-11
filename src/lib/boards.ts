import type { Board } from "@/server/db/schema";

/**
 * The fitness and nutrition boards: their names, wording and suggested tags. Fitness is the week's activities
 * (picked by skips, coaches and admins from the saved ones, like drills); nutrition is recipes anyone can share.
 */
export const BOARDS: Record<Board, { title: string; intro: string; add: string; tags: string[]; empty: string }> = {
  fitness: {
    title: "Fitness",
    intro: "This week's activities, picked by the skips and coaches. Do them all to close your hoop.",
    add: "Add activity",
    tags: ["Running", "Strength", "Mobility", "Injury prevention", "Recovery"],
    empty: "Nothing picked for this week yet.",
  },
  nutrition: {
    title: "Nutrition",
    intro: "Recipes the team rates, for game day, recovery and everything in between. Try one, share yours.",
    add: "Add a recipe",
    tags: ["Breakfast", "Pre-game", "Recovery", "Snack", "Dinner"],
    empty: "Share your go-to pre-game meal or recovery snack.",
  },
};

export const isBoard = (b: string): b is Board => b in BOARDS;
