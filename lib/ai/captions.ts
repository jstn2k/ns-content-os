import { getAiProvider, parseJsonFromText, MODELS } from './index';

export type CaptionVariant =
  | 'short'
  | 'medium'
  | 'long'
  | 'story'
  | 'reel_hook'
  | 'cta'
  | 'comment_reply';

export type GeneratedCaption = { hook: string; body: string; cta: string; hashtags: string[] };

export type BrandVoiceContext = {
  summary?: string;
  tone?: string[];
  hooks?: string[];
  ctaStyles?: string[];
  hashtags?: string[];
  emojiStyle?: string;
  avoidedTopics?: string[];
};

const VARIANT_SPECS: Record<CaptionVariant, string> = {
  short: 'A short caption — 1-2 punchy sentences.',
  medium: 'A medium caption — clear hook, a few sentences of body, and a CTA.',
  long: 'A long-form storytelling caption — a short story arc, roughly 80-150 words.',
  story: 'On-screen Story text — very short, a few words per line.',
  reel_hook: 'A single scroll-stopping Reel hook line. Only the hook matters; leave body and cta empty.',
  cta: 'A direct call-to-action caption focused on driving the action.',
  comment_reply: 'A warm, human reply to a comment. Put the reply text in body; leave hook and cta empty.',
};

export async function generateCaption(opts: {
  pillarLabel: string;
  variant: CaptionVariant;
  voice?: BrandVoiceContext;
  topic?: string;
}): Promise<GeneratedCaption> {
  const provider = getAiProvider();
  if (!provider) throw new Error('AI provider not configured (set ANTHROPIC_API_KEY)');

  const v = opts.voice ?? {};
  const system =
    'You are an elite social-media copywriter. Write captions that sound human, direct, and premium — never generic corporate marketing, never clichéd. Match the provided brand voice precisely. Respond with ONLY valid JSON — no prose, no code fences.';

  const prompt = [
    `Brand voice: ${v.summary ?? 'Direct, disciplined, premium. Speaks to people done making excuses.'}`,
    v.tone?.length ? `Tone: ${v.tone.join(', ')}.` : '',
    v.hooks?.length ? `Example hooks from this brand: ${v.hooks.slice(0, 4).join(' | ')}` : '',
    v.ctaStyles?.length ? `Typical CTAs: ${v.ctaStyles.slice(0, 4).join(' | ')}` : '',
    v.emojiStyle ? `Emoji style: ${v.emojiStyle}` : '',
    v.avoidedTopics?.length ? `Avoid these: ${v.avoidedTopics.join(', ')}.` : '',
    '',
    `Content pillar: ${opts.pillarLabel}.`,
    opts.topic ? `Specific topic / context to write about: ${opts.topic}.` : '',
    `Format: ${VARIANT_SPECS[opts.variant]}`,
    '',
    'Return JSON: {"hook": string, "body": string, "cta": string, "hashtags": string[]}',
    'Keep hashtags relevant (3-6) or [] if not appropriate for this format.',
  ]
    .filter(Boolean)
    .join('\n');

  const text = await provider.complete({
    system,
    prompt,
    model: MODELS.captions,
    maxTokens: 1200,
    temperature: 0.8,
  });
  const parsed = parseJsonFromText<Partial<GeneratedCaption>>(text);
  return {
    hook: parsed.hook ?? '',
    body: parsed.body ?? '',
    cta: parsed.cta ?? '',
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
  };
}
