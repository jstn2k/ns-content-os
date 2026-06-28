import { getAiProvider, parseJsonFromText, MODELS } from './index';

export type GeneratedBrandVoice = {
  summary: string;
  tone: string[];
  hooks: string[];
  ctaStyles: string[];
  topHashtags: string[];
  emojiStyle: string;
  recurringPhrases: string[];
  avoidedTopics: string[];
  sequencing: string[];
};

/**
 * Generate a Brand Voice Profile from real captions + deterministic stats.
 * AI is used here for genuine value (voice inference), grounded in actual data.
 */
export async function generateBrandVoice(
  captions: string[],
  stats: { avgCaptionWords: number; topHashtags: string[]; formatSummary: string },
): Promise<GeneratedBrandVoice> {
  const provider = getAiProvider();
  if (!provider) throw new Error('AI provider not configured (set ANTHROPIC_API_KEY)');

  const sample = captions.filter(Boolean).slice(0, 40);
  const system =
    'You are a brand-voice analyst. From real Instagram captions, infer the account voice accurately. Respond with ONLY valid JSON in the requested shape — no prose, no code fences. Do not invent facts not supported by the captions.';

  const prompt = [
    `Deterministic stats — avg caption length: ${stats.avgCaptionWords} words; top hashtags: ${stats.topHashtags.join(', ') || 'none'}; formats: ${stats.formatSummary}.`,
    '',
    'Sample captions:',
    ...sample.map((c, i) => `${i + 1}. ${c.slice(0, 500)}`),
    '',
    'Return JSON with exactly these keys:',
    '{',
    '  "summary": "2-3 sentences describing the voice",',
    '  "tone": ["3-6 adjectives"],',
    '  "hooks": ["4-6 real opening lines drawn from the captions"],',
    '  "ctaStyles": ["3-5 typical calls to action"],',
    '  "topHashtags": ["signature hashtags"],',
    '  "emojiStyle": "one sentence on how emoji are used",',
    '  "recurringPhrases": ["3-6 phrases that recur"],',
    '  "avoidedTopics": ["3-5 topics this brand appears to avoid"],',
    '  "sequencing": ["a typical content order, e.g. Transformation, BTS, Offer"]',
    '}',
  ].join('\n');

  const text = await provider.complete({
    system,
    prompt,
    model: MODELS.brandVoice,
    maxTokens: 2000,
    temperature: 0.5,
  });
  return parseJsonFromText<GeneratedBrandVoice>(text);
}
