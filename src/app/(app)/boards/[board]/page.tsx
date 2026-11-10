import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddPinSheet } from "@/components/pin-actions";
import { PinBoard } from "@/components/pin-board";
import { cn } from "@/lib/cn";
import { requireMember } from "@/server/auth/session";
import { getPins } from "@/server/queries/content";

const TITLE = "Fitness and nutrition";

const BOARDS = {
  fitness: {
    tab: "Fitness",
    intro: "Running programs, gym sessions, mobility and injury prevention. Pin what's working for you.",
    add: "Pin a workout",
    tags: ["Running", "Strength", "Mobility", "Injury prevention", "Recovery"],
    empty: "Share a running program, a gym session or your favourite stretch.",
  },
  nutrition: {
    tab: "Nutrition",
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
  return { title: isBoard(board) ? `${BOARDS[board].tab} board` : TITLE };
}

export default async function BoardPage({ params }: PageProps<"/boards/[board]">) {
  const { board } = await params;
  if (!isBoard(board)) notFound();
  const me = await requireMember();
  const pins = await getPins(board);
  const b = BOARDS[board];
  return (
    <>
      <header className="mb-6 md:mb-10">
        <h1 className="text-5xl font-extrabold leading-[0.9] text-navy md:text-7xl">{TITLE}</h1>
        {/* each board is its own page, so the tabs are links */}
        {/* set like a footy record's section heads: display type on a rule, a red bar under the one you're on */}
        <nav aria-label="Boards" className="mt-5 flex gap-7 border-b-[1.5px] border-ink/12">
          {(Object.keys(BOARDS) as BoardKey[]).map((key) => (
            <Link
              key={key}
              href={`/boards/${key}`}
              aria-current={key === board ? "page" : undefined}
              className={cn(
                "-mb-[1.5px] flex min-h-12 items-center border-b-[5px] pt-1 font-display text-2xl font-extrabold focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy md:text-3xl",
                key === board ? "border-red text-navy" : "border-transparent text-navy/45 hover:text-navy",
              )}
            >
              {BOARDS[key].tab}
            </Link>
          ))}
        </nav>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-pretty text-ink/70">{b.intro}</p>
          <AddPinSheet board={board} label={b.add} tags={[...b.tags]} />
        </div>
      </header>
      <PinBoard pins={pins} me={me} empty={{ title: "Nothing pinned yet", body: b.empty }} />
    </>
  );
}
