import Link from 'next/link';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { StatusBadge } from '@/components/StatusBadge';
import { cn, formatDateTime } from '@/lib/utils';
import { mockKpis, mockRecommendations, mockQueue, mockPosts } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const primary = await getPrimaryAccount();
  const connected = primary?.account.status === 'connected' && primary.hasToken;

  return (
    <div>
      <PageHeader title="Dashboard" description="Your Instagram content intelligence & publishing workspace." />

      {/* Connection status — real */}
      <Card className="mb-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account status</p>
            {connected ? (
              <p className="mt-1 text-lg font-semibold">
                Connected{primary?.account.username ? ` · @${primary.account.username}` : ''}
              </p>
            ) : (
              <p className="mt-1 text-lg font-semibold">No account connected</p>
            )}
          </div>
          {connected ? (
            <Badge variant="success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Connected
            </Badge>
          ) : (
            <Link href="/connect" className={buttonClasses('primary', 'md')}>
              Connect account
            </Link>
          )}
        </div>
      </Card>

      <PreviewBanner note="Sample analytics below — these become live once history import + analysis are wired." />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Posts analyzed" value={mockKpis.postsAnalyzed} sub="last 12 months" />
        <StatTile label="Avg posts / week" value={mockKpis.avgPostsPerWeek} sub="current cadence" />
        <StatTile label="Top pillar" value={<span className="text-base">{mockKpis.topPillar}</span>} sub="by volume" />
        <StatTile label="Best window" value={mockKpis.bestWindow} sub="highest engagement" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recommended next posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended next posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRecommendations.slice(0, 4).map((r) => (
              <div key={r.order} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{r.pillar}</p>
                  <p className="text-xs text-muted-foreground">{r.day} · {r.time}</p>
                </div>
                <Badge variant="accent">{Math.round(r.confidence * 100)}%</Badge>
              </div>
            ))}
            <Link href="/queue" className={cn(buttonClasses('outline', 'sm'), 'w-full')}>
              View full plan
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming queue */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming in queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockQueue.slice(0, 4).map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{q.pillar}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(q.scheduledAt)}</p>
                </div>
                <StatusBadge status={q.status} />
              </div>
            ))}
            <Link href="/calendar" className={cn(buttonClasses('outline', 'sm'), 'w-full')}>
              Open calendar
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent posts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockPosts.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm">{p.caption}</p>
                <p className="text-xs text-muted-foreground">{p.pillar} · {formatDateTime(p.date)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">{p.type}</Badge>
                <span className="text-xs text-muted-foreground">{p.likes.toLocaleString()} likes</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
