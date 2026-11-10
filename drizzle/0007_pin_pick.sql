CREATE TABLE "pin_cheer" (
	"done_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pin_cheer_done_id_user_id_pk" PRIMARY KEY("done_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "pin_pick" (
	"pin_id" text NOT NULL,
	"week_of" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pin_pick_pin_id_week_of_pk" PRIMARY KEY("pin_id","week_of")
);
--> statement-breakpoint
ALTER TABLE "pin_cheer" ADD CONSTRAINT "pin_cheer_done_id_pin_done_id_fk" FOREIGN KEY ("done_id") REFERENCES "public"."pin_done"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pin_cheer" ADD CONSTRAINT "pin_cheer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pin_pick" ADD CONSTRAINT "pin_pick_pin_id_pin_id_fk" FOREIGN KEY ("pin_id") REFERENCES "public"."pin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pin_pick_week_of_index" ON "pin_pick" USING btree ("week_of");--> statement-breakpoint
INSERT INTO "pin_pick" ("pin_id", "week_of") SELECT "id", "week_of" FROM "pin" WHERE "week_of" IS NOT NULL;
