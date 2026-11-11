import type { Metadata } from "next";
import { PlayerCard } from "@/components/player-card";
import { EmptyState, PageHeader, RedRule } from "@/components/ui";
import { POSITIONS } from "@/lib/positions";
import { requireMember } from "@/server/auth/session";
import { getSquad } from "@/server/queries/squad";

export const metadata: Metadata = { title: "Team" };

export default async function SquadPage() {
  const me = await requireMember();
  const squad = await getSquad();
  const coaches = squad.filter((p) => p.role === "coach");
  const players = squad.filter((p) => !coaches.includes(p));

  return (
    <>
      <PageHeader title="Team" />
      {players.length === 0 && (
        <EmptyState title="No players yet">Approve sign-ups in Settings and they'll show up here.</EmptyState>
      )}
      <div className="space-y-10">
        {POSITIONS.map(({ value, plural }) => {
          const group = players.filter((p) => p.position === value);
          if (group.length === 0) return null;
          return (
            <section key={value} aria-labelledby={`pos-${value}`}>
              {/* a label and a red line, like the finals line on the ladder and the months on the fixture */}
              <RedRule as="h2" id={`pos-${value}`} className="mb-4">
                {plural}
              </RedRule>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
                {group.map((p) => (
                  <PlayerCard key={p.id} player={p} isMe={p.id === me.id} />
                ))}
              </div>
            </section>
          );
        })}
        {coaches.length > 0 && (
          <section aria-labelledby="pos-coaches">
            <RedRule as="h2" id="pos-coaches" className="mb-4">
              Coaches
            </RedRule>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
              {coaches.map((p) => (
                <PlayerCard key={p.id} player={p} isMe={p.id === me.id} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
