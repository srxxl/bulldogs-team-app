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
import { Eraser, RotateCcw, Save, Sparkles } from "lucide-react";
import { useId, useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { autoFill, BENCH_SLOTS, EMERGENCY_SLOTS, FIELD_SLOTS, GROUND, MARKER, positionLabel } from "@/lib/positions";
import { saveLineup } from "@/server/actions/lineup";
import { Avatar } from "../avatar";
import { Button } from "../ui";
import type { BoardPlayer, Lineup } from "./types";

const POOL = "pool";

const SLOT_LABEL = new Map<string, string>([
  ...FIELD_SLOTS.map((s) => [s.id, s.label] as [string, string]),
  ...BENCH_SLOTS.map((s) => [s, `Interchange ${s.slice(1)}`] as [string, string]),
  ...EMERGENCY_SLOTS.map((s) => [s, `Emergency ${s.slice(1)}`] as [string, string]),
]);
const STATUS_TEXT = { yes: "Said they're in", no: "Can't make it", null: "Hasn't said yet" } as const;
const STATUS_ORDER = { yes: 0, null: 1, no: 2 } as const;

/**
 * The team board: a top-down oval with players on their positions.
 * Captains and coaches drag players on (or tap a player, then tap a spot), auto-fill from RSVPs
 * and save; everyone else can tap players for details.
 */
export function TeamBoard({
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
        STATUS_ORDER[a.status ?? "null"] - STATUS_ORDER[b.status ?? "null"] || (a.guernsey ?? 99) - (b.guernsey ?? 99),
    );
  const dirty = JSON.stringify(lineup) !== JSON.stringify(saved);
  const onField = FIELD_SLOTS.filter((s) => lineup[s.id]).length;
  const selectedPlayer = selected ? byId.get(selected) : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  /** Moves a player into a slot (swapping with whoever's there) or off the team. */
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

  const onDragStart = (e: DragStartEvent) => {
    setDragging(String(e.active.id));
    setSelected(null);
  };
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    if (e.over) place(String(e.active.id), String(e.over.id));
  };

  /** Tap a player to see them; with one selected, tap a spot to move them there. */
  const tapPlayer = (id: string) => setSelected((s) => (s === id ? null : id));
  function tapSlot(slot: string) {
    if (editable && selected && lineup[slot] !== selected) {
      place(selected, slot);
      setSelected(null);
    } else if (lineup[slot]) {
      tapPlayer(lineup[slot]);
    }
  }

  function toBench(id: string) {
    const free = BENCH_SLOTS.find((s) => !lineup[s]);
    if (free) place(id, free);
    else setMessage({ ok: false, text: "The bench is full" });
    setSelected(null);
  }

  function fill() {
    const next = autoFill(
      lineup,
      players.map((p) => ({ ...p, available: p.status === "yes" })),
    );
    const added = Object.keys(next).length - Object.keys(lineup).length;
    setLineup(next);
    setMessage({
      ok: added > 0,
      text:
        added > 0
          ? `Placed ${added} players who said they're in. Save to keep it.`
          : "Everyone who's in is already placed",
    });
  }

  function save() {
    start(async () => {
      const res = await saveLineup({ eventId, lineup });
      if (res.ok) setSaved(lineup);
      setMessage({ ok: res.ok, text: res.ok ? (res.message ?? "Saved") : res.error });
    });
  }

  const board = (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr]">
      <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <div className="mb-3">
          <p className="text-sm text-ink/70">
            <span className="display-num mr-1 text-3xl font-bold text-navy">{onField}</span>
            of {FIELD_SLOTS.length} on the ground
          </p>
        </div>

        <Ground>
          {FIELD_SLOTS.map((s) => {
            return (
              <FieldSpot
                key={s.id}
                id={s.id}
                short={s.short}
                title={s.label}
                x={s.x}
                y={s.y}
                player={byId.get(lineup[s.id])}
                editable={editable}
                selected={selected}
                onTapSlot={tapSlot}
              />
            );
          })}
        </Ground>

        <div className="board-bench mt-6 grid gap-4 sm:grid-cols-[2fr_1fr]">
          {(
            [
              ["Interchange", BENCH_SLOTS, "Up to 4 can rotate on and off."],
              ["Emergencies", EMERGENCY_SLOTS, "Back-ups if someone pulls out."],
            ] as const
          ).map(([title, slots, hint]) => (
            <div key={title}>
              <h3 className="px-1 text-lg font-bold text-white">{title}</h3>
              <p className="mb-2 px-1 text-xs text-powder">{hint}</p>
              <div className={cn("grid gap-2", slots.length === 4 ? "grid-cols-4" : "grid-cols-2")}>
                {slots.map((s) => (
                  <BenchSpot
                    key={s}
                    id={s}
                    label={SLOT_LABEL.get(s) ?? s}
                    player={byId.get(lineup[s])}
                    editable={editable}
                    selected={selected}
                    onTapSlot={tapSlot}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-4 lg:col-start-2 lg:row-start-1">
        {selectedPlayer ? (
          <PlayerCard
            player={selectedPlayer}
            spot={slotOf.get(selectedPlayer.id)}
            editable={editable}
            onBench={() => toBench(selectedPlayer.id)}
            onRemove={() => {
              place(selectedPlayer.id, POOL);
              setSelected(null);
            }}
            onClose={() => setSelected(null)}
          />
        ) : (
          <p className="rounded-2xl bg-white p-4 text-sm text-ink/70">
            {editable
              ? "Drag players onto the ground, or tap a player and then tap a spot. Tap anyone on the ground for details."
              : "Tap a player to see where they're starting."}
          </p>
        )}

        {editable && (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={save} disabled={!dirty || pending} className="col-span-2">
              <Save size={18} /> {pending ? "Saving…" : "Save lineup"}
            </Button>
            <Button variant="outline" onClick={fill}>
              <Sparkles size={16} /> Auto-fill
            </Button>
            <Button variant="ghost" onClick={() => setLineup({})} disabled={Object.keys(lineup).length === 0}>
              <Eraser size={16} /> Clear
            </Button>
            {dirty && (
              <Button variant="ghost" onClick={() => setLineup(saved)} className="col-span-2">
                <RotateCcw size={16} /> Undo changes
              </Button>
            )}
          </div>
        )}
        {message && (
          <p role="status" className={cn("text-sm font-medium", message.ok ? "text-grass" : "text-red")}>
            {message.text}
          </p>
        )}
      </aside>

      {/* On phones the unpicked players sit right above the ground as a swipeable strip. */}
      {editable && (
        <PoolDrop className="order-first lg:order-none lg:col-start-2 lg:row-start-2 lg:self-start">
          <h3 className="mb-1 text-xl font-bold text-navy">Not picked</h3>
          <p className="mb-3 text-xs text-ink/60">Green dot: said they're in. Red: can't make it.</p>
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
            {pool.map((p) => (
              <li key={p.id} className="shrink-0">
                <PoolToken player={p} selected={selected === p.id} onTap={tapPlayer} />
              </li>
            ))}
            {pool.length === 0 && <li className="text-sm text-ink/50">Everyone's placed.</li>}
          </ul>
        </PoolDrop>
      )}
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
        {dragging && byId.get(dragging) ? <Chip player={byId.get(dragging) as BoardPlayer} lifted /> : null}
      </DragOverlay>
    </DndContext>
  );
}

/* -------------------------------------------------------------------------- */

const { width: GW, height: GH } = GROUND;

/** The oval, drawn with real ground markings. */
function Ground({ children }: { children: React.ReactNode }) {
  return (
    <div className="board-ground">
      <div className="board-surface" aria-hidden>
        <svg aria-hidden viewBox={`0 0 ${GW} ${GH}`} className="absolute inset-0 size-full">
          <defs>
            <clipPath id="board-ground-clip">
              <ellipse cx={GW / 2} cy={GH / 2} rx={GW / 2} ry={GH / 2} />
            </clipPath>
          </defs>
          <g fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="2" clipPath="url(#board-ground-clip)">
            <ellipse cx={GW / 2} cy={GH / 2} rx={GW / 2 - 9} ry={GH / 2 - 9} strokeOpacity="0.8" strokeWidth="3" />
            <circle cx={GW / 2} cy={0} r={165} />
            <circle cx={GW / 2} cy={GH} r={165} />
            <rect x={GW / 2 - 12} y={9} width={24} height={14} />
            <rect x={GW / 2 - 12} y={GH - 23} width={24} height={14} />
            <rect x={GW / 2 - 50} y={GH / 2 - 50} width={100} height={100} />
            <circle cx={GW / 2} cy={GH / 2} r={18} />
            <line x1={GW / 2} y1={GH / 2 - 18} x2={GW / 2} y2={GH / 2 + 18} />
          </g>
        </svg>
      </div>
      {children}
    </div>
  );
}

function FieldSpot({
  id,
  short,
  title,
  x,
  y,
  player,
  editable,
  selected,
  onTapSlot,
}: {
  id: string;
  short: string;
  title: string;
  x: number;
  y: number;
  player?: BoardPlayer;
  editable: boolean;
  selected: string | null;
  onTapSlot: (slot: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !editable });
  return (
    <div className="board-spot" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${MARKER * 100}%` }}>
      <button
        ref={editable ? setNodeRef : undefined}
        type="button"
        onClick={() => onTapSlot(id)}
        aria-label={player ? `${title}: ${player.name}` : `${title}, empty`}
        className={cn(
          "board-ring",
          player && "board-ring-filled",
          isOver && "board-ring-over",
          selected && !player && editable && "board-ring-ready",
        )}
      >
        {!player && short}
      </button>
      {player && (
        <Stander player={player} slot={id} editable={editable} selected={selected === player.id} onTap={onTapSlot} />
      )}
    </div>
  );
}

/** A player on their spot. */
function Stander({
  player,
  slot,
  editable,
  selected,
  onTap,
}: {
  player: BoardPlayer;
  slot: string;
  editable: boolean;
  selected: boolean;
  onTap: (slot: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: player.id, disabled: !editable });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...(editable ? listeners : {})}
      {...(editable ? attributes : {})}
      onClick={() => onTap(slot)}
      aria-pressed={selected}
      aria-label={`${player.name}, ${SLOT_LABEL.get(slot)}`}
      className={cn("board-stander", selected && "board-stander-selected", isDragging && "opacity-30")}
    >
      <span className="relative">
        <Avatar name={player.name} src={player.image} size={38} className="ring-2 ring-white" />
        {player.guernsey != null && <span className="board-number">{player.guernsey}</span>}
      </span>
      <span className="board-name">{player.name.split(" ")[0]}</span>
    </button>
  );
}

function BenchSpot({
  id,
  label,
  player,
  editable,
  selected,
  onTapSlot,
}: {
  id: string;
  /** "Interchange 1", "Emergency 2"… */
  label: string;
  player?: BoardPlayer;
  editable: boolean;
  selected: string | null;
  onTapSlot: (slot: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !editable });
  const draggable = useDraggable({ id: player?.id ?? `empty-${id}`, disabled: !editable || !player });
  return (
    <div
      ref={editable ? setNodeRef : undefined}
      className={cn("board-seat", isOver && "board-seat-over", selected && !player && editable && "board-seat-ready")}
    >
      {player ? (
        <button
          ref={draggable.setNodeRef}
          type="button"
          {...(editable ? draggable.listeners : {})}
          {...(editable ? draggable.attributes : {})}
          onClick={() => onTapSlot(id)}
          aria-pressed={selected === player.id}
          aria-label={`${player.name}, ${label}`}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl p-1",
            selected === player.id && "ring-2 ring-red",
            draggable.isDragging && "opacity-30",
          )}
        >
          <span className="relative">
            <Avatar name={player.name} src={player.image} size={32} />
            {player.guernsey != null && <span className="board-number">{player.guernsey}</span>}
          </span>
          <span className="max-w-16 truncate text-[11px] font-semibold text-white">{player.name.split(" ")[0]}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onTapSlot(id)}
          aria-label={`${label}, empty`}
          className="size-full min-h-14 rounded-xl text-xs font-bold text-white/40"
        >
          {id}
        </button>
      )}
    </div>
  );
}

function PoolDrop({ className, children }: { className?: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL });
  return (
    <div
      ref={setNodeRef}
      className={cn("min-w-0 rounded-2xl bg-white p-4 transition-colors", isOver && "bg-red/10", className)}
    >
      {children}
    </div>
  );
}

function PoolToken({
  player,
  selected,
  onTap,
}: {
  player: BoardPlayer;
  selected: boolean;
  onTap: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: player.id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={() => onTap(player.id)}
      aria-pressed={selected}
      className={cn("touch-none rounded-full", isDragging && "opacity-30", selected && "ring-2 ring-red ring-offset-2")}
    >
      <Chip player={player} />
    </button>
  );
}

function Chip({ player, lifted }: { player: BoardPlayer; lifted?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-white py-1 pr-3 pl-1 text-left text-ink",
        lifted && "rotate-3 shadow-stamp",
      )}
    >
      <span className="relative">
        <Avatar name={player.name} src={player.image} size={30} />
        <span
          className={cn(
            "absolute -top-0.5 -left-0.5 size-2.5 rounded-full ring-2 ring-white",
            player.status === "yes" ? "bg-grass" : player.status === "no" ? "bg-red" : "bg-ink/20",
          )}
        />
      </span>
      <span className="max-w-24 truncate text-xs font-semibold">
        {player.guernsey != null && <span className="mr-1 text-ink/50">{player.guernsey}</span>}
        {player.name.split(" ")[0]}
      </span>
    </span>
  );
}

function PlayerCard({
  player,
  spot,
  editable,
  onBench,
  onRemove,
  onClose,
}: {
  player: BoardPlayer;
  spot?: string;
  editable: boolean;
  onBench: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const positions = [player.position, player.secondaryPosition]
    .filter((p) => p !== null)
    .map(positionLabel)
    .join(" / ");
  return (
    <div className="rounded-2xl bg-navy p-4 text-white">
      <div className="flex items-center gap-3">
        <span className="relative">
          <Avatar name={player.name} src={player.image} size={52} className="ring-2 ring-white" />
          {player.guernsey != null && <span className="board-number board-number-lg">{player.guernsey}</span>}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-2xl font-bold leading-tight">{player.name}</p>
          <p className="text-sm text-powder">{positions}</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-white/10 p-2">
          <dt className="text-xs text-powder">This week</dt>
          <dd className="font-semibold">{spot ? SLOT_LABEL.get(spot) : "Not picked"}</dd>
        </div>
        <div className="rounded-xl bg-white/10 p-2">
          <dt className="text-xs text-powder">Availability</dt>
          <dd className="font-semibold">{STATUS_TEXT[player.status ?? "null"]}</dd>
        </div>
      </dl>
      {editable && spot && <p className="mt-3 text-xs text-powder">Tap any spot on the ground to move them there.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {editable && spot && !BENCH_SLOTS.includes(spot) && !EMERGENCY_SLOTS.includes(spot) && (
          <Button variant="ghost" className="min-h-9 bg-white/10 text-white hover:bg-white/20" onClick={onBench}>
            Move to bench
          </Button>
        )}
        {editable && spot && (
          <Button variant="ghost" className="min-h-9 bg-white/10 text-white hover:bg-white/20" onClick={onRemove}>
            Take off the team
          </Button>
        )}
        <Button variant="ghost" className="ml-auto min-h-9 text-white hover:bg-white/10" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
