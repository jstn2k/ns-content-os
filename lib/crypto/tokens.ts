import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '@/lib/env';

/**
 * Symmetric encryption for OAuth tokens at rest (AES-256-GCM).
 *
 * Stored format (base64): [12-byte IV][16-byte auth tag][ciphertext]
 * with a short version prefix so we can rotate the scheme later.
 *
 * Node-runtime only (uses node:crypto) — never import this into middleware.
 */

const VERSION = 'v1';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(): Buffer {
  const key = Buffer.from(env.tokenEncryptionKey(), 'base64');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (base64-encoded)');
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString('base64');
  return `${VERSION}:${payload}`;
}

export function decryptToken(stored: string): string {
  const [version, payload] = stored.split(':', 2);
  if (version !== VERSION || !payload) {
    throw new Error('Unrecognized encrypted token format');
  }
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
