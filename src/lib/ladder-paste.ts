/**
 * Parses a ladder table a coach copied from the PlayHQ website and pasted in.
 * Browsers copy tables as tab-separated rows or one cell per line, so we
 * tokenise into cells and rebuild rows from the header.
 */

export type ParsedLadderRow = {
  position: number;
  team: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  pointsFor: number;
  pointsAgainst: number;
  percentage: number;
  premiershipPoints: number;
};

type NumericField = Exclude<keyof ParsedLadderRow, "position" | "team">;

const HEADER: Record<string, NumericField | "position" | "team" | "skip"> = {
  pos: "position",
  "#": "position",
  position: "position",
  team: "team",
  p: "played",
  played: "played",
  gp: "played",
  w: "won",
  won: "won",
  wins: "won",
  l: "lost",
  lost: "lost",
  losses: "lost",
  d: "drawn",
  drawn: "drawn",
  draws: "drawn",
  b: "skip",
  bye: "skip",
  byes: "skip",
  f: "pointsFor",
  pf: "pointsFor",
  for: "pointsFor",
  a: "pointsAgainst",
  pa: "pointsAgainst",
  against: "pointsAgainst",
  "%": "percentage",
  pct: "percentage",
  percentage: "percentage",
  pts: "premiershipPoints",
  points: "premiershipPoints",
  "comp pts": "premiershipPoints",
  form: "skip",
};

const isNumber = (s: string) => /^-?\d+(\.\d+)?%?$/.test(s);
const toNumber = (s: string) => Number.parseFloat(s.replace("%", ""));
const isFormCell = (s: string) => /^[WLDB](\s+[WLDB])*$/.test(s);

export type LadderParse = { rows: ParsedLadderRow[] } | { error: string };

export function parseLadderPaste(text: string): LadderParse {
  const cells = text
    .split(/\t|\r?\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  // The header is the first run of cells that are all known column names.
  const start = cells.findIndex((c) => HEADER[c.toLowerCase()] === "position");
  if (start === -1)
    return {
      error: "Couldn't find the ladder header. Copy the whole table including the top row.",
    };
  const columns: (NumericField | "skip")[] = [];
  let i = start + 1;
  if (HEADER[cells[i]?.toLowerCase()] !== "team") {
    return { error: "Expected a Team column after the position column." };
  }
  i++;
  while (i < cells.length && HEADER[cells[i].toLowerCase()] && HEADER[cells[i].toLowerCase()] !== "position") {
    const field = HEADER[cells[i].toLowerCase()];
    if (field !== "team") columns.push(field as NumericField | "skip");
    i++;
  }
  const numericCount = columns.filter((c) => c !== "skip").length;
  if (numericCount < 3) return { error: "The header is missing the P / W / L / points columns." };

  const rows: ParsedLadderRow[] = [];
  while (i < cells.length) {
    if (!/^\d+$/.test(cells[i])) {
      i++;
      continue;
    }
    const position = Number(cells[i++]);
    const nameParts: string[] = [];
    while (i < cells.length && !isNumber(cells[i])) nameParts.push(cells[i++]);
    const row: ParsedLadderRow = {
      position,
      team: nameParts.join(" ").replace(/\s+/g, " "),
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      percentage: 0,
      premiershipPoints: 0,
    };
    for (const col of columns) {
      while (i < cells.length && isFormCell(cells[i])) i++;
      const cell = cells[i];
      if (cell === undefined || !isNumber(cell)) break;
      if (col !== "skip") row[col] = toNumber(cell);
      i++;
    }
    while (i < cells.length && isFormCell(cells[i])) i++;
    if (row.team) rows.push(row);
  }

  if (rows.length === 0) return { error: "Found the header but no teams underneath it." };
  return { rows };
}
