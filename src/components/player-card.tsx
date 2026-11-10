import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { positionLabel } from "@/lib/positions";
import { leaderBadge } from "@/lib/roles";
import type { SquadMember } from "@/server/queries/squad";
import { Morph, morphName } from "./morph";

/** Trading-card style: photo, oversized outlined guernsey number. */
export function PlayerCard({ player, className }: { player: SquadMember; className?: string }) {
  const leader = leaderBadge(player.role);
  return (
    <Morph name={morphName.player(player.id)}>
      <Link
        href={`/squad/${player.id}`}
        className={cn(
          "group relative block overflow-hidden rounded-2xl bg-white transition-transform hover:-translate-y-1",
          className,
        )}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-powder">
          {player.image ? (
            <Image
              src={player.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center font-display text-7xl font-black text-navy/20">
              {player.displayName.slice(0, 1)}
            </div>
          )}
          <span
            aria-hidden
            className="display-num num-outline absolute right-2 -bottom-3 text-[7.5rem] font-black text-white drop-shadow-[0_2px_0_rgb(21_27_69_/_0.35)]"
          >
            {player.guernsey ?? ""}
          </span>
          {leader && (
            <span className="absolute top-2 left-2 rounded-full bg-red px-2.5 py-0.5 text-xs font-bold text-white">
              {leader}
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="truncate font-display text-xl font-bold leading-tight text-navy">
            {player.guernsey != null && <span className="sr-only">Number {player.guernsey}, </span>}
            {player.displayName}
          </p>
          <p className="text-sm text-ink/60">
            {leader === "Coach"
              ? "Coach"
              : [player.position, player.secondaryPosition]
                  .filter((p) => p !== null)
                  .map(positionLabel)
                  .join(" / ")}
          </p>
        </div>
      </Link>
    </Morph>
  );
}
