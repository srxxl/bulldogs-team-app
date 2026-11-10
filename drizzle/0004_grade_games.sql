CREATE TABLE "grade_game" (
	"id" text PRIMARY KEY NOT NULL,
	"round" text,
	"starts_at" timestamp with time zone NOT NULL,
	"home" text NOT NULL,
	"away" text NOT NULL,
	"home_points" smallint,
	"away_points" smallint,
	"playhq_game_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grade_game_playhqGameId_unique" UNIQUE("playhq_game_id")
);
--> statement-breakpoint
CREATE INDEX "grade_game_starts_at_index" ON "grade_game" USING btree ("starts_at");