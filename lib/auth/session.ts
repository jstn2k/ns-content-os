/**
 * Minimal stateless admin session for the single-tenant MVP.
 *
 * A signed (HMAC-SHA256) token is stored in an httpOnly cookie. Uses Web Crypto
 * only, so it works in both the Edge middleware and Node route handlers.
 * This is intentionally simple; swap for Supabase Auth when we go multi-user.
 */

export const SESSION_COOKIE = 'ns_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** UTF-8 encode into an ArrayBuffer-backed Uint8Array (satisfies BufferSource). */
function enc(s: string): Uint8Array<ArrayBuffer> {
  const src = new TextEncoder().encode(s);
  const out = new Uint8Array(src.length);
  out.set(src);
  return out;
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error('TOKEN_ENCRYPTION_KEY is not set');
  return crypto.subtle.importKey(
    'raw',
    enc(`session:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

type SessionPayload = { sub: string; exp: number };

export async function createSessionToken(subject: string): Promise<string> {
  const payload: SessionPayload = {
    sub: subject,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = b64url(enc(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await getKey(), enc(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split('.', 2);
  if (!body || !sig) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', await getKey(), fromB64url(sig), enc(body));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
