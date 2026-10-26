CREATE TYPE "public"."availability_status" AS ENUM('yes', 'maybe', 'no');--> statement-breakpoint
CREATE TYPE "public"."board" AS ENUM('fitness', 'nutrition');--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('game', 'training', 'social', 'other');--> statement-breakpoint
CREATE TYPE "public"."feedback_kind" AS ENUM('reflection', 'suggestion', 'shoutout');--> statement-breakpoint
CREATE TYPE "public"."position" AS ENUM('defender', 'midfielder', 'ruck', 'forward', 'utility');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('pending', 'player', 'captain', 'coach');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability" (
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "availability_status" NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_event_id_user_id_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "drill" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"how_to" text,
	"minutes" smallint,
	"focus" text,
	"link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "event_kind" NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"venue_name" text,
	"venue_address" text,
	"details" text,
	"round" text,
	"opponent" text,
	"is_home" boolean,
	"is_final" boolean DEFAULT false NOT NULL,
	"team_goals" smallint,
	"team_behinds" smallint,
	"opp_goals" smallint,
	"opp_behinds" smallint,
	"playhq_game_id" text,
	"cancelled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_playhqGameId_unique" UNIQUE("playhq_game_id")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "feedback_kind" NOT NULL,
	"event_id" text,
	"body" text NOT NULL,
	"submitted_on" date DEFAULT now() NOT NULL,
	"read_by_coach" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ladder_row" (
	"position" smallint PRIMARY KEY NOT NULL,
	"team" text NOT NULL,
	"played" smallint DEFAULT 0 NOT NULL,
	"won" smallint DEFAULT 0 NOT NULL,
	"lost" smallint DEFAULT 0 NOT NULL,
	"drawn" smallint DEFAULT 0 NOT NULL,
	"points_for" integer DEFAULT 0 NOT NULL,
	"points_against" integer DEFAULT 0 NOT NULL,
	"percentage" real DEFAULT 0 NOT NULL,
	"premiership_points" smallint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lineup_slot" (
	"event_id" text NOT NULL,
	"slot" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "lineup_slot_event_id_slot_pk" PRIMARY KEY("event_id","slot")
);
--> statement-breakpoint
CREATE TABLE "note" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pin" (
	"id" text PRIMARY KEY NOT NULL,
	"board" "board" NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"image_url" text,
	"tag" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"preferred_name" text,
	"guernsey" smallint,
	"position" "position" DEFAULT 'utility' NOT NULL,
	"secondary_position" "position",
	"photo_url" text,
	"bio" text,
	"years_playing" smallint,
	"footy_hero" text,
	"pre_game_song" text,
	"occupation" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guernsey_range" CHECK ("player_profile"."guernsey" between 1 and 99)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "session_drill" (
	"event_id" text NOT NULL,
	"drill_id" text NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "session_drill_event_id_drill_id_pk" PRIMARY KEY("event_id","drill_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "role" DEFAULT 'pending' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vote" (
	"event_id" text NOT NULL,
	"voter_id" text NOT NULL,
	"nominee_id" text NOT NULL,
	"points" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vote_event_id_voter_id_points_pk" PRIMARY KEY("event_id","voter_id","points"),
	CONSTRAINT "vote_points" CHECK ("vote"."points" in (1, 2, 3)),
	CONSTRAINT "vote_not_self" CHECK ("vote"."voter_id" <> "vote"."nominee_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill" ADD CONSTRAINT "drill_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_slot" ADD CONSTRAINT "lineup_slot_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_slot" ADD CONSTRAINT "lineup_slot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pin" ADD CONSTRAINT "pin_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_profile" ADD CONSTRAINT "player_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_drill" ADD CONSTRAINT "session_drill_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_drill" ADD CONSTRAINT "session_drill_drill_id_drill_id_fk" FOREIGN KEY ("drill_id") REFERENCES "public"."drill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_voter_id_user_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_nominee_id_user_id_fk" FOREIGN KEY ("nominee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_index" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "drill_title_index" ON "drill" USING btree ("title");--> statement-breakpoint
CREATE INDEX "event_starts_at_index" ON "event" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "event_kind_starts_at_index" ON "event" USING btree ("kind","starts_at");--> statement-breakpoint
CREATE INDEX "event_opponent_index" ON "event" USING btree ("opponent");--> statement-breakpoint
CREATE UNIQUE INDEX "lineup_slot_event_id_user_id_index" ON "lineup_slot" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "note_created_at_index" ON "note" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pin_board_created_at_index" ON "pin" USING btree ("board","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "player_profile_guernsey_index" ON "player_profile" USING btree ("guernsey");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_drill_event_id_position_index" ON "session_drill" USING btree ("event_id","position");--> statement-breakpoint
CREATE INDEX "verification_identifier_index" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "vote_event_id_voter_id_nominee_id_index" ON "vote" USING btree ("event_id","voter_id","nominee_id");--> statement-breakpoint
CREATE INDEX "vote_nominee_id_index" ON "vote" USING btree ("nominee_id");