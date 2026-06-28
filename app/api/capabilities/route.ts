import { NextResponse } from 'next/server';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { getValidAccessToken } from '@/lib/instagram/token';
import { getProfile } from '@/lib/instagram/account';
import { getContentPublishingLimit, deriveFeatures } from '@/lib/instagram/capabilities';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';

/** Detect what the connected account + granted permissions actually support. */
export async function GET() {
  const primary = await getPrimaryAccount();
  if (!primary || primary.account.status !== 'connected' || !primary.hasToken) {
    return NextResponse.json({ connected: false });
  }

  const token = await getValidAccessToken(primary.account.id);
  if (!token) return NextResponse.json({ connected: false });

  const scopes = primary.account.scopes ?? [];
  try {
    const profile = await getProfile(token);
    const publishingLimit = await getContentPublishingLimit(primary.account.igUserId, token);
    return NextResponse.json({
      connected: true,
      username: profile.username ?? primary.account.username,
      accountType: profile.account_type ?? primary.account.accountType,
      mediaCount: profile.media_count ?? null,
      scopes,
      features: deriveFeatures(scopes),
      publishingLimit,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('capabilities', message, undefined, primary.account.id);
    // Still return scope-derived features so the UI is useful even if the live call fails.
    return NextResponse.json({
      connected: true,
      username: primary.account.username,
      accountType: primary.account.accountType,
      mediaCount: null,
      scopes,
      features: deriveFeatures(scopes),
      publishingLimit: null,
      error: message,
    });
  }
}
