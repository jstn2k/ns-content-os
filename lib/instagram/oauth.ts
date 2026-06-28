import { env, INSTAGRAM_SCOPES } from '@/lib/env';
import { InstagramApiError, parseError } from './client';

const AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
const SHORT_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const LONG_TOKEN_URL = 'https://graph.instagram.com/access_token';
const REFRESH_URL = 'https://graph.instagram.com/refresh_access_token';

/** Build the Instagram Business Login authorization URL. */
export function buildAuthorizeUrl(state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('client_id', env.metaAppId());
  url.searchParams.set('redirect_uri', env.instagramRedirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', INSTAGRAM_SCOPES.join(','));
  url.searchParams.set('state', state);
  return url.toString();
}

export type ShortLivedToken = {
  accessToken: string;
  userId: string;
  permissions: string[];
};

/** Exchange the authorization `code` for a short-lived token. */
export async function exchangeCodeForToken(rawCode: string): Promise<ShortLivedToken> {
  const code = rawCode.replace(/#_$/, ''); // Instagram sometimes appends "#_"
  const form = new URLSearchParams({
    client_id: env.metaAppId(),
    client_secret: env.metaAppSecret(),
    grant_type: 'authorization_code',
    redirect_uri: env.instagramRedirectUri(),
    code,
  });

  const res = await fetch(SHORT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) throw await parseError(res);

  const json = (await res.json()) as
    | { access_token: string; user_id: number | string; permissions?: string[] | string }
    | { data: Array<{ access_token: string; user_id: number | string; permissions?: string[] | string }> };

  const data = 'data' in json ? json.data[0] : json;
  if (!data?.access_token) {
    throw new InstagramApiError('Token exchange returned no access_token', {
      status: res.status,
      raw: json,
    });
  }
  const permissions = Array.isArray(data.permissions)
    ? data.permissions
    : typeof data.permissions === 'string'
      ? data.permissions.split(',').filter(Boolean)
      : [];

  return { accessToken: data.access_token, userId: String(data.user_id), permissions };
}

export type LongLivedToken = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
};

/** Exchange a short-lived token for a 60-day long-lived token. */
export async function exchangeForLongLivedToken(shortToken: string): Promise<LongLivedToken> {
  const url = new URL(LONG_TOKEN_URL);
  url.searchParams.set('grant_type', 'ig_exchange_token');
  url.searchParams.set('client_secret', env.metaAppSecret());
  url.searchParams.set('access_token', shortToken);

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw await parseError(res);
  const json = (await res.json()) as { access_token: string; token_type?: string; expires_in?: number };
  return {
    accessToken: json.access_token,
    tokenType: json.token_type ?? 'bearer',
    expiresInSeconds: json.expires_in ?? 60 * 60 * 24 * 60,
  };
}

/** Refresh a long-lived token (must be at least 24h old) for another 60 days. */
export async function refreshLongLivedToken(longToken: string): Promise<LongLivedToken> {
  const url = new URL(REFRESH_URL);
  url.searchParams.set('grant_type', 'ig_refresh_token');
  url.searchParams.set('access_token', longToken);

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw await parseError(res);
  const json = (await res.json()) as { access_token: string; token_type?: string; expires_in?: number };
  return {
    accessToken: json.access_token,
    tokenType: json.token_type ?? 'bearer',
    expiresInSeconds: json.expires_in ?? 60 * 60 * 24 * 60,
  };
}
