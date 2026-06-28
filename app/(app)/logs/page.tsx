import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { formatDateTime } from '@/lib/utils';
import { mockPublishLogs, mockErrorLogs } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

export default function LogsPage() {
  return (
    <div>
      <PageHeader title="Logs" description="Every publish action and error, for auditing and debugging." />
      <PreviewBanner note="Sample entries — these become a live audit trail once publishing is wired." />

      <Card className="mb-6 overflow-hidden">
        <CardHeader><CardTitle>Publishing log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">When</th>
                <th className="px-5 py-2.5 font-medium">Action</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {mockPublishLogs.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatDateTime(l.at)}</td>
                  <td className="px-5 py-3"><code className="text-xs">{l.action}</code></td>
                  <td className="px-5 py-3">
                    <Badge variant={l.status === 'success' ? 'success' : 'destructive'}>{l.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Error log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">When</th>
                <th className="px-5 py-2.5 font-medium">Scope</th>
                <th className="px-5 py-2.5 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {mockErrorLogs.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatDateTime(l.at)}</td>
                  <td className="px-5 py-3"><code className="text-xs">{l.scope}</code></td>
                  <td className="px-5 py-3 text-muted-foreground">{l.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
