import { describe, expect, it } from "vitest";
import { type AutoFillPlayer, autoFill, FIELD_SLOTS, fieldPosition, GROUND, MARKER, validateLineup } from "./positions";

const { width: W, height: H } = GROUND;
const r = (MARKER * W) / 2;
const inGround = (x: number, y: number) => ((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2 <= 1;

describe("fieldPosition", () => {
  const centres = FIELD_SLOTS.map((s) => {
    const p = fieldPosition(s);
    return { id: s.id, x: p.x * W, y: p.y * H };
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

  it("sends extras to the bench once the field is full", () => {
    const players = Array.from({ length: 21 }, (_, i) => p(`p${i}`, "utility"));
    const filled = autoFill({}, players);
    expect(FIELD_SLOTS.every((s) => filled[s.id])).toBe(true);
    expect(["I1", "I2", "I3"].every((s) => filled[s])).toBe(true);
    expect(validateLineup(filled)).toBeNull();
  });
});
