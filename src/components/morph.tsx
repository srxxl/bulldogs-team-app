import { type ReactNode, ViewTransition } from "react";

/**
 * Something in a list that turns into the header of the page it opens: a fixture row into its game, a ladder row
 * into its team, a player card into their page, a board's cover into the board. Give both ends the same name and, when you open it, the browser
 * grows the one into the other; going back shrinks it into its row again (styled by the .morph view transition
 * class in globals.css). A name must be on one element per page, so name only the list rows, not a second link
 * to the same thing.
 */
export function Morph({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}

export const morphName = {
  event: (id: string) => `event-${id}`,
  team: (slug: string) => `team-${slug}`,
  player: (id: string) => `player-${id}`,
  board: (board: string) => `board-${board}`,
};
