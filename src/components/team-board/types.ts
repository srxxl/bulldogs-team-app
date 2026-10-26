import type { AvailabilityStatus, Position } from "@/server/db/schema";

export type BoardPlayer = {
  id: string;
  name: string;
  guernsey: number | null;
  image: string | null;
  position: Position;
  secondaryPosition: Position | null;
  status: AvailabilityStatus | null;
};

/** slot id → player id */
export type Lineup = Record<string, string>;
