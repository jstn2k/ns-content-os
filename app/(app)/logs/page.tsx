import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { formatDateTime } from '@/lib/utils';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { getPublishingLogs, getErrorLogsForAccount } from '@/lib/db/logs';
import { mockPublishLogs, mockErrorLogs } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

function summarize(v: unknown): string {
  if (!v || typeof v !== 'object') return '';
  try {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${k}: ${String(val)}`)
      .join(' · ');
  } catch {
    return '';
  }
}

export default async function LogsPage() {
  const primary = await getPrimaryAccount();
  const account = primary?.account ?? null;
  const realPub = account ? await getPublishingLogs(account.id) : [];
  const realErr = account ? await getErrorLogsForAccount(account.id) : [];
  const usingReal = realPub.length > 0 || realErr.length > 0;

  const pubLogs = usingReal
    ? realPub.map((l) => ({ id: l.id, action: l.action, status: l.status, at: l.at as Date, detail: summarize(l.responseSummary) }))
    : mockPublishLogs;
  const errLogs = usingReal
    ? realErr.map((l) => ({ id: l.id, scope: l.scope, message: l.message, at: l.at as Date }))
    : mockErrorLogs;

  return (
    <div>
      <PageHeader title="Logs" description="Every publish action and error, for auditing and debugging." />
      {!usingReal && (
        <PreviewBanner note="Sample entries — this becomes a live audit trail once you publish or hit errors." />
      )}

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
              {pubLogs.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">No publishing activity yet.</td></tr>
              ) : (
                pubLogs.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatDateTime(l.at)}</td>
                    <td className="px-5 py-3"><code className="text-xs">{l.action}</code></td>
                    <td className="px-5 py-3">
                      <Badge variant={l.status === 'success' ? 'success' : l.status === 'failed' ? 'destructive' : 'default'}>{l.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{l.detail}</td>
                  </tr>
                ))
              )}
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
              {errLogs.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-6 text-center text-muted-foreground">No errors logged.</td></tr>
              ) : (
                errLogs.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatDateTime(l.at)}</td>
                    <td className="px-5 py-3"><code className="text-xs">{l.scope}</code></td>
                    <td className="px-5 py-3 text-muted-foreground">{l.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
