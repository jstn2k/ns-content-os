import { NextResponse } from 'next/server';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { isAiConfigured } from '@/lib/ai';
import { generateBrandVoice } from '@/lib/ai/brand-voice';
import { getPostsForCategorization, saveBrandVoiceProfile } from '@/lib/db/ai';
import { loadAccountAnalysis } from '@/lib/analysis/load';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST() {
  const primary = await getPrimaryAccount();
  if (!primary || primary.account.status !== 'connected') {
    return NextResponse.json({ error: 'No connected account' }, { status: 400 });
  }
  if (!isAiConfigured()) {
    return NextResponse.json({ error: 'AI not configured — set ANTHROPIC_API_KEY' }, { status: 400 });
  }
  try {
    const analysis = await loadAccountAnalysis(primary.account.id);
    if (!analysis) {
      return NextResponse.json({ error: 'No posts imported yet — run Import first' }, { status: 400 });
    }
    const posts = await getPostsForCategorization(primary.account.id);
    const captions = posts.map((p) => p.caption).filter((c): c is string => Boolean(c));
    const formatSummary = `${Math.round(analysis.formatRatios.reels * 100)}% reels, ${Math.round(
      analysis.formatRatios.carousel * 100,
    )}% carousels, ${Math.round(analysis.formatRatios.image * 100)}% images`;

    const profile = await generateBrandVoice(captions, {
      avgCaptionWords: analysis.avgCaptionWords,
      topHashtags: analysis.topHashtags.map((h) => h.tag),
      formatSummary,
    });
    await saveBrandVoiceProfile(primary.account.id, profile, analysis.avgCaptionWords);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('brand-voice', message, undefined, primary.account.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
