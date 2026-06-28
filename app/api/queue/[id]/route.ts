import { NextResponse } from 'next/server';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { updateQueueItem, deleteQueueItem, type UpdateQueueInput } from '@/lib/db/queue';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const primary = await getPrimaryAccount();
  if (!primary?.account) return NextResponse.json({ error: 'No connected account' }, { status: 400 });

  const patch = (await req.json().catch(() => ({}))) as UpdateQueueInput;
  try {
    const ok = await updateQueueItem(primary.account.id, id, patch);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('queue.update', message, undefined, primary.account.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const primary = await getPrimaryAccount();
  if (!primary?.account) return NextResponse.json({ error: 'No connected account' }, { status: 400 });

  try {
    const ok = await deleteQueueItem(primary.account.id, id);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('queue.delete', message, undefined, primary.account.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
