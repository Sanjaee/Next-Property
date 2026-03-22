CREATE TYPE "public"."image_type" AS ENUM('thumbnail', 'gallery', 'video');--> statement-breakpoint
ALTER TABLE "properti_images" ADD COLUMN "image_type" "image_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "properti" DROP COLUMN "thumbnail";--> statement-breakpoint
ALTER TABLE "properti" DROP COLUMN "video_url";--> statement-breakpoint
ALTER TABLE "properti_images" DROP COLUMN "caption";--> statement-breakpoint
ALTER TABLE "properti_images" DROP COLUMN "is_primary";