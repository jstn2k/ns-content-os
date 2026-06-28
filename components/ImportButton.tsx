'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function ImportButton({ hasPosts }: { hasPosts: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/import', { method: 'POST' });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'Import failed');
      } else {
        const s = j.summary as { upserted: number; withInsights: number; errors: number };
        setResult(`Imported ${s.upserted} posts · ${s.withInsights} with insights · ${s.errors} errors.`);
        router.refresh();
      }
    } catch {
      setError('Import failed — check your connection and try again.');
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={run} disabled={loading}>
        {loading ? 'Importing…' : hasPosts ? 'Re-import history' : 'Import history'}
      </Button>
      {loading && <p className="text-xs text-muted-foreground">This can take a minute for large accounts — keep this tab open.</p>}
      {result && <p className="text-xs text-success">{result}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
