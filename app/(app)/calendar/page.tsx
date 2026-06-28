import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { cn } from '@/lib/utils';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { getRecentPosts } from '@/lib/db/posts';
import { getScheduledQueueItems } from '@/lib/db/queue';
import { mockPosts, mockQueue } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

type Ev = { day: number; label: string; kind: 'published' | 'scheduled' };

function shortPillar(p: string) {
  return p.split(' / ')[0];
}

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const inThisMonth = (d: Date) => d.getFullYear() === year && d.getMonth() === month;

  // Real events from imported posts + scheduled queue items.
  const primary = await getPrimaryAccount();
  const account = primary?.account ?? null;
  const realEvents: Ev[] = [];
  if (account) {
    const posts = await getRecentPosts(account.id, 90);
    for (const p of posts) {
      if (p.postedAt && inThisMonth(new Date(p.postedAt))) {
        realEvents.push({ day: new Date(p.postedAt).getDate(), label: p.mediaType, kind: 'published' });
      }
    }
    const scheduled = await getScheduledQueueItems(account.id);
    for (const q of scheduled) {
      if (q.status === 'scheduled' && q.scheduledAt && inThisMonth(new Date(q.scheduledAt))) {
        realEvents.push({
          day: new Date(q.scheduledAt).getDate(),
          label: q.categoryLabel ? shortPillar(q.categoryLabel) : 'Post',
          kind: 'scheduled',
        });
      }
    }
  }

  const usingReal = realEvents.length > 0;
  const events: Ev[] = usingReal
    ? realEvents
    : [
        ...mockPosts.filter((p) => inThisMonth(new Date(p.date))).map((p) => ({ day: new Date(p.date).getDate(), label: shortPillar(p.pillar), kind: 'published' as const })),
        ...mockQueue.filter((q) => inThisMonth(new Date(q.scheduledAt))).map((q) => ({ day: new Date(q.scheduledAt).getDate(), label: shortPillar(q.pillar), kind: 'scheduled' as const })),
      ];

  const eventsFor = (day: number) => events.filter((e) => e.day === day);
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <PageHeader
        title="Calendar"
        description={monthLabel}
        actions={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Published</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Scheduled</span>
          </div>
        }
      />
      {!usingReal && (
        <PreviewBanner note="Sample calendar — schedule posts in the Queue (and import history) to populate this with real data." />
      )}

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {weekdays.map((w) => <div key={w} className="px-2 py-2">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <div key={i} className={cn('min-h-24 border-b border-r border-border p-1.5 last:border-r-0', day === null && 'bg-muted/30')}>
              {day !== null && (
                <>
                  <div className="mb-1 flex justify-end">
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-xs', day === today ? 'bg-accent font-semibold text-accent-foreground' : 'text-muted-foreground')}>{day}</span>
                  </div>
                  <div className="space-y-1">
                    {eventsFor(day).map((e, j) => (
                      <div key={j} className={cn('truncate rounded px-1.5 py-0.5 text-[10px] font-medium', e.kind === 'published' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent')}>
                        {e.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-3 text-xs text-muted-foreground">
        <Badge variant="outline">Note</Badge> Drag-to-reschedule and month navigation come later; scheduled queue items and imported posts appear here automatically.
      </p>
    </div>
  );
}
