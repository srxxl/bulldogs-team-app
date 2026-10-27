import { getBoardData } from "@/server/queries/board";
import { TeamBoard } from "./team-board";

/**
 * The team board for one game. Loads its own data.
 * Don't wrap it in anything with backdrop-filter, transform or filter: that becomes the containing
 * block for dnd-kit's fixed drag overlay and dragging lands in the wrong place.
 */
export async function TeamSection({ eventId, editable }: { eventId: string; editable: boolean }) {
  const { players, lineup } = await getBoardData(eventId);
  return <TeamBoard eventId={eventId} players={players} initial={lineup} editable={editable} />;
}
