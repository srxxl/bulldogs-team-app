import { describe, expect, it } from "vitest";
import { cleanTeamName, fixtureGameSchema, ladderSchema, mapFixtureGame, mapLadder } from "./map";

describe("PlayHQ mapping", () => {
  it("maps a fixture game from our side's perspective", () => {
    const game = fixtureGameSchema.parse({
      id: "g1",
      status: "UPCOMING",
      round: { name: "Round 3", isFinalRound: false },
      schedule: {
        date: "2027-04-24",
        time: "12:20:00",
        timezone: "Australia/Perth",
      },
      venue: {
        name: "Karoonda Reserve",
        surfaceName: "Oval 1",
        address: { line1: "Karoonda Rd", suburb: "Booragoon" },
      },
      competitors: [
        { id: "them", name: "Kingsway (WC3)", isHomeTeam: false },
        { id: "us", name: "Brentwood Booragoon (WC3)", isHomeTeam: true },
      ],
    });
    expect(mapFixtureGame(game, "us")).toMatchObject({
      title: "vs Kingsway",
      opponent: "Kingsway",
      isHome: true,
      round: "Round 3",
      venueName: "Karoonda Reserve, Oval 1",
      startsAt: new Date("2027-04-24T04:20:00Z"),
      teamGoals: null,
    });
  });

  it("skips unscheduled games", () => {
    expect(mapFixtureGame(fixtureGameSchema.parse({ id: "x", schedule: { date: "" } }), "us")).toBeNull();
  });

  it("maps ladder standings with field fallbacks", () => {
    const payload = ladderSchema.parse({
      data: [
        {
          ladders: [
            {
              standings: [
                {
                  team: { name: "Bayswater (WC3)" },
                  played: 3,
                  wins: 3,
                  losses: 0,
                  pointsFor: 90,
                  pointsAgainst: 30,
                  competitionPoints: 12,
                },
              ],
            },
          ],
        },
      ],
    });
    expect(mapLadder(payload)[0]).toMatchObject({
      position: 1,
      team: "Bayswater",
      won: 3,
      percentage: 300,
      premiershipPoints: 12,
    });
  });

  it("cleans grade suffixes from team names", () => {
    expect(cleanTeamName("Hills Rangers (WC3)")).toBe("Hills Rangers");
  });
});
