'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

type Caps = {
  connected: boolean;
  username?: string;
  accountType?: string | null;
  mediaCount?: number | null;
  features?: { readMedia: boolean; publish: boolean; insights: boolean; comments: boolean };
  publishingLimit?: { quotaUsage: number; quotaTotal: number } | null;
  error?: string;
};

const FEATURE_ROWS: { key: keyof NonNullable<Caps['features']>; label: string; gatedNote: string }[] = [
  { key: 'readMedia', label: 'Read media & profile', gatedNote: 'Needs instagram_business_basic' },
  { key: 'publish', label: 'Publish posts (image / carousel / reel)', gatedNote: 'Needs instagram_business_content_publish — App Review for public use' },
  { key: 'insights', label: 'Read insights (reach, saves, shares)', gatedNote: 'Needs instagram_business_manage_insights' },
  { key: 'comments', label: 'Read & manage comments', gatedNote: 'Needs instagram_business_manage_comments' },
];

export function CapabilitiesPanel() {
  const [data, setData] = useState<Caps | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/capabilities', { cache: 'no-store' });
      setData((await res.json()) as Caps);
    } catch {
      setData({ connected: false });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loading && data && !data.connected) return null; // nothing to show until connected

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>API capabilities</CardTitle>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? 'Checking…' : 'Re-check'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Checking what your account supports…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                Account type: <span className="font-medium text-foreground">{data?.accountType ?? '—'}</span>
              </span>
              <span className="text-muted-foreground">
                Media count: <span className="font-medium text-foreground">{data?.mediaCount ?? '—'}</span>
              </span>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border">
              {FEATURE_ROWS.map((row) => {
                const available = data?.features?.[row.key];
                return (
                  <div key={row.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{row.label}</p>
                      {!available && <p className="text-xs text-muted-foreground">{row.gatedNote}</p>}
                    </div>
                    {available ? (
                      <Badge variant="success">Available</Badge>
                    ) : (
                      <Badge variant="warning">Needs permission</Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg bg-muted px-4 py-3 text-sm">
              <p className="font-medium">Publishing quota (rolling 24h)</p>
              {data?.publishingLimit ? (
                <p className="mt-1 text-muted-foreground">
                  {data.publishingLimit.quotaUsage} / {data.publishingLimit.quotaTotal} posts used
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">Unavailable for this account/permission set.</p>
              )}
            </div>

            {data?.error && (
              <p className="text-xs text-destructive">
                Live check warning: {data.error}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
