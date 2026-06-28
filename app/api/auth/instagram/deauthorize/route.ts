import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { igAccounts } from '@/lib/db/schema';
import { parseSignedRequest } from '@/lib/instagram/signed-request';
import { disconnectAccount } from '@/lib/db/accounts';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';

/**
 * Meta calls this (server-to-server) when a user removes the app from their
 * Instagram account. We mark the account disconnected and drop its token.
 * Public endpoint — authenticated via the signed_request signature.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const signed = String(form.get('signed_request') ?? '');
    const payload = parseSignedRequest(signed);

    if (payload?.user_id) {
      const account = await db.query.igAccounts.findFirst({
        where: eq(igAccounts.igUserId, String(payload.user_id)),
      });
      if (account) await disconnectAccount(account.id);
    }
  } catch (e) {
    await logError('instagram.deauthorize', e instanceof Error ? e.message : String(e));
  }
  return NextResponse.json({ ok: true });
}
