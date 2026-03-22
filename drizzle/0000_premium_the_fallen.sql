CREATE TYPE "public"."certificate_type" AS ENUM('SHM', 'HGB', 'SHSRS', 'girik', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('sale', 'rent');--> statement-breakpoint
CREATE TYPE "public"."login_type" AS ENUM('credential', 'google');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('IDR', 'USD');--> statement-breakpoint
CREATE TYPE "public"."properti_condition" AS ENUM('new', 'used', 'renovated');--> statement-breakpoint
CREATE TYPE "public"."properti_status" AS ENUM('active', 'sold', 'rented', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."properti_type" AS ENUM('house', 'apartment', 'villa', 'land', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."rent_period" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('member', 'admin', 'moderator');--> statement-breakpoint
CREATE TABLE "detail_properti" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"properti_id" uuid NOT NULL,
	"land_area" numeric(10, 2),
	"building_area" numeric(10, 2),
	"floor_count" integer,
	"bedroom_count" integer,
	"bathroom_count" integer,
	"garage_count" integer,
	"carport_count" integer,
	"condition" "properti_condition",
	"certificate_type" "certificate_type",
	"year_built" integer,
	"facing_direction" varchar(20),
	"is_furnished" boolean DEFAULT false NOT NULL,
	"has_swimming_pool" boolean DEFAULT false NOT NULL,
	"has_garden" boolean DEFAULT false NOT NULL,
	"has_security" boolean DEFAULT false NOT NULL,
	"has_ac" boolean DEFAULT false NOT NULL,
	"has_wifi" boolean DEFAULT false NOT NULL,
	"has_parking" boolean DEFAULT false NOT NULL,
	"electricity_capacity" integer,
	"water_source" varchar(100),
	"additional_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "detail_properti_properti_id_unique" UNIQUE("properti_id")
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp_code" varchar(6) NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properti" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" "properti_type" NOT NULL,
	"status" "properti_status" DEFAULT 'active' NOT NULL,
	"listing_type" "listing_type" NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"price_unit" "price_unit" DEFAULT 'IDR' NOT NULL,
	"rent_period" "rent_period",
	"address" text NOT NULL,
	"province" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"district" varchar(100) NOT NULL,
	"postal_code" varchar(10),
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"thumbnail" text NOT NULL,
	"video_url" text,
	"meta_title" varchar(255),
	"meta_description" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "properti_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "properti_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"properti_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"caption" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50),
	"phone" varchar(20),
	"full_name" varchar(255) NOT NULL,
	"password" text,
	"user_type" "user_type" DEFAULT 'member' NOT NULL,
	"profile_photo" text,
	"date_of_birth" timestamp,
	"gender" "gender",
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_login" timestamp,
	"login_type" "login_type" DEFAULT 'credential' NOT NULL,
	"google_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "detail_properti" ADD CONSTRAINT "detail_properti_properti_id_properti_id_fk" FOREIGN KEY ("properti_id") REFERENCES "public"."properti"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properti" ADD CONSTRAINT "properti_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properti_images" ADD CONSTRAINT "properti_images_properti_id_properti_id_fk" FOREIGN KEY ("properti_id") REFERENCES "public"."properti"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;