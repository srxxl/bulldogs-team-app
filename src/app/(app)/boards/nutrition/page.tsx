import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { Morph, morphName } from "@/components/morph";
import { PinBoard } from "@/components/pin-board";
import { AddRecipeSheet } from "@/components/recipe-sheet";
import { BOARDS } from "@/lib/boards";
import { requireMember } from "@/server/auth/session";
import { getPins } from "@/server/queries/content";

export const metadata: Metadata = { title: "Nutrition" };

/** The team's recipes: the Nutrition tile grown into a page. Anyone can add one; nothing is tracked. */
export default async function NutritionPage() {
  const me = await requireMember();
  const recipes = await getPins("nutrition");
  const b = BOARDS.nutrition;

  return (
    <div className="space-y-6">
      <Morph name={morphName.board("nutrition")}>
        <header className="rounded-[28px] bg-white p-5 md:p-8">
          <div className="flex items-center gap-3">
            <BackButton href="/boards" to="fitness and nutrition" className="text-navy" />
            <p className="text-sm font-semibold text-ink/60">
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            </p>
          </div>
          <h1 className="mt-4 text-6xl leading-[0.9] font-black text-navy md:text-7xl">{b.title}</h1>
          <p className="mt-3 max-w-2xl text-pretty text-ink/60">{b.intro}</p>
          <div className="mt-5">
            <AddRecipeSheet label={b.add} tags={b.tags} />
          </div>
        </header>
      </Morph>
      <PinBoard pins={recipes} me={me} empty={{ title: "No recipes yet", body: b.empty }} />
    </div>
  );
}
