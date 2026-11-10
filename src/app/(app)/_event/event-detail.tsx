import { notFound, redirect } from "next/navigation";
import { Confetti } from "@/components/confetti";
import { Morph, morphName } from "@/components/morph";
import { SectionPanel } from "@/components/section-panel";
import { resultOf } from "@/lib/score";
import { GameTiles } from "./game-tiles";
import { loadEvent } from "./load-event";
import { ComingBody, EventHeader } from "./sections";

/**
 * A game or club event's page. A game is its header plus a tile per part of the game, each opening its own page
 * (`[tile]/page.tsx`); a social or club event is short enough to show whole. Training sessions have their own page
 * under Training instead.
 */
export async function EventDetail({ id }: { id: string }) {
  const data = await loadEvent(id);
  if (!data) notFound();
  const { ev, scores } = data;
  if (ev.kind === "training") redirect(`/training/${id}`);
  const won = scores != null && resultOf(scores.team, scores.opp) === "win";

  return (
    <div className="space-y-3">
      {/* a game we won: soft, blurred confetti drifting behind the page */}
      {won && <Confetti variant="ambient" />}
      {/* grows out of the game's fixture row when you open it, and back into it when you go back */}
      <Morph name={morphName.event(id)}>
        <EventHeader data={data} />
      </Morph>

      {data.isGame ? (
        <GameTiles data={data} />
      ) : (
        <div className="grid gap-6 pt-3 lg:grid-cols-[1.3fr_1fr]">
          <SectionPanel
            id="coming"
            title={data.upcoming ? "Who's coming" : "Who said they'd come"}
            meta={`${data.yes.length} in`}
          >
            <ComingBody data={data} />
          </SectionPanel>
          {ev.details && (
            <SectionPanel id="details" title="Details">
              <p className="whitespace-pre-line text-ink/80">{ev.details}</p>
            </SectionPanel>
          )}
        </div>
      )}
    </div>
  );
}
