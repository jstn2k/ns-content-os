import { getAiProvider, parseJsonFromText, MODELS } from './index';

export type PillarRef = { key: string; label: string; description?: string | null };
export type CategoryGuess = { key: string; confidence: number };

/**
 * Classify each post into one content pillar (by key). Batched to keep token use
 * down; only pillar keys that exist for the account are accepted.
 */
export async function categorizePosts(
  posts: { id: string; caption: string | null }[],
  pillars: PillarRef[],
): Promise<Map<string, CategoryGuess>> {
  const provider = getAiProvider();
  if (!provider) throw new Error('AI provider not configured (set ANTHROPIC_API_KEY)');

  const valid = new Set(pillars.map((p) => p.key));
  const result = new Map<string, CategoryGuess>();
  const CHUNK = 20;

  const system =
    'You are an expert social-media analyst. Classify each Instagram post into exactly one content pillar, identified by its key. Respond with ONLY a JSON array — no prose, no code fences.';

  for (let i = 0; i < posts.length; i += CHUNK) {
    const chunk = posts.slice(i, i + CHUNK);
    const prompt = [
      'Content pillars (key: label):',
      ...pillars.map((p) => `- ${p.key}: ${p.label}${p.description ? ` — ${p.description}` : ''}`),
      '',
      'Posts to classify:',
      ...chunk.map((p) => `id=${p.id}\ncaption: ${(p.caption ?? '(no caption)').slice(0, 400)}`),
      '',
      'Return: [{"id":"<id>","pillar":"<pillar key from the list>","confidence":<0..1>}]',
      'Exactly one entry per post. Use only the pillar keys listed.',
    ].join('\n');

    const text = await provider.complete({
      system,
      prompt,
      model: MODELS.categorize,
      maxTokens: 1500,
      temperature: 0,
    });
    const parsed = parseJsonFromText<{ id: string; pillar: string; confidence?: number }[]>(text);
    for (const row of parsed) {
      if (row?.id && row?.pillar && valid.has(row.pillar)) {
        result.set(row.id, {
          key: row.pillar,
          confidence: typeof row.confidence === 'number' ? row.confidence : 0.7,
        });
      }
    }
  }
  return result;
}
