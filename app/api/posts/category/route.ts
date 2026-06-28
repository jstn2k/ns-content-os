import { NextResponse } from 'next/server';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { setManualCategory } from '@/lib/db/ai';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';

/** Manual category correction for a single post (overrides AI categorization). */
export async function POST(req: Request) {
  const { postId, categoryKey } = (await req.json().catch(() => ({}))) as {
    postId?: string;
    categoryKey?: string;
  };
  if (!postId || !categoryKey) {
    return NextResponse.json({ error: 'postId and categoryKey are required' }, { status: 400 });
  }
  const primary = await getPrimaryAccount();
  if (!primary) return NextResponse.json({ error: 'No connected account' }, { status: 400 });

  try {
    const ok = await setManualCategory(primary.account.id, postId, categoryKey);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: 'Unknown category' }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('posts.category', message, undefined, primary.account.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
