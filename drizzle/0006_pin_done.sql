CREATE TABLE "pin_done" (
	"id" text PRIMARY KEY NOT NULL,
	"pin_id" text NOT NULL,
	"user_id" text NOT NULL,
	"week_of" date NOT NULL,
	"distance_m" integer,
	"duration_s" integer,
	"note" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pin_done" ADD CONSTRAINT "pin_done_pin_id_pin_id_fk" FOREIGN KEY ("pin_id") REFERENCES "public"."pin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pin_done" ADD CONSTRAINT "pin_done_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pin_done_pin_id_user_id_week_of_index" ON "pin_done" USING btree ("pin_id","user_id","week_of");--> statement-breakpoint
CREATE INDEX "pin_done_week_of_index" ON "pin_done" USING btree ("week_of");