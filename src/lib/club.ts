export const CLUB = {
  name: "Brentwood Booragoon Bulldogs",
  short: "Bulldogs",
  ladderName: "Brentwood Booragoon",
  grade: "Women's C3",
  league: "Perth Football League",
  /** For tight spots, like beside a back button. */
  leagueShort: "PFL",
  homeGround: "Karoonda Reserve, Booragoon",
} as const;

export const isUs = (team: string) => team.toLowerCase().includes(CLUB.ladderName.toLowerCase());
