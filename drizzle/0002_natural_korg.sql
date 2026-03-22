ALTER TABLE "users" ALTER COLUMN "user_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DEFAULT 'member'::text;--> statement-breakpoint
UPDATE "users" SET "user_type" = 'premium' WHERE "user_type" = 'moderator';--> statement-breakpoint
DROP TYPE "public"."user_type";--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('member', 'admin', 'premium');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DEFAULT 'member'::"public"."user_type";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DATA TYPE "public"."user_type" USING "user_type"::"public"."user_type";
