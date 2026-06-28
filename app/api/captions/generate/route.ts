import { NextResponse } from 'next/server';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { getActiveBrandVoice } from '@/lib/db/ai';
import { isAiConfigured } from '@/lib/ai';
import { generateCaption, type CaptionVariant, type BrandVoiceContext } from '@/lib/ai/captions';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';
export const maxDuration = 60;

const asArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export async function POST(req: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json({ error: 'AI not configured — set ANTHROPIC_API_KEY' }, { status: 400 });
  }
  const { pillar, variant, topic } = (await req.json().catch(() => ({}))) as {
    pillar?: string;
    variant?: string;
    topic?: string;
  };
  if (!pillar || !variant) {
    return NextResponse.json({ error: 'pillar and variant are required' }, { status: 400 });
  }

  try {
    const primary = await getPrimaryAccount();
    let voice: BrandVoiceContext | undefined;
    if (primary?.account) {
      const bv = await getActiveBrandVoice(primary.account.id);
      if (bv) {
        voice = {
          summary: bv.summary ?? undefined,
          tone: asArr(bv.tone),
          hooks: asArr(bv.commonHooks),
          ctaStyles: asArr(bv.ctaStyles),
          hashtags: asArr(bv.topHashtags),
          emojiStyle: typeof bv.emojiStyle === 'string' ? bv.emojiStyle : undefined,
          avoidedTopics: asArr(bv.avoidedTopics),
        };
      }
    }
    const caption = await generateCaption({
      pillarLabel: pillar,
      variant: variant as CaptionVariant,
      voice,
      topic,
    });
    return NextResponse.json({ ok: true, caption });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('captions.generate', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
