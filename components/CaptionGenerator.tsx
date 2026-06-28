'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VARIANTS = [
  { key: 'short', label: 'Short' },
  { key: 'medium', label: 'Medium' },
  { key: 'long', label: 'Long-form' },
  { key: 'story', label: 'Story text' },
  { key: 'reel_hook', label: 'Reel hook' },
  { key: 'cta', label: 'CTA' },
  { key: 'comment_reply', label: 'Comment reply' },
] as const;

type Caption = { hook: string; body: string; cta: string; hashtags: string[] };

export function CaptionGenerator({
  pillars,
  aiReady,
  hasVoice,
}: {
  pillars: { key: string; label: string }[];
  aiReady: boolean;
  hasVoice: boolean;
}) {
  const [pillarKey, setPillarKey] = useState(pillars[0]?.key ?? '');
  const [variant, setVariant] = useState<string>('medium');
  const [topic, setTopic] = useState('');
  const [caption, setCaption] = useState<Caption | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const selectedPillar = pillars.find((p) => p.key === pillarKey);

  async function generate() {
    setLoading(true);
    setError(null);
    setSaveMsg(null);
    setStatus('idle');
    try {
      const res = await fetch('/api/captions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillar: selectedPillar?.label ?? '', variant, topic }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'Generation failed');
      } else {
        const c = j.caption as Caption;
        setCaption(c);
        setText([c.hook, c.body, c.cta].filter(Boolean).join('\n\n'));
      }
    } catch {
      setError('Generation failed — check your connection.');
    }
    setLoading(false);
  }

  async function save(approve: boolean) {
    if (!caption) return;
    setSaveMsg(null);
    try {
      const res = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillarKey,
          variant,
          hook: caption.hook,
          body: caption.body,
          cta: caption.cta,
          hashtags: caption.hashtags,
          fullText: text,
          status: approve ? 'approved' : 'draft',
        }),
      });
      const j = await res.json();
      if (!res.ok) setError(j.error || 'Save failed');
      else {
        setStatus(approve ? 'approved' : 'idle');
        setSaveMsg(approve ? 'Approved and saved.' : 'Saved as draft.');
      }
    } catch {
      setError('Save failed.');
    }
  }

  return (
    <div>
      <PageHeader title="Caption Generator" description="Generate on-brand captions in your account's voice." />

      {!aiReady && (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          Add <code>ANTHROPIC_API_KEY</code> to enable generation.
          {!hasVoice && ' Generate a Brand Voice Profile first for the most on-brand results.'}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Controls */}
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Content pillar</label>
              <select
                value={pillarKey}
                onChange={(e) => setPillarKey(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {pillars.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Variant</label>
              <div className="flex flex-wrap gap-1.5">
                {VARIANTS.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setVariant(v.key)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs transition-colors',
                      variant === v.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Topic (optional)</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 90-day client transformation"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </div>
            <Button className="w-full" onClick={generate} disabled={loading || !aiReady}>
              {loading ? 'Generating…' : 'Generate'}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="accent">{VARIANTS.find((v) => v.key === variant)?.label}</Badge>
                <span className="text-xs text-muted-foreground">{selectedPillar?.label}</span>
              </div>
              {status === 'approved' && <Badge variant="success">Approved</Badge>}
              {status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
            </div>

            {caption ? (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={9}
                  className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none focus:border-ring"
                />
                {caption.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {caption.hashtags.map((h) => (
                      <Badge key={h} variant="outline">{h}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={generate} disabled={loading}>Regenerate</Button>
                  <Button variant="subtle" size="sm" onClick={() => save(true)}>Approve &amp; save</Button>
                  <Button variant="destructive" size="sm" onClick={() => setStatus('rejected')}>Reject</Button>
                  <Button variant="ghost" size="sm" onClick={() => save(false)}>Save draft</Button>
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Pick a pillar and variant, then Generate to create a caption.
              </p>
            )}

            {saveMsg && <p className="text-xs text-success">{saveMsg}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
