import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const mediaTypeEnum = pgEnum('media_type', [
  'IMAGE',
  'VIDEO',
  'REEL',
  'CAROUSEL',
  'STORY',
]);

export const accountStatusEnum = pgEnum('account_status', [
  'connected',
  'disconnected',
  'expired',
  'error',
]);

export const categorizationSourceEnum = pgEnum('categorization_source', [
  'ai',
  'manual',
]);

export const captionVariantEnum = pgEnum('caption_variant', [
  'short',
  'medium',
  'long',
  'story',
  'reel_hook',
  'cta',
  'comment_reply',
]);

export const captionStatusEnum = pgEnum('caption_status', [
  'draft',
  'approved',
  'rejected',
]);

export const queueStatusEnum = pgEnum('queue_status', [
  'draft',
  'needs_review',
  'approved',
  'scheduled',
  'published',
  'failed',
]);

export const publishingModeEnum = pgEnum('publishing_mode', [
  'manual',
  'approval',
  'auto',
]);

export const jobStateEnum = pgEnum('job_state', [
  'pending',
  'creating_container',
  'polling',
  'publishing',
  'done',
  'failed',
]);

/* ------------------------------------------------------------------ */
/* Shared timestamp columns                                          */
/* ------------------------------------------------------------------ */

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

/* ------------------------------------------------------------------ */
/* Users (single-tenant admin for MVP; table kept for future multi-user) */
/* ------------------------------------------------------------------ */

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('admin'),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Connected Instagram accounts                                      */
/* ------------------------------------------------------------------ */

export const igAccounts = pgTable(
  'ig_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    igUserId: text('ig_user_id').notNull(),
    username: text('username'),
    accountType: text('account_type'), // BUSINESS | MEDIA_CREATOR | etc.
    status: accountStatusEnum('status').notNull().default('connected'),
    scopes: text('scopes').array(),
    profile: jsonb('profile'), // raw profile payload (followers_count, etc.)
    connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('ig_accounts_ig_user_id_unique').on(t.igUserId)],
);

/* ------------------------------------------------------------------ */
/* OAuth tokens (encrypted at rest)                                  */
/* ------------------------------------------------------------------ */

export const oauthTokens = pgTable(
  'oauth_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    igAccountId: uuid('ig_account_id')
      .notNull()
      .references(() => igAccounts.id, { onDelete: 'cascade' }),
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    tokenType: text('token_type').notNull().default('long_lived'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('oauth_tokens_ig_account_idx').on(t.igAccountId)],
);

/* ------------------------------------------------------------------ */
/* Content categories / pillars (per-account, template-seeded)       */
/* ------------------------------------------------------------------ */

export const contentCategories = pgTable(
  'content_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    igAccountId: uuid('ig_account_id').references(() => igAccounts.id, {
      onDelete: 'cascade',
    }), // null = global default template pillar
    key: text('key').notNull(),
    label: text('label').notNull(),
    description: text('description'),
    isDefault: boolean('is_default').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index('content_categories_ig_account_idx').on(t.igAccountId),
    uniqueIndex('content_categories_account_key_unique').on(t.igAccountId, t.key),
  ],
);

/* ------------------------------------------------------------------ */
/* Imported media posts                                              */
/* ------------------------------------------------------------------ */

