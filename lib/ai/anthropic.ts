import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, AiMessage } from './types';
import { MODELS } from './types';

/** Anthropic implementation of the AiProvider interface. */
export function createAnthropicProvider(apiKey: string): AiProvider {
  const client = new Anthropic({ apiKey });
  return {
    name: 'anthropic',
    async complete(msg: AiMessage): Promise<string> {
      const res = await client.messages.create({
        model: msg.model ?? MODELS.brandVoice,
        max_tokens: msg.maxTokens ?? 2048,
        temperature: msg.temperature ?? 0.7,
        ...(msg.system ? { system: msg.system } : {}),
        messages: [{ role: 'user', content: msg.prompt }],
      });
      return res.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { text: string }).text)
        .join('\n');
    },
  };
}
