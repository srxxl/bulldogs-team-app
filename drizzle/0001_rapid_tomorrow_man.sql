ALTER TABLE "availability" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
-- "Maybe" is gone: clear those answers so the player is asked again (in or out).
DELETE FROM "availability" WHERE "status" = 'maybe';--> statement-breakpoint
DROP TYPE "public"."availability_status";--> statement-breakpoint
CREATE TYPE "public"."availability_status" AS ENUM('yes', 'no');--> statement-breakpoint
ALTER TABLE "availability" ALTER COLUMN "status" SET DATA TYPE "public"."availability_status" USING "status"::"public"."availability_status";