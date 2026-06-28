/**
 * Deterministic caption parsing. No AI here — just reliable text extraction used
 * at import time and by the analysis engine. (AI is reserved for voice/captions.)
 */

const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;
const MENTION_RE = /@[A-Za-z0-9_.]+/g;

/** CTA trigger phrases (lowercased). Order roughly by specificity. */
const CTA_PATTERNS = [
  'link in bio',
  'link in my bio',
  'tap the link',
  'swipe up',
  'dm us',
  'dm me',
  'send us a dm',
  'comment below',
  'drop a comment',
  'sign up',
  'shop now',
  'order now',
  'book now',
  'book your',
  'get started',
  'join now',
  'join the',
  'register',
  'subscribe',
  'doors close',
  'limited spots',
  'limited time',
  'today only',
  'click the link',
  'call us',
  'message us',
];

export function parseHashtags(caption: string | null | undefined): string[] {
  if (!caption) return [];
  const matches = caption.match(HASHTAG_RE) ?? [];
  return Array.from(new Set(matches));
}

export function parseMentions(caption: string | null | undefined): string[] {
  if (!caption) return [];
  const matches = caption.match(MENTION_RE) ?? [];
  return Array.from(new Set(matches));
}

export function wordCount(caption: string | null | undefined): number {
  if (!caption) return 0;
  return caption.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Find a likely CTA. Returns the sentence/line containing the first CTA trigger
 * phrase, or null if none found.
 */
export function detectCta(caption: string | null | undefined): string | null {
  if (!caption) return null;
  const lower = caption.toLowerCase();
  const hit = CTA_PATTERNS.find((p) => lower.includes(p));
  if (!hit) return null;

  // Return the line that contains the trigger, trimmed.
  const line = caption
    .split(/\n|(?<=[.!?])\s+/)
    .find((seg) => seg.toLowerCase().includes(hit));
  return (line ?? hit).trim();
}

/** Extract Unicode emoji (rough but dependency-free). */
export function extractEmojis(caption: string | null | undefined): string[] {
  if (!caption) return [];
  const matches = caption.match(/\p{Extended_Pictographic}/gu) ?? [];
  return matches;
}
