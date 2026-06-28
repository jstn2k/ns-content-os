import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { oauthTokens } from '@/lib/db/schema';
import { decryptToken, encryptToken } from '@/lib/crypto/tokens';
import { refreshLongLivedToken } from './oauth';

/** Refresh a long-lived token when it has fewer than this many days left. */
const REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Return a usable decrypted access token for an account, refreshing it first if
 * it's close to expiry. Returns null if there is no stored token.
 */
export async function getValidAccessToken(igAccountId: string): Promise<string | null> {
  const tokenRow = await db.query.oauthTokens.findFirst({
    where: eq(oauthTokens.igAccountId, igAccountId),
  });
  if (!tokenRow) return null;

  let accessToken = decryptToken(tokenRow.accessTokenEncrypted);
  const expiresAt = tokenRow.expiresAt ? new Date(tokenRow.expiresAt).getTime() : 0;

  if (expiresAt && expiresAt - Date.now() < REFRESH_THRESHOLD_MS) {
    try {
      const refreshed = await refreshLongLivedToken(accessToken);
      accessToken = refreshed.accessToken;
      await db
        .update(oauthTokens)
        .set({
          accessTokenEncrypted: encryptToken(refreshed.accessToken),
          expiresAt: new Date(Date.now() + refreshed.expiresInSeconds * 1000),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(oauthTokens.id, tokenRow.id));
    } catch (e) {
      // Non-fatal: the existing token may still be valid for a while.
      console.error('[getValidAccessToken] refresh failed:', e);
    }
  }

  return accessToken;
}
