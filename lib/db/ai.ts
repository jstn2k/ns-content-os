import { eq, and, sql, inArray } from 'drizzle-orm';
import { db } from './index';
import { contentCategories, mediaPosts, postCategorizations, brandVoiceProfiles } from './schema';
import type { GeneratedBrandVoice } from '@/lib/ai/brand-voice';
import type { CategoryGuess } from '@/lib/ai/categorize';

export async function getAccountPillars(igAccountId: string) {
  return db
    .select({
      id: contentCategories.id,
      key: contentCategories.key,
      label: contentCategories.label,
      description: contentCategories.description,
    })
    .from(contentCategories)
    .where(eq(contentCategories.igAccountId, igAccountId));
}

export async function getPostsForCategorization(igAccountId: string) {
  return db
    .select({ id: mediaPosts.id, caption: mediaPosts.caption })
    .from(mediaPosts)
    .where(eq(mediaPosts.igAccountId, igAccountId));
}

/**
 * Persist AI categorizations. Manual corrections are preserved — we never
 * overwrite a row the user has hand-corrected.
 */
export async function saveCategorizations(
  igAccountId: string,
  guesses: Map<string, CategoryGuess>,
): Promise<number> {
  if (guesses.size === 0) return 0;
  const pillars = await getAccountPillars(igAccountId);
  const idByKey = new Map(pillars.map((p) => [p.key, p.id]));
  const postIds = [...guesses.keys()];

  const existing = await db
    .select({ mediaPostId: postCategorizations.mediaPostId, isCorrection: postCategorizations.isCorrection })
    .from(postCategorizations)
    .where(inArray(postCategorizations.mediaPostId, postIds));
  const locked = new Set(existing.filter((e) => e.isCorrection).map((e) => e.mediaPostId));

  let saved = 0;
  for (const [postId, guess] of guesses) {
    if (locked.has(postId)) continue;
    const categoryId = idByKey.get(guess.key);
    if (!categoryId) continue;
    await db
      .insert(postCategorizations)
      .values({
        mediaPostId: postId,
        categoryId,
        source: 'ai',
        confidence: String(guess.confidence),
        isCorrection: false,
      })
      .onConflictDoUpdate({
        target: postCategorizations.mediaPostId,
        set: { categoryId, source: 'ai', confidence: String(guess.confidence), isCorrection: false, updatedAt: new Date() },
      });
    saved++;
  }
  return saved;
}

/** Set a manual category correction for one post (takes precedence over AI). */
export async function setManualCategory(igAccountId: string, postId: string, categoryKey: string): Promise<boolean> {
  const pillars = await getAccountPillars(igAccountId);
  const categoryId = pillars.find((p) => p.key === categoryKey)?.id;
  if (!categoryId) return false;
  await db
    .insert(postCategorizations)
    .values({ mediaPostId: postId, categoryId, source: 'manual', confidence: '1', isCorrection: true })
    .onConflictDoUpdate({
      target: postCategorizations.mediaPostId,
      set: { categoryId, source: 'manual', confidence: '1', isCorrection: true, updatedAt: new Date() },
    });
  return true;
}

export async function getActiveBrandVoice(igAccountId: string) {
  return db.query.brandVoiceProfiles.findFirst({
    where: and(eq(brandVoiceProfiles.igAccountId, igAccountId), eq(brandVoiceProfiles.isActive, true)),
    orderBy: (p, { desc }) => desc(p.version),
  });
}

export async function saveBrandVoiceProfile(
  igAccountId: string,
  profile: GeneratedBrandVoice,
  avgCaptionWords: number,
): Promise<void> {
  await db
    .update(brandVoiceProfiles)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(brandVoiceProfiles.igAccountId, igAccountId));

  const [maxRow] = await db
    .select({ v: sql<number>`coalesce(max(${brandVoiceProfiles.version}), 0)::int` })
    .from(brandVoiceProfiles)
    .where(eq(brandVoiceProfiles.igAccountId, igAccountId));
  const version = (maxRow?.v ?? 0) + 1;

  await db.insert(brandVoiceProfiles).values({
    igAccountId,
    version,
    isActive: true,
    summary: profile.summary,
    tone: profile.tone,
    commonHooks: profile.hooks,
    ctaStyles: profile.ctaStyles,
    topHashtags: profile.topHashtags,
    emojiStyle: profile.emojiStyle,
    avgCaptionWords: String(avgCaptionWords),
    recurringPhrases: profile.recurringPhrases,
    avoidedTopics: profile.avoidedTopics,
    sequencingPatterns: profile.sequencing,
    raw: profile,
    generatedAt: new Date(),
  });
}

/** Pillar distribution from stored categorizations (for the Analysis screen). */
export async function getPillarDistribution(igAccountId: string) {
  const rows = await db
    .select({
      key: contentCategories.key,
      label: contentCategories.label,
      count: sql<number>`count(${postCategorizations.id})::int`,
    })
    .from(contentCategories)
    .leftJoin(postCategorizations, eq(postCategorizations.categoryId, contentCategories.id))
    .where(eq(contentCategories.igAccountId, igAccountId))
    .groupBy(contentCategories.key, contentCategories.label);

  const total = rows.reduce((s, r) => s + r.count, 0);
  return rows
    .map((r) => ({ key: r.key, label: r.label, count: r.count, share: total > 0 ? r.count / total : 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}
