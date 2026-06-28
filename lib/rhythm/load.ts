import { loadAccountAnalysis } from '@/lib/analysis/load';
import { getPillarDistribution, getRecentCategorizedPillars } from '@/lib/db/ai';
import { generateRhythm, type RhythmResult } from './engine';

/**
 * Build posting-rhythm recommendations for an account. Returns null when there
 * isn't enough data yet (no imported posts, or posts not categorized) so callers
 * fall back to the sample UI.
 */
export async function loadRhythm(igAccountId: string): Promise<RhythmResult | null> {
  const analysis = await loadAccountAnalysis(igAccountId);
  if (!analysis) return null;

  const distribution = await getPillarDistribution(igAccountId);
  if (distribution.length === 0) return null; // needs categorization first

  const recentPillars = await getRecentCategorizedPillars(igAccountId, 10);
  return generateRhythm({
    pillars: distribution.map((d) => ({ key: d.key, label: d.label, share: d.share })),
    bestWindows: analysis.bestWindows,
    recentPillars,
    avgPostsPerWeek: analysis.avgPostsPerWeek,
  });
}
