import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { getPostsForAnalysis } from '@/lib/db/posts';
import { analyzeAccount, type AnalysisResult } from './engine';

/**
 * Server helper: load an account's posts + timezone and run the deterministic
 * analysis engine. Returns null when there's nothing imported yet (so callers
 * can fall back to the sample/preview UI).
 */
export async function loadAccountAnalysis(igAccountId: string): Promise<AnalysisResult | null> {
  const posts = await getPostsForAnalysis(igAccountId);
  if (posts.length === 0) return null;

  const settings = await db.query.appSettings.findFirst({
    where: eq(appSettings.igAccountId, igAccountId),
  });
  const tz = settings?.timezone ?? 'America/New_York';

  return analyzeAccount(posts, tz);
}
