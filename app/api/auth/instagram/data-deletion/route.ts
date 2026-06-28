import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { igAccounts } from '@/lib/db/schema';
import { parseSignedRequest } from '@/lib/instagram/signed-request';
import { disconnectAccount } from '@/lib/db/accounts';
import { logError } from '@/lib/db/logs';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

/**
 * Meta data-deletion request callback. Must return JSON with a status `url` and
 * a `confirmation_code`. We disconnect the account (drop its token) and confirm.
 * Public endpoint — authenticated via the signed_request signature.
 */
export async function POST(req: NextRequest) {
  const confirmationCode = randomUUID();
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
    await logError('instagram.data_deletion', e instanceof Error ? e.message : String(e));
  }

  return NextResponse.json({
    url: `${env.appUrl}/connect?deletion=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
