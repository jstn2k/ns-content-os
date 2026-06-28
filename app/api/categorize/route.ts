import { NextResponse } from 'next/server';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { isAiConfigured } from '@/lib/ai';
import { categorizePosts } from '@/lib/ai/categorize';
import { getAccountPillars, getPostsForCategorization, saveCategorizations } from '@/lib/db/ai';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  const primary = await getPrimaryAccount();
  if (!primary || primary.account.status !== 'connected') {
    return NextResponse.json({ error: 'No connected account' }, { status: 400 });
  }
  if (!isAiConfigured()) {
    return NextResponse.json({ error: 'AI not configured — set ANTHROPIC_API_KEY' }, { status: 400 });
  }
  try {
    const pillars = await getAccountPillars(primary.account.id);
    const posts = await getPostsForCategorization(primary.account.id);
    if (posts.length === 0) {
      return NextResponse.json({ error: 'No posts imported yet — run Import first' }, { status: 400 });
    }
    const guesses = await categorizePosts(
      posts.map((p) => ({ id: p.id, caption: p.caption })),
      pillars,
    );
    const saved = await saveCategorizations(primary.account.id, guesses);
    return NextResponse.json({ ok: true, categorized: saved, total: posts.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('categorize', message, undefined, primary.account.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
