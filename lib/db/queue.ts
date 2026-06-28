import { eq, and, sql } from 'drizzle-orm';
import { db } from './index';
import { queueItems, contentCategories } from './schema';

export type QueueStatus = 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published' | 'failed';
export type QueueMediaType = 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL' | 'STORY';

export const QUEUE_STATUSES: QueueStatus[] = [
  'draft',
  'needs_review',
  'approved',
  'scheduled',
  'published',
  'failed',
];
const MEDIA_TYPES: QueueMediaType[] = ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL', 'STORY'];

async function resolveCategoryId(igAccountId: string, categoryKey?: string | null): Promise<string | null> {
  if (!categoryKey) return null;
  const cat = await db.query.contentCategories.findFirst({
    where: and(eq(contentCategories.igAccountId, igAccountId), eq(contentCategories.key, categoryKey)),
  });
  return cat?.id ?? null;
}

export async function listQueueItems(igAccountId: string) {
  return db
    .select({
      id: queueItems.id,
      status: queueItems.status,
      mediaType: queueItems.mediaType,
      caption: queueItems.caption,
      hashtags: queueItems.hashtags,
      mediaUrl: queueItems.mediaUrl,
      scheduledAt: queueItems.scheduledAt,
      rhythmFitScore: queueItems.rhythmFitScore,
      rhythmExplanation: queueItems.rhythmExplanation,
      publishedPermalink: queueItems.publishedPermalink,
      categoryId: queueItems.categoryId,
      categoryLabel: contentCategories.label,
      createdAt: queueItems.createdAt,
    })
    .from(queueItems)
    .leftJoin(contentCategories, eq(contentCategories.id, queueItems.categoryId))
    .where(eq(queueItems.igAccountId, igAccountId))
    .orderBy(sql`${queueItems.scheduledAt} asc nulls last`, sql`${queueItems.createdAt} desc`);
}

export type CreateQueueInput = {
  categoryKey?: string;
  caption?: string;
  hashtags?: string[];
  mediaUrl?: string;
  mediaType?: string;
  scheduledAt?: string; // ISO
  status?: string;
  rhythmExplanation?: string;
};

export async function createQueueItem(igAccountId: string, input: CreateQueueInput): Promise<string> {
  const categoryId = await resolveCategoryId(igAccountId, input.categoryKey);
  const status = (QUEUE_STATUSES.find((s) => s === input.status) ?? 'draft') as QueueStatus;
  const mediaType = MEDIA_TYPES.find((m) => m === input.mediaType);

  const [row] = await db
    .insert(queueItems)
    .values({
      igAccountId,
      categoryId,
      status,
      mediaType: mediaType ?? null,
      mediaUrl: input.mediaUrl ?? null,
      caption: input.caption ?? null,
      hashtags: input.hashtags ?? null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      rhythmExplanation: input.rhythmExplanation ?? null,
    })
    .returning({ id: queueItems.id });
  return row.id;
}

export type UpdateQueueInput = Partial<CreateQueueInput>;

export async function updateQueueItem(
  igAccountId: string,
  id: string,
  patch: UpdateQueueInput,
): Promise<boolean> {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.categoryKey !== undefined) set.categoryId = await resolveCategoryId(igAccountId, patch.categoryKey);
  if (patch.caption !== undefined) set.caption = patch.caption;
  if (patch.hashtags !== undefined) set.hashtags = patch.hashtags;
  if (patch.mediaUrl !== undefined) set.mediaUrl = patch.mediaUrl;
  if (patch.mediaType !== undefined) set.mediaType = MEDIA_TYPES.find((m) => m === patch.mediaType) ?? null;
  if (patch.scheduledAt !== undefined) set.scheduledAt = patch.scheduledAt ? new Date(patch.scheduledAt) : null;
  if (patch.status !== undefined) {
    const status = QUEUE_STATUSES.find((s) => s === patch.status);
    if (status) set.status = status;
  }

  const res = await db
    .update(queueItems)
    .set(set)
    .where(and(eq(queueItems.id, id), eq(queueItems.igAccountId, igAccountId)))
    .returning({ id: queueItems.id });
  return res.length > 0;
}

export async function deleteQueueItem(igAccountId: string, id: string): Promise<boolean> {
  const res = await db
    .delete(queueItems)
    .where(and(eq(queueItems.id, id), eq(queueItems.igAccountId, igAccountId)))
    .returning({ id: queueItems.id });
  return res.length > 0;
}

/** Scheduled (and published) items for the calendar. */
export async function getScheduledQueueItems(igAccountId: string) {
  return db
    .select({
      id: queueItems.id,
      status: queueItems.status,
      scheduledAt: queueItems.scheduledAt,
      categoryLabel: contentCategories.label,
    })
    .from(queueItems)
    .leftJoin(contentCategories, eq(contentCategories.id, queueItems.categoryId))
    .where(eq(queueItems.igAccountId, igAccountId));
}
