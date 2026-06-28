import { eq, sql } from 'drizzle-orm';
import { db } from './index';
import { mediaPosts } from './schema';

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
