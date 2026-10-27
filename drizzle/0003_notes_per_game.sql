DROP INDEX "note_created_at_index";--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "event_id" text;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "note_event_id_created_at_index" ON "note" USING btree ("event_id","created_at");