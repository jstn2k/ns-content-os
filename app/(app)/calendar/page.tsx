import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { cn } from '@/lib/utils';
import { mockPosts, mockQueue } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

type Ev = { day: number; label: string; kind: 'published' | 'scheduled' };

function shortPillar(p: string) {
  return p.split(' / ')[0];
}

export default function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const events: Ev[] = [];
  for (const p of mockPosts) {
    const d = new Date(p.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      events.push({ day: d.getDate(), label: shortPillar(p.pillar), kind: 'published' });
    }
  }
  for (const q of mockQueue) {
    const d = new Date(q.scheduledAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      events.push({ day: d.getDate(), label: shortPillar(q.pillar), kind: 'scheduled' });
    }
  }
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
      <PreviewBanner />

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {weekdays.map((w) => (
            <div key={w} className="px-2 py-2">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <div
              key={i}
              className={cn(
                'min-h-24 border-b border-r border-border p-1.5 last:border-r-0',
                day === null && 'bg-muted/30',
              )}
            >
              {day !== null && (
                <>
                  <div className="mb-1 flex justify-end">
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                        day === today ? 'bg-accent font-semibold text-accent-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {eventsFor(day).map((e, j) => (
                      <div
                        key={j}
                        className={cn(
                          'truncate rounded px-1.5 py-0.5 text-[10px] font-medium',
                          e.kind === 'published' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent',
                        )}
                      >
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
        <Badge variant="outline">Note</Badge>{' '}
        Drag-to-reschedule and month navigation come once the queue is wired to live data.
      </p>
    </div>
  );
}
