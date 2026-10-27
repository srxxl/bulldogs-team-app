"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  FRONT_ON,
  fetchBall,
  GREETING,
  type MascotState,
  nextSteps,
  type Pose,
  reactToTap,
  type Step,
} from "@/lib/mascot";

const START: Step = { pose: "stand", x: 12, facing: "right", ms: 900 };

/** The drawings in public/mascot. Every one faces left; the stage mirrors them to face right. */
const ART = ["stand", "turn", "walk", "run", "sit", "sleep", "sleep-right", "bark", "play", "hold", "show"] as const;
type Art = (typeof ART)[number];

/** Which drawing a moment uses, and whether to mirror it. Asleep facing right has its own file so the z's read right. */
function artFor(pose: Pose, facing: MascotState["facing"]): { art: Art; mirror: boolean } {
  if (pose === "sleep") return { art: facing === "right" ? "sleep-right" : "sleep", mirror: false };
  const art: Art = pose === "hop" ? "stand" : pose;
  return { art, mirror: facing === "right" && !FRONT_ON.has(pose) };
}

type Ball = { id: number; x: number };

/**
 * The home-screen bulldog, after VS Code Pets: it wanders on its own (walks, sits, naps, barks, play-bows),
 * turns through the slight-turn stance instead of snapping round, does a trick when tapped, and chases
 * the footy when you throw one (tap the grass, or the footy button). Holds still under reduced motion.
 */
export function HomeMascot() {
  const [step, setStep] = useState<Step>(START);
  const [ball, setBall] = useState<Ball | null>(null);
  const [still, setStill] = useState(false);
  const stateRef = useRef<MascotState>(START);
  const queue = useRef<Step[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const stage = useRef<HTMLDivElement>(null);

  // Play steps one after another; when the queue runs dry, the dog decides what to do next.
  const play = (steps: Step[]) => {
    window.clearTimeout(timer.current);
    queue.current = [...steps];
    advance();
  };
  const advance = () => {
    if (!queue.current.length) queue.current = nextSteps(stateRef.current);
    const next = queue.current.shift() as Step;
    stateRef.current = next;
    setStep(next);
    if (next.pose === "hold") setBall(null); // the footy is in its mouth now (it's part of the drawing)
    timer.current = window.setTimeout(advance, next.ms);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: play only touches refs and state setters.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      setStep({ ...START, pose: "sit" });
      return;
    }
    timer.current = window.setTimeout(() => play([GREETING]), START.ms);
    return () => window.clearTimeout(timer.current);
  }, []);

  const onTapDog = () => {
    if (!still) play(reactToTap(stateRef.current));
  };

  /** Throw the footy to a spot on the stage (0–100) and send the dog after it. */
  const throwBall = (x: number) => {
    if (still) return;
    const to = Math.min(96, Math.max(4, x));
    setBall({ id: Date.now(), x: to });
    play(fetchBall(stateRef.current, to));
  };

  const onTapGrass = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    throwBall(((e.clientX - r.left) / r.width) * 100);
  };

  const { art, mirror } = artFor(step.pose, step.facing);
  const moving = step.pose === "walk" || step.pose === "run";
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tapping the grass is a bonus; the footy button does the same for keyboards.
    <div ref={stage} className="mascot-stage" onClick={onTapGrass}>
      {ball && (
        <span key={ball.id} className="mascot-ball" style={{ left: `${ball.x}%` }} aria-hidden>
          <Footy />
        </span>
      )}
      <div
        className={cn("mascot", `mascot-${step.pose}`)}
        style={{
          left: `${step.x}%`,
          translate: `-${step.x}% 0`,
          transitionDuration: moving ? `${step.ms}ms` : "0ms",
        }}
      >
        <button type="button" className="mascot-dog" onClick={onTapDog} aria-label="Club bulldog. Tap to play.">
          {/* Every drawing stays mounted and only the current one shows, so switching pose is instant. */}
          <span className={cn("mascot-art", mirror && "mascot-mirror")}>
            {ART.map((name) => (
              // biome-ignore lint/performance/noImgElement: animated SVGs; next/image adds nothing here.
              <img
                key={name}
                src={`/mascot/${name}.svg`}
                alt=""
                data-on={name === art || undefined}
                draggable={false}
              />
            ))}
          </span>
        </button>
      </div>
      {!still && (
        <button
          type="button"
          className="mascot-throw"
          onClick={() => throwBall(stateRef.current.x > 50 ? 15 + Math.random() * 25 : 60 + Math.random() * 25)}
        >
          <Footy /> Throw the footy
        </button>
      )}
    </div>
  );
}

/** The footy, drawn to match the one the dog carries in hold.svg. */
function Footy() {
  // biome-ignore lint/performance/noImgElement: a small static SVG; next/image adds nothing here.
  return <img src="/mascot/footy.svg" alt="" className="mascot-footy" draggable={false} />;
}
