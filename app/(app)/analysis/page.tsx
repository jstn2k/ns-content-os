import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat';
import { Bar } from '@/components/ui/bar';
import { Badge } from '@/components/ui/badge';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { cn } from '@/lib/utils';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { loadAccountAnalysis } from '@/lib/analysis/load';
import { getPillarDistribution } from '@/lib/db/ai';
import { isAiConfigured } from '@/lib/ai';
import { AiActionButton } from '@/components/AiActionButton';
import type { AnalysisResult } from '@/lib/analysis/engine';
import { mockPillars, mockFormatRatios, mockBestTimes, mockKpis } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

type Distribution = { key: string; label: string; count: number; share: number }[];

export default async function AnalysisPage() {
  const primary = await getPrimaryAccount();
  const result = primary?.account ? await loadAccountAnalysis(primary.account.id) : null;
  const distribution = primary?.account && result ? await getPillarDistribution(primary.account.id) : [];
  return result ? (
    <RealAnalysis result={result} distribution={distribution} aiReady={isAiConfigured()} />
  ) : (
    <MockAnalysis />
  );
}

/* ----------------------------- Real (live data) ----------------------------- */

function RealAnalysis({
  result,
  distribution,
  aiReady,
}: {
  result: AnalysisResult;
  distribution: Distribution;
  aiReady: boolean;
}) {
  const maxScore = Math.max(...result.bestWindows.map((b) => b.score), 0.0001);
  const maxWeekday = Math.max(...result.byWeekday.map((d) => d.count), 1);

  return (
    <div>
      <PageHeader
        title="Historical Analysis"
        description={`Computed from your ${result.postCount} imported posts.`}
      />

      {!result.hasInsights && (
        <div className="mb-6 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
          Engagement here is based on likes + comments. Reach/saves/shares appear once insights are
          imported (needs the insights permission).
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Posts analyzed" value={result.postCount} />
        <StatTile label="Avg / week" value={result.avgPostsPerWeek} />
        <StatTile
          label="Avg engagement"
          value={result.avgEngagementRate != null ? `${(result.avgEngagementRate * 100).toFixed(1)}%` : '—'}
        />
        <StatTile label="Best window" value={result.bestWindowLabel ?? '—'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Format mix</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Bar label="Reels" value={result.formatRatios.reels} hint={`${Math.round(result.formatRatios.reels * 100)}%`} />
            <Bar label="Carousels" value={result.formatRatios.carousel} hint={`${Math.round(result.formatRatios.carousel * 100)}%`} />
            <Bar label="Static images" value={result.formatRatios.image} hint={`${Math.round(result.formatRatios.image * 100)}%`} />
            <Bar label="Video" value={result.formatRatios.video} hint={`${Math.round(result.formatRatios.video * 100)}%`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Posts by weekday</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {result.byWeekday.map((d) => (
              <Bar key={d.day} label={d.day} value={d.count} max={maxWeekday} hint={`${d.count}`} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Best posting windows</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.bestWindows.map((b) => (
                <div key={b.day} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-medium text-muted-foreground">{b.day}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                    <div
                      className="flex h-full items-center justify-end rounded-md bg-accent px-2"
                      style={{ width: `${Math.max(8, (b.score / maxScore) * 100)}%` }}
                    >
                      <span className="text-[10px] font-medium text-accent-foreground">{b.window}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top hashtags</CardTitle></CardHeader>
          <CardContent>
            {result.topHashtags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.topHashtags.map((h) => (
                  <Badge key={h.tag} variant="outline">{h.tag} · {h.count}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hashtags found in your captions.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Top-performing posts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {result.topPosts.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm">{p.caption}</p>
                <p className="text-xs text-muted-foreground">{p.likes.toLocaleString()} likes · {p.comments.toLocaleString()} comments</p>
              </div>
              <Badge variant="outline">{p.type}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {distribution.length > 0 ? (
        <Card className="mt-6">
          <CardHeader><CardTitle>Content pillar distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {distribution.slice(0, 8).map((d) => (
              <Bar
                key={d.key}
                label={d.label}
                value={d.share}
                max={Math.max(...distribution.map((x) => x.share))}
                hint={`${Math.round(d.share * 100)}% · ${d.count}`}
              />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader><CardTitle>Content pillar distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Run AI categorization to break your posts down by content pillar.
            </p>
            <AiActionButton
              endpoint="/api/categorize"
              label="Run AI categorization"
              loadingLabel="Categorizing…"
              variant="outline"
              size="sm"
              successMessage={(j) => `Categorized ${j.categorized as number} of ${j.total as number} posts.`}
              note={aiReady ? undefined : 'Needs ANTHROPIC_API_KEY + imported posts'}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ----------------------------- Mock (no data yet) ----------------------------- */

function MockAnalysis() {
  const topPillars = [...mockPillars].sort((a, b) => b.avgEngagement - a.avgEngagement).slice(0, 5);
  const maxScore = Math.max(...mockBestTimes.map((b) => b.score));

  return (
    <div>
      <PageHeader
        title="Historical Analysis"
        description="How your account actually posts — cadence, formats, and what performs."
      />
      <PreviewBanner note="No posts imported yet — showing sample data. Connect your account and run Import on the Account screen to see real analysis." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Posts analyzed" value={mockKpis.postsAnalyzed} />
        <StatTile label="Avg / week" value={mockKpis.avgPostsPerWeek} />
        <StatTile label="Avg engagement" value={`${(mockKpis.avgEngagementRate * 100).toFixed(1)}%`} />
        <StatTile label="Best window" value={mockKpis.bestWindow} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Format mix</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Bar label="Reels" value={mockFormatRatios.reels} hint={`${Math.round(mockFormatRatios.reels * 100)}%`} />
            <Bar label="Carousels" value={mockFormatRatios.carousel} hint={`${Math.round(mockFormatRatios.carousel * 100)}%`} />
            <Bar label="Static images" value={mockFormatRatios.image} hint={`${Math.round(mockFormatRatios.image * 100)}%`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Content pillar distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {mockPillars.slice(0, 6).map((p) => (
              <Bar key={p.key} label={p.label} value={p.share} max={0.3} hint={`${Math.round(p.share * 100)}%`} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Best posting windows</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockBestTimes.map((b) => (
                <div key={b.day} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-medium text-muted-foreground">{b.day}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                    <div className="flex h-full items-center justify-end rounded-md bg-accent px-2" style={{ width: `${(b.score / maxScore) * 100}%` }}>
                      <span className="text-[10px] font-medium text-accent-foreground">{b.window}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top-performing pillars</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topPillars.map((p, i) => (
              <div key={p.key} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold', i === 0 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>{i + 1}</span>
                  <span className="text-sm">{p.label}</span>
                </div>
                <Badge variant="success">{(p.avgEngagement * 100).toFixed(1)}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
