import { NextResponse } from 'next/server';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { importHistory } from '@/lib/instagram/import';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Hobby cap; large accounts may need re-runs

export async function POST() {
  const primary = await getPrimaryAccount();
  if (!primary || primary.account.status !== 'connected' || !primary.hasToken) {
    return NextResponse.json({ error: 'No connected account' }, { status: 400 });
  }
  try {
    const summary = await importHistory(primary.account.id);
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('import', message, undefined, primary.account.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
