import { NextResponse } from 'next/server';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { publishQueueItem } from '@/lib/instagram/publish-queue';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Manually publish one approved/scheduled queue item. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const primary = await getPrimaryAccount();
  if (!primary?.account || primary.account.status !== 'connected') {
    return NextResponse.json({ error: 'No connected account' }, { status: 400 });
  }
  const scopes = primary.account.scopes ?? [];
  if (!scopes.includes('instagram_business_content_publish')) {
    return NextResponse.json(
      { error: 'Publishing permission not granted (needs instagram_business_content_publish; App Review for public use).' },
      { status: 400 },
    );
  }

  const result = await publishQueueItem(primary.account.id, primary.account.igUserId, id);
  return result.ok
    ? NextResponse.json({ ok: true, permalink: result.permalink })
    : NextResponse.json({ error: result.error }, { status: 400 });
}
