import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';

/**
 * Parse + verify a Meta `signed_request` (used by the deauthorize and
 * data-deletion callbacks). Format: `<base64url signature>.<base64url payload>`,
 * signed with HMAC-SHA256 using the app secret.
 */
export type SignedRequestPayload = {
  user_id?: string;
  algorithm?: string;
  issued_at?: number;
  [key: string]: unknown;
};

function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export function parseSignedRequest(signedRequest: string): SignedRequestPayload | null {
  const [encodedSig, encodedPayload] = signedRequest.split('.', 2);
  if (!encodedSig || !encodedPayload) return null;

  const expected = createHmac('sha256', env.metaAppSecret()).update(encodedPayload).digest();
  const provided = fromB64url(encodedSig);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    return JSON.parse(fromB64url(encodedPayload).toString('utf8')) as SignedRequestPayload;
  } catch {
    return null;
  }
}
