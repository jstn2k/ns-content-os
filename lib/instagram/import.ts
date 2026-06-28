import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { igAccounts, mediaPosts, postMetrics } from '@/lib/db/schema';
import { getValidAccessToken } from './token';
import { fetchAllMedia, normalizeMediaType } from './media';
import { fetchMediaInsights } from './insights';
import { parseHashtags, parseMentions, detectCta } from '@/lib/analysis/caption';
import { logError } from '@/lib/db/logs';

export type ImportSummary = {
  fetched: number;
  upserted: number;
  withInsights: number;
  errors: number;
};

/** Only fetch per-media insights for the most recent N posts (rate-limit safety). */
const INSIGHTS_CAP = 120;

/**
 * Import the account's historical media into the database. Media URLs are stored
 * as-is for now (they expire) — thumbnail re-hosting to storage is added once
 * Supabase Storage keys are configured.
 */
export async function importHistory(igAccountId: string): Promise<ImportSummary> {
  const account = await db.query.igAccounts.findFirst({ where: eq(igAccounts.id, igAccountId) });
  if (!account) throw new Error('Account not found');

  const token = await getValidAccessToken(igAccountId);
  if (!token) throw new Error('No access token for account');

  const canInsights = (account.scopes ?? []).includes('instagram_business_manage_insights');
  const media = await fetchAllMedia(token);

  let upserted = 0;
  let withInsights = 0;
  let errors = 0;

  for (let i = 0; i < media.length; i++) {
    const m = media[i];
    const type = normalizeMediaType(m);
    try {
      const hashtags = parseHashtags(m.caption);
      const mentions = parseMentions(m.caption);
      const ctaText = detectCta(m.caption);

      const [row] = await db
        .insert(mediaPosts)
        .values({
          igAccountId,
          igMediaId: m.id,
          mediaType: type,
          caption: m.caption ?? null,
          postedAt: m.timestamp ? new Date(m.timestamp) : null,
          permalink: m.permalink ?? null,
          mediaUrl: m.media_url ?? m.thumbnail_url ?? null,
          likeCount: m.like_count ?? null,
          commentsCount: m.comments_count ?? null,
          hashtags,
          mentions,
          ctaText,
          raw: m as object,
          importedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: mediaPosts.igMediaId,
          set: {
            caption: m.caption ?? null,
            likeCount: m.like_count ?? null,
            commentsCount: m.comments_count ?? null,
            hashtags,
            mentions,
            ctaText,
            mediaUrl: m.media_url ?? m.thumbnail_url ?? null,
            raw: m as object,
            updatedAt: new Date(),
          },
        })
        .returning({ id: mediaPosts.id });

      upserted++;

      if (canInsights && i < INSIGHTS_CAP) {
        const ins = await fetchMediaInsights(m.id, type, token);
        if (ins && ins.available.length > 0) {
          await db.insert(postMetrics).values({
            mediaPostId: row.id,
            reach: ins.reach ?? null,
            views: ins.views ?? null,
            saved: ins.saved ?? null,
            shares: ins.shares ?? null,
            totalInteractions: ins.totalInteractions ?? null,
            available: ins.available,
            fetchedAt: new Date(),
          });
          withInsights++;
        }
      }
    } catch (e) {
      errors++;
      await logError('import.media', e instanceof Error ? e.message : String(e), { mediaId: m.id }, igAccountId);
    }
  }

  await db
    .update(igAccounts)
    .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
    .where(eq(igAccounts.id, igAccountId));

  return { fetched: media.length, upserted, withInsights, errors };
}
