import { NextResponse } from 'next/server';
import { buildAuthorizeUrl } from '@/lib/instagram/oauth';

export const runtime = 'nodejs';

/** Start the Instagram Business Login flow. */
export async function GET() {
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(buildAuthorizeUrl(state));
  res.cookies.set('ig_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });
  return res;
}
