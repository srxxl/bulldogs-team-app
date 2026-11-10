import type { Metadata } from "next";
import { PlayerCard } from "@/components/player-card";
import { EmptyState, PageHeader } from "@/components/ui";
import { POSITIONS } from "@/lib/positions";
import { requireMember } from "@/server/auth/session";
import { getSquad } from "@/server/queries/squad";

export const metadata: Metadata = { title: "Squad" };

export default async function SquadPage() {
  const me = await requireMember();
  const squad = await getSquad();
  const coaches = squad.filter((p) => p.role === "coach");
  const players = squad.filter((p) => !coaches.includes(p));

  return (
    <>
      <PageHeader title="Squad"></PageHeader>
      {players.length === 0 && (
        <EmptyState title="No players yet">Approve sign-ups in Settings and they'll show up here.</EmptyState>
      )}
      <div className="space-y-12">
        {POSITIONS.map(({ value, plural }) => {
          const group = players.filter((p) => p.position === value);
          if (group.length === 0) return null;
          return (
            <section key={value} aria-labelledby={`pos-${value}`}>
              <h2 id={`pos-${value}`} className="mb-4 flex items-baseline gap-3 text-4xl font-extrabold text-navy">
                {plural}
                <span className="font-sans text-base font-medium text-ink/50">{group.length}</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
                {group.map((p) => (
                  <PlayerCard key={p.id} player={p} isMe={p.id === me.id} />
                ))}
              </div>
            </section>
          );
        })}
        {coaches.length > 0 && (
          <section>
            <h2 className="mb-4 text-4xl font-extrabold text-navy">Coaches</h2>
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
