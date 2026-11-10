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
import { Eraser, Sparkles } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { autoFill, BENCH_SLOTS, EMERGENCY_SLOTS, FIELD_SLOTS, GROUND, MARKER, sideways } from "@/lib/positions";
import { saveLineup } from "@/server/actions/lineup";
import { Avatar } from "../avatar";
import { GROUND_M, GroundLines } from "../ground-lines";
import { Button } from "../ui";
import type { BoardPlayer, Lineup } from "./types";

const POOL = "pool";

const SLOT_LABEL = new Map<string, string>([
  ...FIELD_SLOTS.map((s) => [s.id, s.label] as [string, string]),
  ...BENCH_SLOTS.map((s) => [s, `Interchange ${s.slice(1)}`] as [string, string]),
  ...EMERGENCY_SLOTS.map((s) => [s, `Emergency ${s.slice(1)}`] as [string, string]),
]);
const STATUS_ORDER = { yes: 0, null: 1, no: 2 } as const;

/**
 * The team board: a top-down oval with players on their positions.
 * Captains and coaches drag players on (or tap a player, then tap a spot), auto-fill from RSVPs
 * and save; everyone else just sees the team.
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

  // Every change saves itself, shortly after the last one (a quick run of moves is one save). Only the latest
  // save's answer counts, so a slow earlier one can't undo a newer lineup.
  const latestSave = useRef(0);
  useEffect(() => {
    if (!editable || !dirty) return;
    const n = ++latestSave.current;
    const timer = setTimeout(
      () =>
        start(async () => {
          const res = await saveLineup({ eventId, lineup });
          if (n !== latestSave.current) return;
          if (res.ok) setSaved(lineup);
          else setMessage({ ok: false, text: res.error });
        }),
      400,
    );
    return () => clearTimeout(timer);
  }, [editable, dirty, eventId, lineup]);
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

  /** Tap a player to pick them up; with one picked up, tap a spot to move them there. Only for whoever picks the team. */
  const tapPlayer = (id: string) => {
    if (editable) setSelected((s) => (s === id ? null : id));
  };
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
      text: added > 0 ? `Placed ${added} players who said they're in.` : "Everyone who's in is already placed",
    });
  }

  const board = (
    <div className="space-y-5">
      {editable && (
        <div className="space-y-2">
          {/* the bar above the ground: who's not picked on the left (drop players here to take them off), the
              buttons on the right */}
          <PoolDrop className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-chalk px-4 py-3">
            {/* a phone gives the players the whole row, and the buttons wrap underneath */}
            <div className="flex min-w-0 basis-full items-center gap-3 md:basis-0 md:flex-1">
              <h3 className="shrink-0 text-xl font-bold text-navy">Not picked</h3>
              <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto p-1">
                {pool.map((p) => (
                  <li key={p.id} className="shrink-0">
                    <PoolToken player={p} selected={selected === p.id} onTap={tapPlayer} />
                  </li>
                ))}
                {pool.length === 0 && <li className="self-center text-sm text-ink/50">Everyone's placed.</li>}
              </ul>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" onClick={fill}>
                <Sparkles size={16} /> Auto-fill
              </Button>
              <Button variant="ghost" onClick={() => setLineup({})} disabled={Object.keys(lineup).length === 0}>
                <Eraser size={16} /> Clear
              </Button>
            </div>
          </PoolDrop>
          {/* changes save themselves: "Saving…" only while one is on its way, and anything that needs saying */}
          {(pending || dirty || message) && (
            <p
              role="status"
              className={cn(
                "px-1 text-sm",
                message ? (message.ok ? "font-medium text-grass" : "font-medium text-red") : "text-ink/60",
              )}
            >
              {message ? message.text : "Saving…"}
            </p>
          )}
          {selectedPlayer && (
            <SelectedActions
              spot={slotOf.get(selectedPlayer.id)}
              onBench={() => toBench(selectedPlayer.id)}
              onRemove={() => {
                place(selectedPlayer.id, POOL);
                setSelected(null);
              }}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      )}

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

      <div className="board-bench grid gap-4 sm:grid-cols-[2fr_1fr]">
        {(
          [
            ["Interchange", BENCH_SLOTS],
            ["Emergencies", EMERGENCY_SLOTS],
          ] as const
        ).map(([title, slots]) => (
          <div key={title}>
            <h3 className="mb-2 px-1 text-lg font-bold text-white">{title}</h3>
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

      {editable && (
        <p className="text-sm text-ink/60">Drag players onto the ground, or tap a player and then tap a spot.</p>
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

/** Spot size as a fraction of the ground's width, now that it's drawn on its side (its long side across). */
const SPOT = (MARKER * GROUND.width) / GROUND.height;

/** The oval as a coach's whiteboard, on its side with forwards on the right, with real ground markings. */
function Ground({ children }: { children: React.ReactNode }) {
  return (
    <div className="board-ground">
      <div className="board-surface" aria-hidden>
        <svg
          aria-hidden
          viewBox={`0 0 ${GROUND_M.width} ${GROUND_M.height}`}
          className="absolute inset-0 size-full overflow-visible"
        >
          <GroundLines id="board-ground" />
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
  const at = sideways({ x, y });
  return (
    <div className="board-spot" style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%`, width: `${SPOT * 100}%` }}>
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
      <span className="board-face relative">
        {/* smaller on a phone, where the sideways ground is short */}
        <Avatar
          name={player.name}
          src={player.image}
          size="css"
          className="size-7 text-[0.72rem] ring-2 ring-white sm:size-[38px] sm:text-base lg:size-12 lg:text-xl"
        />
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
            <Avatar
              name={player.name}
              src={player.image}
              size="css"
              className="size-8 text-sm lg:size-10 lg:text-base"
            />
            {player.guernsey != null && <span className="board-number">{player.guernsey}</span>}
          </span>
          <span className="mt-1.5 max-w-16 truncate text-[11px] font-semibold text-white lg:mt-2 lg:max-w-20 lg:text-[13px]">
            {player.name.split(" ")[0]}
          </span>
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
      className={cn("touch-none rounded-2xl", isDragging && "opacity-30", selected && "ring-2 ring-red ring-offset-2")}
    >
      <Chip player={player} />
    </button>
  );
}

/**
 * A player not on the team yet, like a board token: face with the guernsey number over its bottom edge and their
 * first name. Players who can't make it are greyed out; anyone who hasn't said gets a dashed ring.
 */
function Chip({ player, lifted }: { player: BoardPlayer; lifted?: boolean }) {
  const status = player.status ?? "null";
  return (
    <span
      className={cn(
        "grid w-16 justify-items-center gap-0.5 rounded-2xl bg-white px-1 pt-1.5 pb-1 text-center text-ink",
        lifted && "rotate-3 shadow-stamp",
      )}
    >
      <span className="board-face relative">
        <Avatar
          name={player.name}
          src={player.image}
          size={34}
          className={cn(
            status === "no" && "opacity-45 grayscale",
            status === "null" && "outline-2 outline-offset-2 outline-navy/40 outline-dashed",
          )}
        />
        {player.guernsey != null && (
          <span className={cn("board-number", status === "no" && "board-number-out")}>{player.guernsey}</span>
        )}
      </span>
      <span className="mt-2 max-w-full truncate text-xs font-semibold">{player.name.split(" ")[0]}</span>
    </span>
  );
}

/** With a player picked up: where to tap next, and moving them to the bench or off the team. */
function SelectedActions({
  spot,
  onBench,
  onRemove,
  onClose,
}: {
  spot?: string;
  onBench: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-2xl bg-navy p-4 text-white">
      <p className="text-sm text-powder">Tap a spot on the ground to move them there.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {spot && !BENCH_SLOTS.includes(spot) && !EMERGENCY_SLOTS.includes(spot) && (
          <Button variant="ghost" className="min-h-9 bg-white/10 text-white hover:bg-white/20" onClick={onBench}>
            Move to bench
          </Button>
        )}
        {spot && (
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
