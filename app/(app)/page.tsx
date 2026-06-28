import Link from 'next/link';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { getRecentPosts } from '@/lib/db/posts';
import { loadAccountAnalysis } from '@/lib/analysis/load';
import { loadRhythm } from '@/lib/rhythm/load';
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
  const account = primary?.account;

  const result = connected && account ? await loadAccountAnalysis(account.id) : null;
  const recent = connected && account ? await getRecentPosts(account.id, 5) : [];
  const rhythm = connected && account ? await loadRhythm(account.id) : null;
  const hasReal = Boolean(result);

  const dashRecs = rhythm
    ? rhythm.recommendations.slice(0, 4).map((r) => ({ key: String(r.order), label: r.pillarLabel, day: r.day, time: r.time, confidence: r.confidence }))
    : mockRecommendations.slice(0, 4).map((r) => ({ key: String(r.order), label: r.pillar, day: r.day, time: r.time, confidence: r.confidence }));

  return (
    <div>
      <PageHeader title="Dashboard" description="Your Instagram content intelligence & publishing workspace." />

      {/* Connection status — real */}
      <Card className="mb-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account status</p>
            <p className="mt-1 text-lg font-semibold">
              {connected ? `Connected${account?.username ? ` · @${account.username}` : ''}` : 'No account connected'}
            </p>
          </div>
          {connected ? (
            <Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Connected</Badge>
          ) : (
            <Link href="/connect" className={buttonClasses('primary', 'md')}>Connect account</Link>
          )}
        </div>
      </Card>

      {!hasReal && (
        <PreviewBanner note={connected ? 'No posts imported yet — run Import on the Account screen to populate these.' : 'Sample analytics — connect your account and import to see real numbers.'} />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {hasReal && result ? (
          <>
            <StatTile label="Posts analyzed" value={result.postCount} />
            <StatTile label="Avg posts / week" value={result.avgPostsPerWeek} />
            <StatTile label="Avg engagement" value={result.avgEngagementRate != null ? `${(result.avgEngagementRate * 100).toFixed(1)}%` : '—'} />
            <StatTile label="Best window" value={result.bestWindowLabel ?? '—'} />
          </>
        ) : (
          <>
            <StatTile label="Posts analyzed" value={mockKpis.postsAnalyzed} sub="sample" />
            <StatTile label="Avg posts / week" value={mockKpis.avgPostsPerWeek} sub="sample" />
            <StatTile label="Top pillar" value={<span className="text-base">{mockKpis.topPillar}</span>} sub="sample" />
            <StatTile label="Best window" value={mockKpis.bestWindow} sub="sample" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recommended next posts — real rhythm when data allows */}
        <Card>
          <CardHeader>
            <CardTitle>
              Recommended next posts
              {!rhythm && <span className="ml-1 text-xs font-normal text-muted-foreground">(sample)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashRecs.map((r) => (
              <div key={r.key} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.day} · {r.time}</p>
                </div>
                <Badge variant="accent">{Math.round(r.confidence * 100)}%</Badge>
              </div>
            ))}
            <Link href="/queue" className={cn(buttonClasses('outline', 'sm'), 'w-full')}>View full plan</Link>
          </CardContent>
        </Card>

        {/* Upcoming queue — still sample */}
        <Card>
          <CardHeader><CardTitle>Upcoming in queue <span className="ml-1 text-xs font-normal text-muted-foreground">(sample)</span></CardTitle></CardHeader>
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
            <Link href="/calendar" className={cn(buttonClasses('outline', 'sm'), 'w-full')}>Open calendar</Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent posts — real when imported */}
      <Card className="mt-6">
        <CardHeader><CardTitle>Recent posts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recent.length > 0
            ? recent.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{p.caption ?? '(no caption)'}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.mediaType}{p.postedAt ? ` · ${formatDateTime(p.postedAt)}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline">{p.mediaType}</Badge>
                    <span className="text-xs text-muted-foreground">{(p.likeCount ?? 0).toLocaleString()} likes</span>
                  </div>
                </div>
              ))
            : mockPosts.slice(0, 5).map((p) => (
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
