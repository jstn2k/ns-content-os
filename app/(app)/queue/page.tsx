import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateTime } from '@/lib/utils';
import { mockQueue, mockRecommendations } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

function fitVariant(fit: number): 'success' | 'warning' | 'destructive' {
  if (fit >= 0.75) return 'success';
  if (fit >= 0.6) return 'warning';
  return 'destructive';
}

export default function QueuePage() {
  return (
    <div>
      <PageHeader
        title="Content Queue"
        description="Plan, review, and approve upcoming posts. Nothing publishes without approval."
        actions={<button className={buttonClasses('primary', 'sm')}>+ New post</button>}
      />
      <PreviewBanner />

      {/* Queue table */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader><CardTitle>Queued posts</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Pillar</th>
                  <th className="px-5 py-2.5 font-medium">Type</th>
                  <th className="px-5 py-2.5 font-medium">Scheduled</th>
                  <th className="px-5 py-2.5 font-medium">Rhythm fit</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockQueue.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">{q.pillar}</p>
                      <p className="truncate text-xs text-muted-foreground">{q.caption}</p>
                    </td>
                    <td className="px-5 py-3"><Badge variant="outline">{q.type}</Badge></td>
                    <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{formatDateTime(q.scheduledAt)}</td>
                    <td className="px-5 py-3"><Badge variant={fitVariant(q.fit)}>{Math.round(q.fit * 100)}%</Badge></td>
                    <td className="px-5 py-3"><StatusBadge status={q.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommended plan */}
      <Card>
        <CardHeader><CardTitle>Recommended next 7 posts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {mockRecommendations.map((r) => (
            <div key={r.order} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{r.order}</span>
                <div>
                  <p className="text-sm font-medium">{r.pillar}</p>
                  <p className="text-xs text-muted-foreground">{r.day} · {r.time} — {r.reason}</p>
                </div>
              </div>
              <Badge variant="accent">{Math.round(r.confidence * 100)}%</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
