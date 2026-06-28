import { NextResponse, type NextRequest } from 'next/server';
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
} from '@/lib/instagram/oauth';
import { getProfile } from '@/lib/instagram/account';
import { upsertAccountWithToken } from '@/lib/db/accounts';
import { logError } from '@/lib/db/logs';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, env.appUrl));
}

/** OAuth redirect target: exchange code → long-lived token → store account. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error_description') || searchParams.get('error');
  const cookieState = req.cookies.get('ig_oauth_state')?.value;

  if (oauthError) {
    return redirectTo(`/connect?error=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectTo('/connect?error=invalid_state');
  }

  try {
    const short = await exchangeCodeForToken(code);
    const long = await exchangeForLongLivedToken(short.accessToken);
    const profile = await getProfile(long.accessToken);

    await upsertAccountWithToken({
      igUserId: short.userId || profile.user_id || profile.id,
      username: profile.username,
      accountType: profile.account_type,
      permissions: short.permissions,
      profile,
      accessToken: long.accessToken,
      expiresInSeconds: long.expiresInSeconds,
    });

    const res = redirectTo('/connect?connected=1');
    res.cookies.delete('ig_oauth_state');
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error during connect';
    await logError('instagram.oauth.callback', message, { raw: String(e) });
    return redirectTo(`/connect?error=${encodeURIComponent(message)}`);
  }
}
