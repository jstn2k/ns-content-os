import { NextResponse } from 'next/server';
import { getPrimaryAccount, disconnectAccount } from '@/lib/db/accounts';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const primary = await getPrimaryAccount();
    if (primary) await disconnectAccount(primary.account.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('account.disconnect', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
