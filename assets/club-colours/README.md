# Club colours and guernseys

Where the opposition clubs' colours and guernsey designs on the ladder come from. They cover the 69 current
Perth Football League clubs.

- `public/guernseys/<club>.svg` (Ellenbrook and Lynwood Ferndale are `.jpg`): the front of each club's
  guernsey, its design and its emblem where it has one. From the club table on the
  [Perth Football League article on Wikipedia](https://en.wikipedia.org/wiki/Perth_Football_League),
  downloaded from Wikimedia Commons in October 2026. The ladder shows it as a small guernsey on each row,
  and each team's page uses it as the header's wallpaper.
- `colours.json` (here): for each club, by the name Wikipedia uses, its guernsey file, the original Commons
  file name, and the main colours read from the image, largest area first. Kalamunda's were set by hand.
  Teams with no colours show in neutral slate. `src/lib/club-colours.data.ts` is made from this; change both together.

Things to know:

- The colours are a starting point and haven't been checked with each club. Wikipedia's images can be out of
  date, and the two `.jpg` images are photos, so their colours came through less cleanly.
- Ladder team names may not match Wikipedia's (for example "Mt Lawley" against "Mount Lawley"), so the app
  matches names loosely (`teamKey` in `src/lib/club-colours.ts`).
- The emblems are the clubs' own marks. The app is behind a login, which keeps the risk low, but don't show
  them anywhere public, and check each file's licence on its Commons page (`wikimediaFile`) first.
