import type { ReactNode } from "react";
import { getBoardData } from "@/server/queries/board";
import { TeamBoard } from "./team-board";

/** The team board for one game, wrapped as a page section. Loads its own data. */
export async function TeamSection({
  eventId,
  editable,
  heading,
}: {
  eventId: string;
  editable: boolean;
  heading: ReactNode;
}) {
  const { players, lineup } = await getBoardData(eventId);
  // No backdrop-filter on this section: it becomes the containing block for dnd-kit's fixed drag overlay.
  return (
    <section id="team" className="scroll-mt-6 rounded-[28px] bg-white p-4 md:p-7">
      {heading}
      <TeamBoard eventId={eventId} players={players} initial={lineup} editable={editable} />
    </section>
  );
}
