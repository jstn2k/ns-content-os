import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { queueItems, publishingJobs } from '@/lib/db/schema';
import { getValidAccessToken } from './token';
import { getContentPublishingLimit } from './capabilities';
import { publishMedia } from './publish';
import { logError, logPublish } from '@/lib/db/logs';

export type PublishResult = { ok: boolean; permalink?: string; error?: string };

/**
 * Publish one approved/scheduled queue item through the official API, with
 * capability + rate-limit checks, full logging, and job-state tracking.
 * Always user-triggered — never auto-publishes outside auto mode.
 */
export async function publishQueueItem(
  igAccountId: string,
  igUserId: string,
  queueItemId: string,
): Promise<PublishResult> {
  const item = await db.query.queueItems.findFirst({
    where: and(eq(queueItems.id, queueItemId), eq(queueItems.igAccountId, igAccountId)),
  });
  if (!item) return { ok: false, error: 'Queue item not found' };
  if (item.status !== 'approved' && item.status !== 'scheduled') {
    return { ok: false, error: 'Only approved or scheduled posts can be published' };
  }
  if (!item.mediaUrl) return { ok: false, error: 'No media URL set for this post' };
  const firstUrl = item.mediaUrl.split(',')[0].trim();
  if (!/^https:\/\//i.test(firstUrl)) return { ok: false, error: 'Media URL must be public HTTPS' };

  const token = await getValidAccessToken(igAccountId);
  if (!token) return { ok: false, error: 'No access token for account' };

  // Respect the 100-per-24h publishing limit.
  const limit = await getContentPublishingLimit(igUserId, token);
  if (limit && limit.quotaUsage >= limit.quotaTotal) {
    return { ok: false, error: `Daily publish limit reached (${limit.quotaUsage}/${limit.quotaTotal}).` };
  }

  const [job] = await db
    .insert(publishingJobs)
    .values({ queueItemId, state: 'creating_container', attempts: 1 })
    .returning({ id: publishingJobs.id });
  await logPublish(igAccountId, queueItemId, 'publish.start', 'started', { mediaType: item.mediaType });

  try {
    const caption = [item.caption, (item.hashtags ?? []).join(' ')].filter(Boolean).join('\n\n');
    const { mediaId, permalink } = await publishMedia({
      igUserId,
      token,
      mediaType: item.mediaType ?? 'IMAGE',
      mediaUrl: item.mediaUrl,
      caption,
    });

    await db
      .update(queueItems)
      .set({ status: 'published', publishedPermalink: permalink, publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(queueItems.id, queueItemId));
    await db
      .update(publishingJobs)
      .set({ state: 'done', containerId: mediaId, updatedAt: new Date() })
      .where(eq(publishingJobs.id, job.id));
    await logPublish(igAccountId, queueItemId, 'publish.success', 'success', { mediaId, permalink });

    return { ok: true, permalink: permalink ?? undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db
      .update(queueItems)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(queueItems.id, queueItemId));
    await db
      .update(publishingJobs)
      .set({ state: 'failed', lastError: message, updatedAt: new Date() })
      .where(eq(publishingJobs.id, job.id));
    await logError('publish', message, { queueItemId }, igAccountId);
    await logPublish(igAccountId, queueItemId, 'publish.failed', 'failed', { error: message });
    return { ok: false, error: message };
  }
}
