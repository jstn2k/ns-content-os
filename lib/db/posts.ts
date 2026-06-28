import { eq, sql, inArray } from 'drizzle-orm';
import { db } from './index';
import { mediaPosts, postMetrics } from './schema';
import type { AnalyzablePost } from '@/lib/analysis/engine';

/** Count of imported posts for an account. */
export async function getImportedPostCount(igAccountId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mediaPosts)
    .where(eq(mediaPosts.igAccountId, igAccountId));
  return row?.count ?? 0;
}

/** Most recent imported posts for an account. */
export async function getRecentPosts(igAccountId: string, limit = 8) {
  return db.query.mediaPosts.findMany({
    where: eq(mediaPosts.igAccountId, igAccountId),
    orderBy: (p, { desc }) => desc(p.postedAt),
    limit,
  });
}

/** Load all posts (with their latest metric snapshot) shaped for the analysis engine. */
export async function getPostsForAnalysis(igAccountId: string): Promise<AnalyzablePost[]> {
  const posts = await db
    .select({
      id: mediaPosts.id,
      mediaType: mediaPosts.mediaType,
      caption: mediaPosts.caption,
      postedAt: mediaPosts.postedAt,
      likeCount: mediaPosts.likeCount,
      commentsCount: mediaPosts.commentsCount,
      hashtags: mediaPosts.hashtags,
      permalink: mediaPosts.permalink,
    })
    .from(mediaPosts)
    .where(eq(mediaPosts.igAccountId, igAccountId));

  if (posts.length === 0) return [];

  const metrics = await db
    .select({
      mediaPostId: postMetrics.mediaPostId,
      reach: postMetrics.reach,
      totalInteractions: postMetrics.totalInteractions,
      fetchedAt: postMetrics.fetchedAt,
    })
    .from(postMetrics)
    .where(inArray(postMetrics.mediaPostId, posts.map((p) => p.id)));

  const latest = new Map<string, { reach: number | null; totalInteractions: number | null; fetchedAt: Date }>();
  for (const m of metrics) {
    const cur = latest.get(m.mediaPostId);
    if (!cur || m.fetchedAt > cur.fetchedAt) {
      latest.set(m.mediaPostId, { reach: m.reach, totalInteractions: m.totalInteractions, fetchedAt: m.fetchedAt });
    }
  }

  return posts.map((p) => ({
    mediaType: p.mediaType,
    caption: p.caption,
    postedAt: p.postedAt,
    likeCount: p.likeCount,
    commentsCount: p.commentsCount,
    hashtags: p.hashtags,
    permalink: p.permalink,
    reach: latest.get(p.id)?.reach ?? null,
    totalInteractions: latest.get(p.id)?.totalInteractions ?? null,
  }));
}
