"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  FRONT_ON,
  fetchBall,
  fetchSpot,
  GREETING,
  type MascotState,
  makeRoom,
  nextSteps,
  reactToTap,
  type Step,
  settled,
  TAP_ACTIONS,
  withTransitions,
} from "@/lib/mascot";

const START: Step = { pose: "stand", x: 12, facing: "right", ms: 900 };

/**
 * Where the dog was on the last page, so flicking to another page carries it on from the same spot rather than
 * starting over. Kept for this visit only (a reload starts fresh). `from` and `at` say where a walk started and
 * when, so a dog that was mid-walk picks up from wherever it had got to.
 */
let memory: { step: Step; from: number; at: number } | null = null;

/** Where the remembered dog is now, settled into a resting pose. */
function remembered(): Step | null {
  if (!memory) return null;
  const { step, from, at } = memory;
  const moving = step.pose === "walk" || step.pose === "run";
  const done = Math.min(1, (performance.now() - at) / Math.max(1, step.ms));
  const x = moving ? from + (step.x - from) * done : step.x;
  return { ...settled({ ...step, x }), ms: 1600 };
}

/** The drawings in public/mascot. Every one faces left; the stage mirrors them to face right. */
const ART = [
  "stand",
  "turn",
  "front",
  "walk",
  "run",
  "sit",
  "sitside",
  "beg",
  "sleep",
  "sleep-right",
  "bark",
  "play",
  "hold",
  "show",
] as const;
type Art = (typeof ART)[number];
/**
 * One-off animations (they play once, start to finish). An <img> can't restart an SVG's animation, so
 * these are fetched once and put inline, remounted each time they play.
 */
const ONCE = ["pickup", "sitdown", "standup", "sitdown-ball", "standup-ball"] as const;
type Once = (typeof ONCE)[number];
const isOnce = (name: string): name is Once => (ONCE as readonly string[]).includes(name);

/**
 * Which drawing a moment uses, and whether to mirror it. Asleep facing right has its own file so the z's
 * read right; lying down and getting up are the sitting drawing lowering or rising (see globals.css), and
 * dropping the footy is the plain sitting drawing (the footy falls on its own, from the stage). Turning
 * to sit front-on and back goes through the slight turn and the front-on standing drawing; sitting down
 * and standing up side-on are animated, with or without the footy.
 */
function artFor({ pose, facing, ball }: Step): { art: Art | Once; mirror: boolean } {
  if (pose === "sleep") return { art: facing === "right" ? "sleep-right" : "sleep", mirror: false };
  if (pose === "liedown" || pose === "getup" || pose === "drop" || pose === "sitfront")
    return { art: "sit", mirror: false };
  const mirror = facing === "right" && !FRONT_ON.has(pose);
  if (pose === "turnin" || pose === "turnout") return { art: "turn", mirror };
  if (pose === "facein" || pose === "faceout") return { art: "front", mirror };
  if (pose === "sitdown" || pose === "standup") return { art: ball ? `${pose}-ball` : pose, mirror };
  return { art: pose, mirror };
}

/** The footy on the stage: thrown there, or `dropped` from the sitting dog's mouth (it falls instead of flying in). */
type Ball = { id: number; x: number; dropped?: boolean };

/**
 * The club bulldog, after VS Code Pets (`small` beside every page title): it wanders on its own (walks, sits, naps, barks, play-bows),
 * turns through the slight-turn stance instead of snapping round, does a trick when tapped (begs, spins,
 * barks), and chases the footy when you throw one (tap anywhere on the grass), picking it up in its mouth.
 * Holds still under reduced motion.
 */
