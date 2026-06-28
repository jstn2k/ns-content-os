/** Provider-agnostic AI interface so we can swap Anthropic / OpenAI / others. */
export type AiMessage = {
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export interface AiProvider {
  name: string;
  complete(msg: AiMessage): Promise<string>;
}

/** Default model per task. Anthropic ids; map to equivalents for other providers. */
export const MODELS = {
  categorize: 'claude-haiku-4-5-20251001',
  brandVoice: 'claude-opus-4-8',
  captions: 'claude-opus-4-8',
} as const;
