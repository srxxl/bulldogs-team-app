import { isUs } from "@/lib/club";
import { CLUB_COLOURS, CLUB_GUERNSEYS, DESIGN_ON_LEFT } from "@/lib/club-colours.data";

/**
 * A team name boiled down for matching: the ladder, our fixture and Wikipedia's club table don't always
 * agree ("Mt Lawley" and "Mount Lawley", "Kingsley Amateur FC", "Manning Rippers Women").
 */
export function teamKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bmt\b\.?/g, "mount")
    .replace(
      /\b(football club|amateur football club|amateur|fc|afc|women'?s|womens|women|ladies|c\d+|reserves?)\b/g,
      " ",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Whether two names are the same team, however each source writes it. */
export const sameTeam = (a: string, b: string) => teamKey(a) === teamKey(b);

/** The team's page address on the ladder: "Mt Lawley" is /ladder/mount-lawley. */
export const teamSlug = (name: string) => teamKey(name).replace(/ /g, "-");

/** The club a team belongs to, matched by name (exactly, or one name starting with the other: "Manning" is "Manning Rippers"). */
function findClub(team: string): string | null {
  const key = teamKey(team);
  const clubs = Object.keys(CLUB_COLOURS).map((name) => [teamKey(name), name] as const);
  const match =
    clubs.find(([k]) => k === key) ?? clubs.find(([k]) => k.startsWith(`${key} `) || key.startsWith(`${k} `));
  return match?.[1] ?? null;
}

/** A club's colours, largest area first (none if we don't know the club). */
export function clubColours(team: string): readonly string[] {
  const club = findClub(team);
  return club ? CLUB_COLOURS[club] : [];
}

/** The front of a club's guernsey, its design and emblem, as an image path (null if we don't have it). */
export function clubGuernsey(team: string): string | null {
  const club = findClub(team);
  return club ? (CLUB_GUERNSEYS[club] ?? null) : null;
}

/** Which side of a team page's header a club's design goes on, so its emblem stays clear of the fade. */
export function clubDesignSide(team: string): "left" | "right" {
  const club = findClub(team);
  return club && DESIGN_ON_LEFT.has(club) ? "left" : "right";
}

const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
/** WCAG relative luminance. */
function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** WCAG contrast ratio between two colours (1 to 21). */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = "#ffffff";
const INK = "#151b45";
const NAVY = "#28357c";
const RED = "#d32427";
/** Neutral greys, faintly blue like the rest of the app, for clubs whose colours we don't know. */
const SLATE = "#5c6178";
const MIST = "#dfe2ea";
/** Readable text on a colour: white or ink, whichever stands out more. */
const textOn = (bg: string) => (contrast(bg, WHITE) >= contrast(bg, INK) ? WHITE : INK);
const nearWhite = (hex: string) => luminance(hex) > 0.85;

/** Equal stripes of each colour, at `angle`, for a CSS background. */
export const stripes = (colours: readonly string[], angle = "135deg") =>
  colours.length === 0
    ? "transparent"
    : `linear-gradient(${angle}, ${colours
        .map((c, i) => `${c} ${(i * 100) / colours.length}% ${((i + 1) * 100) / colours.length}%`)
        .join(", ")})`;

export type TeamTheme = {
  /** The club's main colour, for the header. */
  primary: string;
  onPrimary: string;
  /** Its second colour, for the stripe and chips. */
  secondary: string;
  onSecondary: string;
  /** Whichever club colour reads on white, for numbers and links on white panels. */
  accent: string;
  /** A chip on a white panel: the second colour, unless it's too pale to see there. */
  badge: string;
  onBadge: string;
  /** False when we don't know the club's colours (it then wears neutral navy and powder). */
  known: boolean;
  /** All the club's colours, main one first: for stripes and chips that show every colour. */
  colours: readonly string[];
  /**
   * Solid colours for this club's chart marks on white panels. `mark` is the club colour that stands furthest
   * from our navy, for anything shown beside our own marks; `mark2` is another of its colours (or the same if it
   * has only one), so a page shows more than one club colour.
   */
  mark: string;
  mark2: string;
  /**
   * A team page's own colours: the club's darkest colour for headings (`title`) and its second darkest for chart
   * bars (`bar`), leaving out whites and anything too pale to see on white.
   */
  title: string;
  bar: string;
  /**
   * The big ladder number in the header: the club's third colour (or a fourth, when the third is white), or its
   * second when those look like the header's text anyway, as long as it shows on the main colour. Otherwise the
   * header's text colour.
   */
  numeral: string;
};

/** The colours that stand out on a white panel as a chart bar (not white, pale tints or bright yellow). */
const onWhite = (colours: readonly string[]) => colours.filter((c) => contrast(c, WHITE) >= 2);
/** How far apart two colours look, roughly (0 to about 440). */
const distance = (a: string, b: string) => Math.hypot(...rgb(a).map((v, i) => (v - rgb(b)[i]) * 255));

/**
 * A team's page colours. The main colour is the club's first colour that isn't white; the second is the
 * next one (or white). Text colours are picked for contrast, so any club's colours stay readable. We
 * wear our own club navy and red rather than the reading from the image.
 */
/**
 * A team page's heading and bar colours (see TeamTheme.title): of the club's colours that show on white
 * (whites, pale tints and bright yellows left out), the darkest for headings and the second darkest for bars.
 * A club with one such colour uses it for both; one with none falls back to ink.
 */
function titleAndBar(colours: readonly string[]) {
  const [dark = INK, second = dark] = onWhite(colours).sort((a, b) => luminance(a) - luminance(b));
  return { title: contrast(dark, WHITE) >= 3 ? dark : INK, bar: second };
}

/** A club's two chart colours (see TeamTheme.mark): the one furthest from our navy, then another of its own. */
function marks(usable: readonly string[], fallback: string) {
  const pool = usable.length ? usable : [fallback];
  const mark = [...pool].sort((a, b) => distance(b, NAVY) - distance(a, NAVY))[0];
  return { mark, mark2: pool.find((c) => c !== mark) ?? mark };
}

/**
 * The header's ladder number colour (see TeamTheme.numeral). It's a huge outlined numeral (the position is also
 * in the page's text), so 2.5:1 on the main colour is enough to show.
 */
function numeral(colours: readonly string[], primary: string, secondary: string) {
  const text = textOn(primary);
  // its third colour (or fourth, past a white), then its second (a two-colour club's only other one)
  const extras = colours.filter((c) => c !== primary && c !== secondary);
  return (
    [...extras, secondary].find((c) => contrast(c, primary) >= 2.5 && distance(c, text) >= 60 && !nearWhite(c)) ?? text
  );
}

export function teamTheme(team: string): TeamTheme {
  const colours = isUs(team) ? [NAVY, RED, WHITE] : clubColours(team);
  const solid = colours.filter((c) => !nearWhite(c));
  if (solid.length === 0) {
    // no colours for this club: plain slate, so it doesn't pass for us or anyone else
    return {
      primary: SLATE,
      onPrimary: WHITE,
      secondary: MIST,
      onSecondary: INK,
      accent: SLATE,
      badge: SLATE,
      onBadge: WHITE,
      known: false,
      colours: [SLATE, MIST],
      mark: SLATE,
      mark2: SLATE,
      title: SLATE,
      bar: SLATE,
      numeral: WHITE,
    };
  }
  const primary = solid[0];
  const secondary = colours.find((c) => c !== primary) ?? WHITE;
  const accent = [primary, secondary].find((c) => contrast(c, WHITE) >= 3) ?? INK;
  const badge = contrast(secondary, WHITE) >= 1.5 ? secondary : primary;
  return {
    primary,
    onPrimary: textOn(primary),
    secondary,
    onSecondary: textOn(secondary),
    accent,
    badge,
    onBadge: textOn(badge),
    numeral: numeral(colours, primary, secondary),
    known: true,
    colours: [primary, ...colours.filter((c) => c !== primary)],
    ...titleAndBar(colours),
    // our own page charts in our navy, with red second
    ...(isUs(team) ? { mark: NAVY, mark2: RED } : marks(onWhite(colours), accent)),
  };
}
