import { describe, expect, it } from "vitest";
import { GAME_TILES, gamePhase, TILE_LAYOUT } from "./game-phase";

// bounce 12:20pm Saturday 14 November 2026, Perth (04:20 UTC)
const bounce = new Date("2026-11-14T04:20:00Z");

describe("gamePhase", () => {
  it("is before until game day in Perth", () => {
    expect(gamePhase(bounce, new Date("2026-11-13T12:00:00Z"))).toBe("before"); // 8pm Friday
    // 11:30pm Friday UTC is already 7:30am Saturday in Perth
    expect(gamePhase(bounce, new Date("2026-11-13T23:30:00Z"))).toBe("day");
  });

  it("is after from bounce, or as soon as there's a score", () => {
    expect(gamePhase(bounce, new Date("2026-11-14T04:19:00Z"))).toBe("day");
    expect(gamePhase(bounce, bounce)).toBe("after");
    expect(gamePhase(bounce, new Date("2026-11-10T00:00:00Z"), true)).toBe("after");
  });
});

describe("TILE_LAYOUT", () => {
  it("shows every tile once in every phase", () => {
    for (const tiles of Object.values(TILE_LAYOUT)) {
      expect(tiles.map((t) => t.tile).sort()).toEqual([...GAME_TILES].sort());
    }
  });
});
