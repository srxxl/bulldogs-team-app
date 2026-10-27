import { describe, expect, it } from "vitest";
import {
  type AutoFillPlayer,
  autoFill,
  BENCH_SLOTS,
  EMERGENCY_SLOTS,
  FIELD_SLOTS,
  GROUND,
  MARKER,
  validateLineup,
} from "./positions";

const { width: W, height: H } = GROUND;
const r = (MARKER * W) / 2;
const inGround = (x: number, y: number) => ((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2 <= 1;

describe("field positions", () => {
  const centres = FIELD_SLOTS.map((s) => ({ id: s.id, x: s.x * W, y: s.y * H }));

  it("has the 18 AFL positions, a 4-player interchange and 2 emergencies", () => {
    expect(FIELD_SLOTS).toHaveLength(18);
    expect(BENCH_SLOTS).toHaveLength(4);
    expect(EMERGENCY_SLOTS).toHaveLength(2);
  });

  it("mirrors the forward and back halves", () => {
    const at = (id: string) => FIELD_SLOTS.find((s) => s.id === id);
    for (const [f, b] of [
      ["FF", "FB"],
      ["CHF", "CHB"],
      ["FPL", "BPL"],
      ["HFFR", "HBFR"],
    ]) {
      expect(at(f)?.x).toBeCloseTo(at(b)?.x ?? 0);
      expect(at(f)?.y).toBeCloseTo(1 - (at(b)?.y ?? 0));
    }
  });

  it("keeps every position marker inside the boundary", () => {
    for (const c of centres) {
      for (let a = 0; a < 2 * Math.PI; a += Math.PI / 8) {
        expect(inGround(c.x + r * Math.cos(a), c.y + r * Math.sin(a)), c.id).toBe(true);
      }
    }
  });

  it("never overlaps two markers", () => {
    for (const a of centres) {
      for (const b of centres) {
        if (a.id < b.id) expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.id}/${b.id}`).toBeGreaterThanOrEqual(2 * r);
      }
    }
  });
});

describe("validateLineup", () => {
  it("rejects unknown slots and double-ups", () => {
    expect(validateLineup({ FF: "a", C: "b", I1: "c" })).toBeNull();
    expect(validateLineup({ XX: "a" })).toMatch(/Unknown/);
    expect(validateLineup({ FF: "a", C: "a" })).toMatch(/one spot/);
  });
});

describe("autoFill", () => {
  const p = (
    id: string,
    position: AutoFillPlayer["position"],
    available = true,
    secondaryPosition: AutoFillPlayer["secondaryPosition"] = null,
  ) => ({
    id,
    position,
    secondaryPosition,
    available,
  });

  it("matches positions, keeps placed players and skips people who aren't in", () => {
    const players = [
      p("ruck", "ruck"),
      p("fwd", "forward"),
      p("def", "defender"),
      p("out", "forward", false),
      p("mid", "midfielder"),
    ];
    const filled = autoFill({ FB: "def" }, players);
    expect(filled.FB).toBe("def");
    expect(filled.R).toBe("ruck");
    expect(filled.FPL).toBe("fwd");
    expect(filled.WL).toBe("mid");
    expect(Object.values(filled)).not.toContain("out");
    expect(new Set(Object.values(filled)).size).toBe(Object.values(filled).length);
  });

  it("fills the field, then the 4 interchange, then the 2 emergencies", () => {
    const players = Array.from({ length: 25 }, (_, i) => p(`p${i}`, "utility"));
    const filled = autoFill({}, players);
    expect(FIELD_SLOTS.every((s) => filled[s.id])).toBe(true);
    expect([...BENCH_SLOTS, ...EMERGENCY_SLOTS].every((s) => filled[s])).toBe(true);
    expect(Object.keys(filled)).toHaveLength(24);
    expect(validateLineup(filled)).toBeNull();
  });

  it("rejects the old 8-player bench slots", () => {
    expect(validateLineup({ I5: "a" })).toMatch(/Unknown/);
  });
});
