import { NextResponse } from 'next/server';
import { and, eq, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { igAccounts, appSettings, queueItems } from '@/lib/db/schema';
import { publishQueueItem } from '@/lib/instagram/publish-queue';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = env.cronSecret();
  const provided = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret');
  return Boolean(provided) && provided === secret;
}

/**
 * Auto-publish scheduled posts that are due. Only runs for accounts in 'auto'
 * publishing mode (disabled by default), so by default this is a no-op. Protected
 * by CRON_SECRET. Wire to a Vercel Cron schedule only after auto mode is enabled.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const autoAccounts = await db
    .select({ igAccountId: appSettings.igAccountId })
    .from(appSettings)
    .where(eq(appSettings.publishingMode, 'auto'));

  let published = 0;
  let failed = 0;
  for (const s of autoAccounts) {
    const account = await db.query.igAccounts.findFirst({ where: eq(igAccounts.id, s.igAccountId) });
    if (!account || account.status !== 'connected') continue;
    const due = await db
      .select({ id: queueItems.id })
      .from(queueItems)
      .where(
        and(eq(queueItems.igAccountId, s.igAccountId), eq(queueItems.status, 'scheduled'), lte(queueItems.scheduledAt, new Date())),
      );
    for (const d of due) {
      const r = await publishQueueItem(s.igAccountId, account.igUserId, d.id);
      if (r.ok) published++;
      else failed++;
    }
  }
  return NextResponse.json({ ok: true, accountsChecked: autoAccounts.length, published, failed });
}
