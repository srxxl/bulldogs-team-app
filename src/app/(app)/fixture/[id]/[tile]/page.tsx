import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Morph, morphName } from "@/components/morph";
import { isGameTile } from "@/lib/game-phase";
import { loadEvent } from "../../../_event/load-event";
import { tilePage } from "../../../_event/sections";

export async function generateMetadata({ params }: PageProps<"/fixture/[id]/[tile]">): Promise<Metadata> {
  const { id, tile } = await params;
  const data = isGameTile(tile) ? await loadEvent(id) : null;
  if (!data || !isGameTile(tile)) return { title: "Game" };
  return { title: `${tilePage(tile, data).title}, ${data.ev.title}` };
}

/** One part of a game (who's in, the team, notes...): its tile on the game page grown into a page of its own. */
export default async function GameTilePage({ params }: PageProps<"/fixture/[id]/[tile]">) {
  const { id, tile } = await params;
  if (!isGameTile(tile)) notFound();
  const data = await loadEvent(id);
  if (!data?.isGame) notFound();
  const page = tilePage(tile, data);

  return (
    <Morph name={morphName.gameTile(id, tile)}>
      <section className="rounded-[28px] bg-white p-5 md:p-7">
        <div className="mb-4 flex items-start gap-3">
          {/* back to this tile on the game page, not the top of it */}
          <BackButton
            href={`/fixture/${id}#${morphName.gameTile(id, tile)}`}
            to={data.ev.title}
            className="text-navy"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-navy">
              {page.title}
              {page.meta != null && (
                <span className="ml-2 font-sans text-base font-medium text-ink/50">{page.meta}</span>
              )}
            </h1>
            <p className="text-sm text-ink/60">{[data.ev.round, data.ev.title].filter(Boolean).join(", ")}</p>
          </div>
          {page.action}
        </div>
        {page.body}
      </section>
    </Morph>
  );
}
