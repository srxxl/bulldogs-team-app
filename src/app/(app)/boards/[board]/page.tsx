import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddPinSheet } from "@/components/pin-actions";
import { PinBoard } from "@/components/pin-board";
import { PageHeader } from "@/components/ui";
import { requireMember } from "@/server/auth/session";
import { getPins } from "@/server/queries/content";

const BOARDS = {
  fitness: {
    title: "Fitness board",
    intro: "Running programs, gym sessions, mobility and injury prevention. Pin what's working for you.",
    add: "Pin a workout",
    tags: ["Running", "Strength", "Mobility", "Injury prevention", "Recovery"],
    empty: "Share a running program, a gym session or your favourite stretch.",
  },
  nutrition: {
    title: "Nutrition board",
    intro: "How to fuel for game day and recover after. Recipes, snacks and hydration tips from the team.",
    add: "Pin a tip",
    tags: ["Pre-game", "Game day", "Recovery", "Hydration", "Recipe"],
    empty: "Share your go-to pre-game meal or recovery snack.",
  },
} as const;

type BoardKey = keyof typeof BOARDS;
const isBoard = (b: string): b is BoardKey => b in BOARDS;

export async function generateMetadata({ params }: PageProps<"/boards/[board]">): Promise<Metadata> {
  const { board } = await params;
  return { title: isBoard(board) ? BOARDS[board].title : "Board" };
}

export default async function BoardPage({ params }: PageProps<"/boards/[board]">) {
  const { board } = await params;
  if (!isBoard(board)) notFound();
  const me = await requireMember();
  const pins = await getPins(board);
  const b = BOARDS[board];
  return (
    <>
      <PageHeader title={b.title} intro={b.intro}>
        <AddPinSheet board={board} label={b.add} tags={[...b.tags]} />
      </PageHeader>
      <PinBoard pins={pins} me={me} empty={{ title: "Nothing pinned yet", body: b.empty }} />
    </>
  );
}