export function HomeMascot({ small = false }: { small?: boolean }) {
  // a fresh visit starts at START (as the server drew it); flicking between pages starts where the dog was
  const [step, setStep] = useState<Step>(() => (typeof window === "undefined" ? START : (remembered() ?? START)));
  const [ball, setBall] = useState<Ball | null>(null);
  const [hearts, setHearts] = useState<Burst[]>([]); // a burst of hearts per tap while it begs
  const [still, setStill] = useState(false);
  const [once, setOnce] = useState<Partial<Record<Once, string>>>({});
  const plays = useRef(0); // bumps on every step, so a one-off animation restarts each time
  const art = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<MascotState>(step);
  const queue = useRef<Step[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const stage = useRef<HTMLDivElement>(null);
  const dog = useRef<HTMLDivElement>(null);

  /**
   * Beside a page title, where the clear space starts (0 to 100 along the stage): the dog walks over the title
   * but moves past this before sitting, napping or doing a trick. 0 when there's no title, or no room beside it.
   */
  const clearFrom = (): number => {
    const title = stage.current?.closest("[data-title-row]")?.querySelector("h1");
    if (!title || !stage.current || !art.current) return 0;
    const room = stage.current.clientWidth - art.current.offsetWidth;
    if (room <= 0) return 0;
    const titleEnd = title.getBoundingClientRect().right - stage.current.getBoundingClientRect().left;
    const from = ((titleEnd + 8) / room) * 100;
    return from >= 95 ? 0 : Math.max(0, from);
  };

  /**
   * Where the dog really is right now. Mid-walk the state already holds where it's heading, so anything
   * that interrupts it (a tap, a throw) starts from its spot on screen instead: otherwise it would slide
   * on to the old target in its new pose, or run off facing the wrong way.
   */
  const here = (): MascotState => {
    const now = stateRef.current;
    if (!dog.current || !stage.current || (now.pose !== "walk" && now.pose !== "run")) return now;
    const room = stage.current.clientWidth - dog.current.offsetWidth;
    const left = dog.current.getBoundingClientRect().left - stage.current.getBoundingClientRect().left;
    stateRef.current = { ...now, x: Math.min(100, Math.max(0, (left / Math.max(1, room)) * 100)) };
    return stateRef.current;
  };

  // Play steps one after another; when the queue runs dry, the dog decides what to do next.
  const play = (steps: Step[]) => {
    window.clearTimeout(timer.current);
    queue.current = makeRoom(stateRef.current, steps, clearFrom());
    advance();
  };
  const advance = () => {
    if (!queue.current.length) queue.current = makeRoom(stateRef.current, nextSteps(stateRef.current), clearFrom());
    // sit down, lie down or get up first if this step needs a different posture
    const [next, ...after] = withTransitions(stateRef.current, queue.current.shift() as Step);
    queue.current = [...after, ...queue.current];
    memory = { step: next, from: stateRef.current.x, at: performance.now() };
    stateRef.current = next;
    plays.current += 1;
    setStep(next);
    if (next.pose === "pickup") setBall(null); // the pick-up drawing has the footy in it from here on
    if (next.pose === "drop") dropBall(next.x);
    timer.current = window.setTimeout(advance, next.ms);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: play only touches refs and state setters.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      setStep({ ...START, pose: "sit" });
      return;
    }
    // the greeting is for the first page only; after that it just carries on
    timer.current = memory ? window.setTimeout(advance, step.ms) : window.setTimeout(() => play([GREETING]), START.ms);
    for (const name of ONCE) {
      fetch(`/mascot/${name}.svg`)
        .then((r) => (r.ok ? r.text() : Promise.reject()))
        .then((svg) => setOnce((all) => ({ ...all, [name]: svg })))
        .catch(() => {}); // without it the dog just stands for that moment
    }
    return () => window.clearTimeout(timer.current);
  }, []);

  /** Barking or play-bowing, or on its way to begging, playing or barking: a tap waits for it to finish. */
  const busy = (now: MascotState) => TAP_ACTIONS.has(now.pose) || queue.current.some((s) => TAP_ACTIONS.has(s.pose));

  const onTapDog = () => {
    if (still) return;
    const now = here();
    if (now.pose === "beg") {
      const burst = heartBurst();
      setHearts((all) => [...all, burst]);
      window.setTimeout(() => setHearts((all) => all.filter((b) => b !== burst)), 1600);
    } else if (busy(now)) return; // let the action finish
    play(reactToTap(now));
  };

  /** Throw the footy to a spot on the stage (0–100) and send the dog after it, to stop with its mouth at the ball. */
  const throwBall = (x: number) => {
    if (still || !stage.current || !art.current) return;
    const stageW = stage.current.clientWidth;
    const from = here();
    const spot = fetchSpot(from, (x / 100) * stageW, stageW, art.current.offsetWidth);
    setBall({ id: Date.now(), x: (spot.ballPx / stageW) * 100 });
    play(fetchBall(from, spot.dogX));
  };

  /** Let the footy fall from the mouth of the dog sitting front-on at `x`: its mouth is mid-way across. */
  const dropBall = (x: number) => {
    if (!stage.current || !art.current) return;
    const stageW = stage.current.clientWidth;
    const dogW = art.current.offsetWidth;
    const middle = (x / 100) * (stageW - dogW) + dogW / 2;
    setBall({ id: Date.now(), x: (middle / stageW) * 100, dropped: true });
  };

  const onTapGrass = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    throwBall(((e.clientX - r.left) / r.width) * 100);
  };

  const { art: drawing, mirror } = artFor(step);
  const inline = isOnce(drawing) ? once[drawing] : undefined;
  const shown = isOnce(drawing) && !inline ? "stand" : drawing; // not loaded yet: stand for that moment
  const moving = step.pose === "walk" || step.pose === "run";
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: throwing the footy is a bonus; the dog itself is a button for keyboards.
    <div ref={stage} className={cn("mascot-stage", small && "mascot-stage-small")} onClick={onTapGrass}>
      {ball && (
        <span
          key={ball.id}
          className={cn("mascot-ball", ball.dropped && "mascot-ball-drop")}
          style={{ left: `${ball.x}%` }}
          aria-hidden
        >
          <Footy />
        </span>
      )}
      <div
        ref={dog}
        className={cn("mascot", `mascot-${step.pose}`)}
        style={{
          left: `${step.x}%`,
          translate: `-${step.x}% 0`,
          transitionDuration: moving ? `${step.ms}ms` : "0ms",
        }}
      >
        <button type="button" className="mascot-dog" onClick={onTapDog} aria-label="Club bulldog. Tap to play.">
          {/* Every drawing stays mounted and only the current one shows, so switching pose is instant. */}
          <span ref={art} className={cn("mascot-art", mirror && "mascot-mirror")}>
            {ART.map((name) => (
              // biome-ignore lint/performance/noImgElement: animated SVGs; next/image adds nothing here.
              <img
                key={name}
                src={`/mascot/${name}.svg`}
                alt=""
                data-on={name === shown || undefined}
                draggable={false}
              />
            ))}
            {inline && (
              // Our own drawing from public/mascot; remounted per play so its animation starts from the top.
              // biome-ignore lint/security/noDangerouslySetInnerHtml: a static SVG we ship, fetched from our own origin.
              <span key={plays.current} className="mascot-once" dangerouslySetInnerHTML={{ __html: inline }} />
            )}
          </span>
        </button>
        {hearts.map((burst) => (
          <span
            key={burst.id}
            className="mascot-hearts"
            style={{ left: step.facing === "right" ? "56%" : "44%" }}
            aria-hidden
          >
            {burst.hearts.map((heart) => (
              <Heart key={heart.key} dx={heart.dx} dy={heart.dy} size={heart.size} delay={heart.delay} />
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

type Burst = { id: number; hearts: HeartProps[] };
type HeartProps = { key: number; dx: number; dy: number; size: number; delay: number };

/** Three hearts flying off in random directions: anywhere from up-left to up-right, at random heights. */
function heartBurst(): Burst {
  const r = (min: number, max: number) => min + Math.random() * (max - min);
  return {
    id: Date.now() + Math.random(),
    hearts: [0, 1, 2].map((key) => ({
      key,
      dx: r(-2.4, 2.4),
      dy: r(-3.6, -1.8),
      size: r(0.75, 1.15),
      delay: key * r(0.06, 0.16),
    })),
  };
}

/** A small club-red heart, floated up over the begging dog's head when it's tapped. */
function Heart({ dx, dy, size, delay }: Omit<HeartProps, "key">) {
  const style = { "--dx": `${dx}rem`, "--dy": `${dy}rem`, width: `${size}rem`, animationDelay: `${delay}s` };
  return (
    <svg viewBox="0 0 24 22" className="mascot-heart" style={style as React.CSSProperties} aria-hidden="true">
      <path d="M12 21.5C5 16 0 11.6 0 6.6 0 2.9 2.9 0 6.5 0 8.8 0 10.8 1.2 12 3 13.2 1.2 15.2 0 17.5 0 21.1 0 24 2.9 24 6.6c0 5-5 9.4-12 14.9Z" />
    </svg>
  );
}

/** The footy, drawn to match the one the dog carries in hold.svg. */
function Footy() {
  // biome-ignore lint/performance/noImgElement: a small static SVG; next/image adds nothing here.
  return <img src="/mascot/footy.svg" alt="" className="mascot-footy" draggable={false} />;
}
