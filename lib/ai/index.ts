import { env } from '@/lib/env';
import { createAnthropicProvider } from './anthropic';
import type { AiProvider } from './types';

export type { AiProvider, AiMessage } from './types';
export { MODELS } from './types';

/** True when an AI provider + key are configured. */
export function isAiConfigured(): boolean {
  const provider = env.aiProvider();
  if (provider === 'anthropic') return Boolean(env.anthropicApiKey());
  return false;
}

/** Get the configured AI provider, or null if not set up. */
export function getAiProvider(): AiProvider | null {
  const provider = env.aiProvider();
  if (provider === 'anthropic') {
    const key = env.anthropicApiKey();
    return key ? createAnthropicProvider(key) : null;
  }
  return null;
}

/** Extract the first JSON value from a model response (tolerates prose / code fences). */
export function parseJsonFromText<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();

  const firstObj = body.indexOf('{');
  const firstArr = body.indexOf('[');
  let start: number;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);

  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON found in model response');
  }
  return JSON.parse(body.slice(start, end + 1)) as T;
}
