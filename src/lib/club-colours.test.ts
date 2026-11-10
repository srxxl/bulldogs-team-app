import { describe, expect, it } from "vitest";
import {
  clubColours,
  clubDesignSide,
  clubGuernsey,
  contrast,
  sameTeam,
  teamKey,
  teamSlug,
  teamTheme,
} from "./club-colours";
import { CLUB_COLOURS } from "./club-colours.data";

describe("club colours", () => {
  it("matches team names however they're written", () => {
    expect(sameTeam("Mt Lawley", "Mount Lawley")).toBe(true);
    expect(sameTeam("Kingsley Amateur FC", "kingsley")).toBe(true);
    expect(sameTeam("Manning Rippers Women's", "Manning Rippers")).toBe(true);
    expect(sameTeam("Kingsley", "Kingsway")).toBe(false);
    expect(teamKey("Bullcreek Leeming C3")).toBe("bullcreek leeming");
    expect(teamSlug("Mt Lawley")).toBe("mount-lawley");
  });

  it("finds a club's colours by its full name or a shorter one", () => {
    expect(clubColours("Carlisle")).toEqual(CLUB_COLOURS.Carlisle);
    expect(clubColours("Manning")).toEqual(CLUB_COLOURS["Manning Rippers"]);
    expect(clubColours("Nowhere Town")).toEqual([]);
  });

  it("finds a club's guernsey the same way", () => {
    expect(clubGuernsey("Bayswater")).toBe("/guernseys/bayswater.svg");
    expect(clubGuernsey("Mt Lawley")).toBe("/guernseys/mount-lawley.svg");
    expect(clubGuernsey("Nowhere Town")).toBeNull();
    // the design goes on the side that keeps the club's emblem clear of the fade
    expect(clubDesignSide("Hills Rangers")).toBe("left");
    expect(clubDesignSide("Bayswater")).toBe("right");
    expect(clubDesignSide("Nowhere Town")).toBe("right");
  });

  it("themes every club so its text is readable", () => {
    for (const name of Object.keys(CLUB_COLOURS)) {
      const t = teamTheme(name);
      expect(contrast(t.primary, t.onPrimary)).toBeGreaterThanOrEqual(3);
      expect(contrast(t.secondary, t.onSecondary)).toBeGreaterThanOrEqual(3);
      expect(contrast(t.accent, "#ffffff")).toBeGreaterThanOrEqual(3);
      expect(contrast(t.badge, "#ffffff")).toBeGreaterThanOrEqual(1.5);
      expect(contrast(t.badge, t.onBadge)).toBeGreaterThanOrEqual(3);
      expect(contrast(t.primary, t.numeral)).toBeGreaterThanOrEqual(2.5);
    }
  });

  it("never uses white as a club's main colour, and wears our own club colours", () => {
    expect(teamTheme("Mount Lawley").primary).not.toBe("#ffffff");
    expect(teamTheme("Brentwood Booragoon")).toMatchObject({
      primary: "#28357c",
      secondary: "#d32427",
      mark: "#28357c",
    });
    // a club we have no colours for is neutral, not dressed in ours
    expect(teamTheme("Nowhere Town")).toMatchObject({ known: false, primary: "#5c6178" });
    // every colour the club has, main one first
    expect(teamTheme("Mount Lawley").colours).toEqual(["#f20017", "#ffffff", "#080204"]);
    expect(teamTheme("Hills Rangers").colours).toHaveLength(3);
    // chart marks are solid club colours: the one furthest from our navy, plus a second of theirs
    expect(teamTheme("Koongamia").mark).not.toBe("#0d1d41");
    expect(teamTheme("Koongamia").mark2).not.toBe(teamTheme("Koongamia").mark);
    expect(teamTheme("Bayswater").mark).not.toBe("#ffffff");
    for (const name of Object.keys(CLUB_COLOURS)) {
      expect(contrast(teamTheme(name).mark, "#ffffff")).toBeGreaterThanOrEqual(2);
      // team pages: the darkest colour for headings, the second darkest for bars, both readable on white
      expect(contrast(teamTheme(name).title, "#ffffff")).toBeGreaterThanOrEqual(3);
      expect(contrast(teamTheme(name).bar, "#ffffff")).toBeGreaterThanOrEqual(2);
    }
    expect(teamTheme("Hills Rangers")).toMatchObject({ title: "#262a33", bar: "#fe4f00" });
    expect(teamTheme("Brentwood Booragoon")).toMatchObject({ title: "#28357c", bar: "#d32427" });
    // the header's ladder number wears a third club colour when there is one that reads on the main colour
    expect(teamTheme("Koongamia").numeral).toBe("#ffd300");
    expect(teamTheme("Bayswater").numeral).toBe("#ffffff");
    // Baldivis's third colour, navy, is all but its header's ink text, so its yellow goes there instead
    expect(teamTheme("Baldivis").numeral).toBe("#fed711");
    // Dianella Morley's third colour is white, so its fourth, red, goes there
    expect(teamTheme("Dianella Morley").numeral).toBe("#ef0b26");
    // a two-colour club wears its second colour there
    expect(teamTheme("Cockburn Cobras").numeral).toBe("#ffc000");
  });
});
