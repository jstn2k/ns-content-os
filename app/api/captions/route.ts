import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { db } from '@/lib/db';
import { generatedCaptions, contentCategories } from '@/lib/db/schema';
import { logError } from '@/lib/db/logs';

export const runtime = 'nodejs';

const VARIANTS = ['short', 'medium', 'long', 'story', 'reel_hook', 'cta', 'comment_reply'] as const;
const STATUSES = ['draft', 'approved', 'rejected'] as const;

/** Save a generated caption (e.g. on approve) to generated_captions. */
export async function POST(req: Request) {
  const primary = await getPrimaryAccount();
  if (!primary?.account) return NextResponse.json({ error: 'No connected account' }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as {
    pillarKey?: string;
    variant?: string;
    hook?: string;
    body?: string;
    cta?: string;
    hashtags?: string[];
    fullText?: string;
    status?: string;
  };

  const variant = VARIANTS.find((v) => v === body.variant) ?? 'medium';
  const status = STATUSES.find((s) => s === body.status) ?? 'draft';

  try {
    let categoryId: string | null = null;
    if (body.pillarKey) {
      const cat = await db.query.contentCategories.findFirst({
        where: and(eq(contentCategories.igAccountId, primary.account.id), eq(contentCategories.key, body.pillarKey)),
      });
      categoryId = cat?.id ?? null;
    }
    await db.insert(generatedCaptions).values({
      igAccountId: primary.account.id,
      categoryId,
      variant,
      hook: body.hook ?? null,
      body: body.body ?? null,
      cta: body.cta ?? null,
      hashtags: body.hashtags ?? null,
      fullText: body.fullText ?? null,
      status,
      model: 'claude',
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logError('captions.save', message, undefined, primary.account.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
