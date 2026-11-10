import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Morph, morphName } from "@/components/morph";
import { AddPinSheet } from "@/components/pin-actions";
import { PinBoard } from "@/components/pin-board";
import { BOARDS, COVER, isBoard } from "@/lib/boards";
import { cn } from "@/lib/cn";
import { perthWeekStart } from "@/lib/time";
import { requireMember } from "@/server/auth/session";
import { getPins, getWeekDone, getWeekPicks } from "@/server/queries/content";

export async function generateMetadata({ params }: PageProps<"/boards/[board]">): Promise<Metadata> {
  const { board } = await params;
  return { title: isBoard(board) ? `${BOARDS[board].title} board` : "Board" };
}

/** Everything pinned to one board, with this week's picks first. Its header grows out of the hub's cover. */
export default async function BoardPage({ params }: PageProps<"/boards/[board]">) {
  const { board } = await params;
  if (!isBoard(board)) notFound();
  const me = await requireMember();
  const week = perthWeekStart();
  const [pins, done, picks] = await Promise.all([getPins(board), getWeekDone(week), getWeekPicks(week)]);
  const picked = new Set(picks.map((p) => p.id));
  const b = BOARDS[board];
  const c = COVER[board];
  // this week's picks lead, the rest stay newest first
  const ordered = [...pins.filter((p) => picked.has(p.id)), ...pins.filter((p) => !picked.has(p.id))];

  return (
    <div className="space-y-6">
      <Morph name={morphName.board(board)}>
        <header className={cn("rounded-[28px] p-5 md:p-8", c.card)}>
          <div className="flex items-center gap-3">
            <BackButton href="/boards" to="fitness and nutrition" />
            <p className={cn("text-sm font-semibold", c.soft)}>
              {pins.length} {pins.length === 1 ? "pin" : "pins"}
            </p>
          </div>
          <h1 className={cn("mt-4 text-6xl font-black leading-[0.9] md:text-7xl", c.title)}>{b.title}</h1>
          <p className={cn("mt-3 max-w-2xl text-pretty", c.soft)}>{b.intro}</p>
          <div className="mt-5">
            <AddPinSheet
              board={board}
              label={b.add}
              tags={b.tags}
              triggerClassName={
                board === "fitness"
                  ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 font-semibold text-navy transition-colors hover:bg-mist"
                  : undefined
              }
            />
          </div>
        </header>
      </Morph>
      <PinBoard
        pins={ordered}
        me={me}
        picked={picked}
        done={done}
        fitness={board === "fitness"}
        empty={{ title: "Nothing pinned yet", body: b.empty }}
      />
    </div>
  );
}
