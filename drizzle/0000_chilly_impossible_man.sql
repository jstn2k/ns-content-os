CREATE TYPE "public"."account_status" AS ENUM('connected', 'disconnected', 'expired', 'error');--> statement-breakpoint
CREATE TYPE "public"."caption_status" AS ENUM('draft', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."caption_variant" AS ENUM('short', 'medium', 'long', 'story', 'reel_hook', 'cta', 'comment_reply');--> statement-breakpoint
CREATE TYPE "public"."categorization_source" AS ENUM('ai', 'manual');--> statement-breakpoint
CREATE TYPE "public"."job_state" AS ENUM('pending', 'creating_container', 'polling', 'publishing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('IMAGE', 'VIDEO', 'REEL', 'CAROUSEL', 'STORY');--> statement-breakpoint
CREATE TYPE "public"."publishing_mode" AS ENUM('manual', 'approval', 'auto');--> statement-breakpoint
CREATE TYPE "public"."queue_status" AS ENUM('draft', 'needs_review', 'approved', 'scheduled', 'published', 'failed');--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ig_account_id" uuid NOT NULL,
	"type" text NOT NULL,
	"result" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ig_account_id" uuid NOT NULL,
	"publishing_mode" "publishing_mode" DEFAULT 'approval' NOT NULL,
	"auto_enabled" boolean DEFAULT false NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_voice_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ig_account_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"summary" text,
	"tone" jsonb,
	"common_hooks" jsonb,
	"cta_styles" jsonb,
	"top_hashtags" jsonb,
	"emoji_style" jsonb,
	"avg_caption_words" numeric(8, 2),
	"format_ratios" jsonb,
	"sequencing_patterns" jsonb,
	"recurring_phrases" jsonb,
	"avoided_topics" jsonb,
	"raw" jsonb,
	"generated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ig_account_id" uuid,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"ig_account_id" uuid,
	"message" text NOT NULL,
	"context" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_captions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ig_account_id" uuid NOT NULL,
	"category_id" uuid,
	"variant" "caption_variant" DEFAULT 'medium' NOT NULL,
	"hook" text,
	"body" text,
	"cta" text,
	"hashtags" text[],
	"full_text" text,
	"status" "caption_status" DEFAULT 'draft' NOT NULL,
	"model" text,
	"prompt_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ig_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"ig_user_id" text NOT NULL,
	"username" text,
	"account_type" text,
	"status" "account_status" DEFAULT 'connected' NOT NULL,
	"scopes" text[],
	"profile" jsonb,
	"connected_at" timestamp with time zone DEFAULT now(),
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ig_account_id" uuid NOT NULL,
	"ig_media_id" text NOT NULL,
	"media_type" "media_type" NOT NULL,
	"caption" text,
	"posted_at" timestamp with time zone,
	"permalink" text,
	"media_url" text,
	"stored_thumbnail_path" text,
	"like_count" integer,
	"comments_count" integer,
	"hashtags" text[],
	"mentions" text[],
	"cta_text" text,
	"raw" jsonb,
	"imported_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ig_account_id" uuid NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"token_type" text DEFAULT 'long_lived' NOT NULL,
	"expires_at" timestamp with time zone,
	"last_refreshed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_categorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_post_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"source" "categorization_source" DEFAULT 'ai' NOT NULL,
	"confidence" numeric(5, 4),
	"is_correction" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_post_id" uuid NOT NULL,
	"reach" integer,
	"impressions" integer,
	"views" integer,
	"saved" integer,
	"shares" integer,
	"total_interactions" integer,
	"available" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queue_item_id" uuid NOT NULL,
	"state" "job_state" DEFAULT 'pending' NOT NULL,
	"container_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishing_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queue_item_id" uuid,
	"ig_account_id" uuid,
	"action" text NOT NULL,
	"request_summary" jsonb,
	"response_summary" jsonb,
	"status" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ig_account_id" uuid NOT NULL,
	"category_id" uuid,
	"caption_id" uuid,
	"media_type" "media_type",
	"media_path" text,
	"media_url" text,
	"caption" text,
	"hashtags" text[],
	"scheduled_at" timestamp with time zone,
	"status" "queue_status" DEFAULT 'draft' NOT NULL,
	"rhythm_fit_score" numeric(5, 4),
	"rhythm_explanation" text,
	"published_permalink" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_profiles" ADD CONSTRAINT "brand_voice_profiles_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_captions" ADD CONSTRAINT "generated_captions_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_captions" ADD CONSTRAINT "generated_captions_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ig_accounts" ADD CONSTRAINT "ig_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_posts" ADD CONSTRAINT "media_posts_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_categorizations" ADD CONSTRAINT "post_categorizations_media_post_id_media_posts_id_fk" FOREIGN KEY ("media_post_id") REFERENCES "public"."media_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_categorizations" ADD CONSTRAINT "post_categorizations_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_metrics" ADD CONSTRAINT "post_metrics_media_post_id_media_posts_id_fk" FOREIGN KEY ("media_post_id") REFERENCES "public"."media_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_jobs" ADD CONSTRAINT "publishing_jobs_queue_item_id_queue_items_id_fk" FOREIGN KEY ("queue_item_id") REFERENCES "public"."queue_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_logs" ADD CONSTRAINT "publishing_logs_queue_item_id_queue_items_id_fk" FOREIGN KEY ("queue_item_id") REFERENCES "public"."queue_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_logs" ADD CONSTRAINT "publishing_logs_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_ig_account_id_ig_accounts_id_fk" FOREIGN KEY ("ig_account_id") REFERENCES "public"."ig_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_caption_id_generated_captions_id_fk" FOREIGN KEY ("caption_id") REFERENCES "public"."generated_captions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analyses_ig_account_idx" ON "analyses" USING btree ("ig_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "app_settings_ig_account_unique" ON "app_settings" USING btree ("ig_account_id");--> statement-breakpoint
CREATE INDEX "brand_voice_profiles_ig_account_idx" ON "brand_voice_profiles" USING btree ("ig_account_id");--> statement-breakpoint
CREATE INDEX "content_categories_ig_account_idx" ON "content_categories" USING btree ("ig_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_categories_account_key_unique" ON "content_categories" USING btree ("ig_account_id","key");--> statement-breakpoint
CREATE INDEX "error_logs_scope_idx" ON "error_logs" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "generated_captions_ig_account_idx" ON "generated_captions" USING btree ("ig_account_id");--> statement-breakpoint
CREATE INDEX "generated_captions_category_idx" ON "generated_captions" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ig_accounts_ig_user_id_unique" ON "ig_accounts" USING btree ("ig_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_posts_ig_media_id_unique" ON "media_posts" USING btree ("ig_media_id");--> statement-breakpoint
CREATE INDEX "media_posts_ig_account_idx" ON "media_posts" USING btree ("ig_account_id");--> statement-breakpoint
CREATE INDEX "media_posts_posted_at_idx" ON "media_posts" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "oauth_tokens_ig_account_idx" ON "oauth_tokens" USING btree ("ig_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_categorizations_media_post_unique" ON "post_categorizations" USING btree ("media_post_id");--> statement-breakpoint
CREATE INDEX "post_categorizations_category_idx" ON "post_categorizations" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "post_metrics_media_post_idx" ON "post_metrics" USING btree ("media_post_id");--> statement-breakpoint
CREATE INDEX "publishing_jobs_queue_item_idx" ON "publishing_jobs" USING btree ("queue_item_id");--> statement-breakpoint
CREATE INDEX "publishing_jobs_state_idx" ON "publishing_jobs" USING btree ("state");--> statement-breakpoint
CREATE INDEX "publishing_logs_ig_account_idx" ON "publishing_logs" USING btree ("ig_account_id");--> statement-breakpoint
CREATE INDEX "queue_items_ig_account_idx" ON "queue_items" USING btree ("ig_account_id");--> statement-breakpoint
CREATE INDEX "queue_items_status_idx" ON "queue_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "queue_items_scheduled_at_idx" ON "queue_items" USING btree ("scheduled_at");