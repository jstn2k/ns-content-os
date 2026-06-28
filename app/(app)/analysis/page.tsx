import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat';
import { Bar } from '@/components/ui/bar';
import { Badge } from '@/components/ui/badge';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { cn } from '@/lib/utils';
import { mockPillars, mockFormatRatios, mockBestTimes, mockKpis } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

export default function AnalysisPage() {
  const topPillars = [...mockPillars].sort((a, b) => b.avgEngagement - a.avgEngagement).slice(0, 5);
  const maxScore = Math.max(...mockBestTimes.map((b) => b.score));

  return (
    <div>
      <PageHeader
        title="Historical Analysis"
        description="How your account actually posts — cadence, formats, and what performs."
      />
      <PreviewBanner />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Posts analyzed" value={mockKpis.postsAnalyzed} />
        <StatTile label="Avg / week" value={mockKpis.avgPostsPerWeek} />
        <StatTile label="Avg engagement" value={`${(mockKpis.avgEngagementRate * 100).toFixed(1)}%`} />
        <StatTile label="Best window" value={mockKpis.bestWindow} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Format mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Bar label="Reels" value={mockFormatRatios.reels} hint={`${Math.round(mockFormatRatios.reels * 100)}%`} />
            <Bar label="Carousels" value={mockFormatRatios.carousel} hint={`${Math.round(mockFormatRatios.carousel * 100)}%`} />
            <Bar label="Static images" value={mockFormatRatios.image} hint={`${Math.round(mockFormatRatios.image * 100)}%`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content pillar distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPillars.slice(0, 6).map((p) => (
              <Bar key={p.key} label={p.label} value={p.share} max={0.3} hint={`${Math.round(p.share * 100)}%`} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Best posting windows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockBestTimes.map((b) => (
                <div key={b.day} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-medium text-muted-foreground">{b.day}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                    <div
                      className="flex h-full items-center justify-end rounded-md bg-accent px-2"
                      style={{ width: `${(b.score / maxScore) * 100}%` }}
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
          <CardHeader>
            <CardTitle>Top-performing pillars</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPillars.map((p, i) => (
              <div key={p.key} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold', i === 0 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>
                    {i + 1}
                  </span>
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
