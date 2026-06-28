import { PageHeader } from '@/components/ui/page-header';
import { QueueManager, type ClientQueueItem, type ClientRec } from '@/components/QueueManager';
import { getPrimaryAccount, getAppSettings } from '@/lib/db/accounts';
import { getAccountPillars } from '@/lib/db/ai';
import { listQueueItems } from '@/lib/db/queue';
import { loadRhythm } from '@/lib/rhythm/load';
import { mockPillars, mockRecommendations } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

export default async function QueuePage() {
  const primary = await getPrimaryAccount();
  const account = primary?.account ?? null;

  const itemsRaw = account ? await listQueueItems(account.id) : [];
  const items: ClientQueueItem[] = itemsRaw.map((i) => ({
    id: i.id,
    status: i.status,
    categoryId: i.categoryId,
    categoryLabel: i.categoryLabel,
    caption: i.caption,
    hashtags: i.hashtags,
    mediaUrl: i.mediaUrl,
    mediaType: i.mediaType,
    scheduledAtISO: i.scheduledAt ? new Date(i.scheduledAt).toISOString() : null,
    rhythmExplanation: i.rhythmExplanation,
    publishedPermalink: i.publishedPermalink,
  }));

  const pillarsRaw = account ? await getAccountPillars(account.id) : [];
  const pillars =
    pillarsRaw.length > 0
      ? pillarsRaw.map((p) => ({ key: p.key, label: p.label }))
      : mockPillars.map((p) => ({ key: p.key, label: p.label }));

  const rhythm = account ? await loadRhythm(account.id) : null;
  const recommendations: ClientRec[] = rhythm
    ? rhythm.recommendations
    : mockRecommendations.map((r) => ({
        order: r.order,
        pillarKey: r.pillar,
        pillarLabel: r.pillar,
        day: r.day,
        time: r.time,
        confidence: r.confidence,
        reason: r.reason,
      }));

  const settings = account ? await getAppSettings(account.id) : null;
  const canPublish = (account?.scopes ?? []).includes('instagram_business_content_publish');

  return (
    <div>
      <PageHeader
        title="Content Queue"
        description="Plan, review, and approve upcoming posts. Nothing publishes without approval."
      />
      <QueueManager
        items={items}
        pillars={pillars}
        recommendations={recommendations}
        warnings={rhythm?.warnings ?? []}
        publishingMode={settings?.publishingMode ?? 'approval'}
        isRealRecs={Boolean(rhythm)}
        canPublish={canPublish}
      />
    </div>
  );
}