export const mediaPosts = pgTable(
  'media_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    igAccountId: uuid('ig_account_id')
      .notNull()
      .references(() => igAccounts.id, { onDelete: 'cascade' }),
    igMediaId: text('ig_media_id').notNull(),
    mediaType: mediaTypeEnum('media_type').notNull(),
    caption: text('caption'),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    permalink: text('permalink'),
    mediaUrl: text('media_url'), // expiring CDN url
    storedThumbnailPath: text('stored_thumbnail_path'), // re-hosted in storage
    likeCount: integer('like_count'),
    commentsCount: integer('comments_count'),
    hashtags: text('hashtags').array(),
    mentions: text('mentions').array(),
    ctaText: text('cta_text'),
    raw: jsonb('raw'), // full API payload
    importedAt: timestamp('imported_at', { withTimezone: true }).defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('media_posts_ig_media_id_unique').on(t.igMediaId),
    index('media_posts_ig_account_idx').on(t.igAccountId),
    index('media_posts_posted_at_idx').on(t.postedAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Post metrics (insights snapshots; multiple over time allowed)     */
/* ------------------------------------------------------------------ */

export const postMetrics = pgTable(
  'post_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mediaPostId: uuid('media_post_id')
      .notNull()
      .references(() => mediaPosts.id, { onDelete: 'cascade' }),
    reach: integer('reach'),
    impressions: integer('impressions'),
    views: integer('views'),
    saved: integer('saved'),
    shares: integer('shares'),
    totalInteractions: integer('total_interactions'),
    available: jsonb('available'), // which metrics the API actually returned
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [index('post_metrics_media_post_idx').on(t.mediaPostId)],
);

/* ------------------------------------------------------------------ */
/* Post categorizations (AI + manual corrections)                    */
/* ------------------------------------------------------------------ */

export const postCategorizations = pgTable(
  'post_categorizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mediaPostId: uuid('media_post_id')
      .notNull()
      .references(() => mediaPosts.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => contentCategories.id, { onDelete: 'cascade' }),
    source: categorizationSourceEnum('source').notNull().default('ai'),
    confidence: numeric('confidence', { precision: 5, scale: 4 }),
    isCorrection: boolean('is_correction').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('post_categorizations_media_post_unique').on(t.mediaPostId),
    index('post_categorizations_category_idx').on(t.categoryId),
  ],
);

/* ------------------------------------------------------------------ */
/* Brand voice profiles (versioned)                                  */
/* ------------------------------------------------------------------ */

export const brandVoiceProfiles = pgTable(
  'brand_voice_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    igAccountId: uuid('ig_account_id')
      .notNull()
      .references(() => igAccounts.id, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    summary: text('summary'),
    tone: jsonb('tone'),
    commonHooks: jsonb('common_hooks'),
    ctaStyles: jsonb('cta_styles'),
    topHashtags: jsonb('top_hashtags'),
    emojiStyle: jsonb('emoji_style'),
    avgCaptionWords: numeric('avg_caption_words', { precision: 8, scale: 2 }),
    formatRatios: jsonb('format_ratios'),
    sequencingPatterns: jsonb('sequencing_patterns'),
    recurringPhrases: jsonb('recurring_phrases'),
    avoidedTopics: jsonb('avoided_topics'),
    raw: jsonb('raw'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow(),
    ...timestamps,
  },
  (t) => [index('brand_voice_profiles_ig_account_idx').on(t.igAccountId)],
);

/* ------------------------------------------------------------------ */
/* Analyses (deterministic + AI analysis snapshots)                  */
/* ------------------------------------------------------------------ */

export const analyses = pgTable(
  'analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    igAccountId: uuid('ig_account_id')
      .notNull()
      .references(() => igAccounts.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // cadence | performance | sequencing | full
    result: jsonb('result').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [index('analyses_ig_account_idx').on(t.igAccountId)],
);

/* ------------------------------------------------------------------ */
/* Generated captions                                                */
/* ------------------------------------------------------------------ */

export const generatedCaptions = pgTable(
  'generated_captions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    igAccountId: uuid('ig_account_id')
      .notNull()
      .references(() => igAccounts.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => contentCategories.id, {
      onDelete: 'set null',
    }),
    variant: captionVariantEnum('variant').notNull().default('medium'),
    hook: text('hook'),
    body: text('body'),
    cta: text('cta'),
    hashtags: text('hashtags').array(),
    fullText: text('full_text'), // assembled hook+body+cta for convenience
    status: captionStatusEnum('status').notNull().default('draft'),
    model: text('model'),
    promptVersion: text('prompt_version'),
    ...timestamps,
  },
  (t) => [
    index('generated_captions_ig_account_idx').on(t.igAccountId),
    index('generated_captions_category_idx').on(t.categoryId),
  ],
);

/* ------------------------------------------------------------------ */
/* Content queue items                                               */
/* ------------------------------------------------------------------ */

export const queueItems = pgTable(
  'queue_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    igAccountId: uuid('ig_account_id')
      .notNull()
      .references(() => igAccounts.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => contentCategories.id, {
      onDelete: 'set null',
    }),
    captionId: uuid('caption_id').references(() => generatedCaptions.id, {
      onDelete: 'set null',
    }),
    mediaType: mediaTypeEnum('media_type'),
    mediaPath: text('media_path'), // storage path for uploaded media
    mediaUrl: text('media_url'), // public url passed to IG publishing API
    caption: text('caption'), // final caption text (may differ from generated)
    hashtags: text('hashtags').array(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    status: queueStatusEnum('status').notNull().default('draft'),
    rhythmFitScore: numeric('rhythm_fit_score', { precision: 5, scale: 4 }),
    rhythmExplanation: text('rhythm_explanation'),
    publishedPermalink: text('published_permalink'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('queue_items_ig_account_idx').on(t.igAccountId),
    index('queue_items_status_idx').on(t.status),
    index('queue_items_scheduled_at_idx').on(t.scheduledAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Publishing jobs (worker queue)                                    */
/* ------------------------------------------------------------------ */

export const publishingJobs = pgTable(
  'publishing_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    queueItemId: uuid('queue_item_id')
      .notNull()
      .references(() => queueItems.id, { onDelete: 'cascade' }),
    state: jobStateEnum('state').notNull().default('pending'),
    containerId: text('container_id'),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    lastError: text('last_error'),
    ...timestamps,
  },
  (t) => [
    index('publishing_jobs_queue_item_idx').on(t.queueItemId),
    index('publishing_jobs_state_idx').on(t.state),
  ],
);

/* ------------------------------------------------------------------ */
/* Publishing logs (immutable audit trail)                           */
/* ------------------------------------------------------------------ */

export const publishingLogs = pgTable(
  'publishing_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    queueItemId: uuid('queue_item_id').references(() => queueItems.id, {
      onDelete: 'set null',
    }),
    igAccountId: uuid('ig_account_id').references(() => igAccounts.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    requestSummary: jsonb('request_summary'),
    responseSummary: jsonb('response_summary'),
    status: text('status').notNull(),
    at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('publishing_logs_ig_account_idx').on(t.igAccountId)],
);

/* ------------------------------------------------------------------ */
/* Error logs                                                         */
/* ------------------------------------------------------------------ */

export const errorLogs = pgTable(
  'error_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scope: text('scope').notNull(),
    igAccountId: uuid('ig_account_id').references(() => igAccounts.id, {
      onDelete: 'set null',
    }),
    message: text('message').notNull(),
    context: jsonb('context'),
    at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('error_logs_scope_idx').on(t.scope)],
);

/* ------------------------------------------------------------------ */
/* App settings (per account)                                        */
/* ------------------------------------------------------------------ */

export const appSettings = pgTable(
  'app_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    igAccountId: uuid('ig_account_id')
      .notNull()
      .references(() => igAccounts.id, { onDelete: 'cascade' }),
    publishingMode: publishingModeEnum('publishing_mode').notNull().default('approval'),
    autoEnabled: boolean('auto_enabled').notNull().default(false),
    timezone: text('timezone').notNull().default('America/New_York'),
    ...timestamps,
  },
  (t) => [uniqueIndex('app_settings_ig_account_unique').on(t.igAccountId)],
);

/* ------------------------------------------------------------------ */
/* Convenience type exports                                          */
/* ------------------------------------------------------------------ */

export type IgAccount = typeof igAccounts.$inferSelect;
export type NewIgAccount = typeof igAccounts.$inferInsert;
export type MediaPost = typeof mediaPosts.$inferSelect;
export type NewMediaPost = typeof mediaPosts.$inferInsert;
export type ContentCategory = typeof contentCategories.$inferSelect;
export type BrandVoiceProfile = typeof brandVoiceProfiles.$inferSelect;
export type QueueItem = typeof queueItems.$inferSelect;
export type NewQueueItem = typeof queueItems.$inferInsert;
export type GeneratedCaption = typeof generatedCaptions.$inferSelect;
export type PublishingJob = typeof publishingJobs.$inferSelect;

// re-export sql helper for callers that build raw expressions
export { sql };
