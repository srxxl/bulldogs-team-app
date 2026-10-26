"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { RotateCcw, Save } from "lucide-react";
import { useId, useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { BENCH_SLOTS, FIELD_SLOTS } from "@/lib/positions";
import { saveLineup } from "@/server/actions/lineup";
import type { AvailabilityStatus, Position } from "@/server/db/schema";
import { Avatar } from "./avatar";
import { Button } from "./ui";

export type BoardPlayer = {
  id: string;
  name: string;
  guernsey: number | null;
  image: string | null;
  position: Position;
  status: AvailabilityStatus | null;
};

type Lineup = Record<string, string>;
const POOL = "pool";

const STATUS_ORDER: Record<string, number> = {
  yes: 0,
  maybe: 1,
  null: 2,
  no: 3,
};
const STATUS_DOT: Record<string, string> = {
  yes: "bg-grass",
  maybe: "bg-powder",
  no: "bg-red",
  null: "bg-ink/20",
};

export function LineupBoard({
  eventId,
  players,
  initial,
  editable,
}: {
  eventId: string;
  players: BoardPlayer[];
  initial: Lineup;
  editable: boolean;
}) {
  const [lineup, setLineup] = useState<Lineup>(initial);
  const [saved, setSaved] = useState<Lineup>(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  // Stable id so dnd-kit's generated aria attributes match between server and client.
  const dndId = useId();

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const slotOf = useMemo(() => new Map(Object.entries(lineup).map(([s, u]) => [u, s])), [lineup]);
  const pool = players
    .filter((p) => !slotOf.has(p.id))
    .sort(
      (a, b) =>
        STATUS_ORDER[String(a.status)] - STATUS_ORDER[String(b.status)] || (a.guernsey ?? 99) - (b.guernsey ?? 99),
    );
  const dirty = JSON.stringify(lineup) !== JSON.stringify(saved);
  const onField = FIELD_SLOTS.filter((s) => lineup[s.id]).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  /** Moves a player into a slot (swapping with whoever's there) or back to the pool. */
  function place(playerId: string, target: string) {
    setMessage(null);
    setLineup((prev) => {
      const next = { ...prev };
      const from = Object.entries(prev).find(([, u]) => u === playerId)?.[0];
      if (from) delete next[from];
      if (target !== POOL) {
        const occupant = prev[target];
        if (occupant && from) next[from] = occupant;
        next[target] = playerId;
      }
      return next;
    });
  }

  const onDragStart = (e: DragStartEvent) => setDragging(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    if (e.over) place(String(e.active.id), String(e.over.id));
  };

  /** Tap a player, then tap a spot: works without dragging and with screen readers. */
  function tapPlayer(id: string) {
    setSelected((s) => (s === id ? null : id));
  }
  function tapSlot(slot: string) {
    if (selected) {
      place(selected, slot);
      setSelected(null);
    } else if (lineup[slot]) {
      setSelected(lineup[slot]);
    }
  }

  function save() {
    start(async () => {
      const res = await saveLineup({ eventId, lineup });
      if (res.ok) setSaved(lineup);
      setMessage({
        ok: res.ok,
        text: res.ok ? (res.message ?? "Saved") : res.error,
      });
    });
  }

  const board = (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <Oval>
          <div className="relative grid grid-rows-6 gap-y-2 px-3 py-10 sm:px-10">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="grid grid-cols-3 gap-2 sm:gap-4">
                {FIELD_SLOTS.filter((s) => s.row === row).map((s) => (
                  <Slot
                    key={s.id}
                    id={s.id}
                    label={s.short}
                    title={s.label}
                    player={byId.get(lineup[s.id])}
                    editable={editable}
                    selected={selected}
                    onTap={tapSlot}
                  />
                ))}
              </div>
            ))}
          </div>
        </Oval>
        <div className="mt-4">
          <h3 className="mb-2 text-xl font-bold text-navy">Interchange</h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {BENCH_SLOTS.map((s) => (
              <Slot
                key={s}
                id={s}
                label={s}
                title={`Interchange ${s.slice(1)}`}
                player={byId.get(lineup[s])}
                editable={editable}
                selected={selected}
                onTap={tapSlot}
                bench
              />
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <p className="text-sm text-ink/70">
          <span className="display-num text-3xl font-bold text-navy">{onField}</span> of {FIELD_SLOTS.length} on the
          field
        </p>
        {editable && (
          <div className="flex gap-2">
            <Button onClick={save} disabled={!dirty || pending} className="flex-1">
              <Save size={18} /> {pending ? "Saving…" : "Save lineup"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLineup(saved)}
              disabled={!dirty || pending}
              aria-label="Undo changes"
            >
              <RotateCcw size={18} />
            </Button>
          </div>
        )}
        {message && (
          <p role="status" className={cn("text-sm font-medium", message.ok ? "text-grass" : "text-red")}>
            {message.text}
          </p>
        )}
        {editable && (
          <PoolDrop>
            <h3 className="mb-1 text-xl font-bold text-navy">Squad</h3>
            <p className="mb-3 text-xs text-ink/60">
              Drag onto the ground, or tap a player then tap a spot. Green said they're in.
            </p>
            <ul className="flex flex-wrap gap-2">
              {pool.map((p) => (
                <li key={p.id}>
                  <PlayerToken player={p} selected={selected === p.id} onTap={tapPlayer} />
                </li>
              ))}
              {pool.length === 0 && <li className="text-sm text-ink/50">Everyone's placed.</li>}
            </ul>
          </PoolDrop>
        )}
      </aside>
    </div>
  );

  if (!editable) return board;
  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {board}
      <DragOverlay dropAnimation={null}>
        {dragging && byId.get(dragging) ? <Token player={byId.get(dragging) as BoardPlayer} lifted /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Oval({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[50%/22%] bg-navy">
      {/* Ground markings: centre square, centre circle, 50m arcs, goal squares */}
      <svg
        aria-hidden
        viewBox="0 0 300 420"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-white/20"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
          <rect x="105" y="165" width="90" height="90" />
          <circle cx="150" cy="210" r="14" />
          <line x1="150" y1="196" x2="150" y2="224" />
          <path d="M60 0 A 90 90 0 0 0 240 0" transform="translate(0 6)" />
          <path d="M60 420 A 90 90 0 0 1 240 420" transform="translate(0 -6)" />
          <rect x="135" y="2" width="30" height="16" />
          <rect x="135" y="402" width="30" height="16" />
        </g>
      </svg>
      {children}
    </div>
  );
}

function Slot({
  id,
  label,
  title,
  player,
  editable,
  selected,
  onTap,
  bench,
}: {
  id: string;
  label: string;
  title: string;
  player?: BoardPlayer;
  editable: boolean;
  selected: string | null;
  onTap: (slot: string) => void;
  bench?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !editable });
  const content = player ? (
    editable ? (
      <PlayerToken player={player} selected={selected === player.id} onTap={() => onTap(id)} compact />
    ) : (
      <Token player={player} compact />
    )
  ) : editable ? (
    <button
      type="button"
      onClick={() => onTap(id)}
      aria-label={`${title}, empty${selected ? ". Place the selected player here" : ""}`}
      className={cn("size-full rounded-xl text-xs font-bold", bench ? "text-navy/40" : "text-white/50")}
    >
      {label}
    </button>
  ) : (
    <span className={cn("text-xs font-bold", bench ? "text-navy/40" : "text-white/50")}>{label}</span>
  );
  return (
    <div
      ref={editable ? setNodeRef : undefined}
      title={player ? `${title}: ${player.name}` : title}
      className={cn(
        "grid min-h-16 place-items-center rounded-2xl border-2 border-dashed p-0.5 transition-colors",
        bench ? "border-navy/20 bg-white" : "border-white/25",
        player && "border-transparent",
        isOver && "border-red bg-red/20",
        selected && !player && editable && "border-white/70",
      )}
    >
      {content}
    </div>
  );
}

function PoolDrop({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL });
  return (
    <div ref={setNodeRef} className={cn("rounded-2xl bg-white p-4 transition-colors", isOver && "bg-red/10")}>
      {children}
    </div>
  );
}

function PlayerToken({
  player,
  selected,
  onTap,
  compact,
}: {
  player: BoardPlayer;
  selected: boolean;
  onTap: (id: string) => void;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.id,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={() => onTap(player.id)}
      aria-pressed={selected}
      className={cn(
        "touch-none rounded-full",
        isDragging && "opacity-30",
        selected && "ring-4 ring-red ring-offset-2 ring-offset-navy",
      )}
    >
      <Token player={player} compact={compact} />
    </button>
  );
}

function Token({ player, compact, lifted }: { player: BoardPlayer; compact?: boolean; lifted?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-white py-1 pr-3 pl-1 text-left text-ink",
        compact && "flex-col gap-0.5 bg-transparent p-0 pr-0 text-center text-white",
        lifted && "rotate-3 shadow-stamp",
      )}
    >
      <span className="relative">
        <Avatar
          name={player.name}
          src={player.image}
          size={compact ? 36 : 30}
          className={compact ? "ring-2 ring-white" : undefined}
        />
        {player.guernsey != null && (
          <span className="absolute -right-1.5 -bottom-1 grid h-4 min-w-4 place-items-center rounded-full bg-red px-0.5 text-[10px] font-bold text-white">
            {player.guernsey}
          </span>
        )}
        {!compact && (
          <span
            className={cn(
              "absolute -top-0.5 -left-0.5 size-2.5 rounded-full ring-2 ring-white",
              STATUS_DOT[String(player.status)],
            )}
          />
        )}
      </span>
      <span className={cn("max-w-24 truncate text-xs font-semibold", compact && "max-w-20 text-[11px]")}>
        {player.name.split(" ")[0]}
      </span>
    </span>
  );
}
