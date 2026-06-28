'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

type Variant = 'primary' | 'outline' | 'ghost' | 'subtle' | 'destructive';

export function AiActionButton({
  endpoint,
  label,
  loadingLabel = 'Working…',
  variant = 'primary',
  size = 'md',
  successMessage,
  note,
}: {
  endpoint: string;
  label: string;
  loadingLabel?: string;
  variant?: Variant;
  size?: 'sm' | 'md';
  successMessage?: (j: Record<string, unknown>) => string;
  note?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setError((j.error as string) || 'Request failed');
      } else {
        setMsg(successMessage ? successMessage(j) : 'Done.');
        router.refresh();
      }
    } catch {
      setError('Request failed — check your connection.');
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant={variant} size={size} onClick={run} disabled={loading}>
        {loading ? loadingLabel : label}
      </Button>
      {note && !msg && !error && <p className="text-xs text-muted-foreground">{note}</p>}
      {msg && <p className="text-xs text-success">{msg}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
