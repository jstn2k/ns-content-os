import { NextResponse } from 'next/server';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { createQueueItem, type CreateQueueInput } from '@/lib/db/queue';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';

/** Create a queue item. */
export async function POST(req: Request) {
  const primary = await getPrimaryAccount();
  if (!primary?.account) return NextResponse.json({ error: 'No connected account' }, { status: 400 });

  const input = (await req.json().catch(() => ({}))) as CreateQueueInput;
  try {
    const id = await createQueueItem(primary.account.id, input);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('queue.create', message, undefined, primary.account.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
