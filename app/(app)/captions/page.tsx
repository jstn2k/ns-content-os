'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { cn } from '@/lib/utils';
import { mockPillars } from '@/lib/mock/data';

const VARIANTS = [
  { key: 'short', label: 'Short' },
  { key: 'medium', label: 'Medium' },
  { key: 'long', label: 'Long-form' },
  { key: 'story', label: 'Story text' },
  { key: 'reel_hook', label: 'Reel hook' },
  { key: 'cta', label: 'CTA' },
  { key: 'comment_reply', label: 'Comment reply' },
] as const;

type VariantKey = (typeof VARIANTS)[number]['key'];

// Backticks so apostrophes / quotes inside the samples are safe.
const SAMPLES: Record<VariantKey, { hook: string; body: string; cta: string }[]> = {
  short: [
    { hook: `Same person. Different operating system.`, body: `90 days of showing up when it was inconvenient.`, cta: `Your turn. Link in bio.` },
    { hook: `Discipline doesn't take days off.`, body: `Neither does the version of you that you're building.`, cta: `Start today.` },
  ],
  medium: [
    { hook: `He thought he was too far gone.`, body: `Six months ago he couldn't keep up with his kids. Today he's the one setting the pace. Nothing changed except his standards — and then everything changed.`, cta: `Ready to write your version? DM us "READY".` },
  ],
  long: [
    { hook: `90 days. That's it.`, body: `That's how long it took to stop being a stranger to himself. No magic. No shortcuts. Just a decision repeated daily until it became who he is. The meals were handled. The plan was clear. All he had to do was not negotiate with himself at 5 AM. The hardest part wasn't the work — it was believing he was worth the effort. He was. So are you.`, cta: `Doors close Friday. Link in bio.` },
  ],
  story: [
    { hook: `POV: you stopped negotiating`, body: `Day 1 vs Day 90 →`, cta: `Swipe up` },
  ],
  reel_hook: [
    { hook: `Stop scrolling if you've been lying to yourself.`, body: ``, cta: `` },
    { hook: `This is what 90 days of discipline looks like.`, body: ``, cta: `` },
  ],
  cta: [
    { hook: ``, body: `If you've been waiting for a sign, this is it.`, cta: `Doors close Friday — link in bio.` },
  ],
  comment_reply: [
    { hook: ``, body: `Appreciate you 🙏 The hardest part is the decision — everything after that is just execution. We've got the execution part handled for you.`, cta: `DM us and we'll map out your start.` },
  ],
};

export default function CaptionsPage() {
  const [category, setCategory] = useState(mockPillars[0].label);
  const [variant, setVariant] = useState<VariantKey>('medium');
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'approved' | 'rejected'>('idle');

  const samples = SAMPLES[variant];
  const sample = samples[index % samples.length];
  const hashtags = ['#discipline', '#transformation', '#mealprep', '#accountability'];
  const fullText = [sample.hook, sample.body, sample.cta].filter(Boolean).join('\n\n');

  function regenerate() {
    setIndex((i) => i + 1);
    setStatus('idle');
  }

  return (
    <div>
      <PageHeader title="Caption Generator" description="Generate on-brand captions in your account's voice." />
      <PreviewBanner note="Sample output — wired to the AI provider + Brand Voice Profile in a later phase." />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Controls */}
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Content pillar</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {mockPillars.map((p) => (
                  <option key={p.key} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Variant</label>
              <div className="flex flex-wrap gap-1.5">
                {VARIANTS.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => { setVariant(v.key); setIndex(0); setStatus('idle'); }}
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
            <Button className="w-full" onClick={regenerate}>Generate</Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="accent">{VARIANTS.find((v) => v.key === variant)?.label}</Badge>
                <span className="text-xs text-muted-foreground">{category}</span>
              </div>
              {status === 'approved' && <Badge variant="success">Approved</Badge>}
              {status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
            </div>

            <textarea
              key={`${variant}-${index}`}
              defaultValue={fullText}
              rows={8}
              className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none focus:border-ring"
            />

            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((h) => (
                <Badge key={h} variant="outline">{h}</Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={regenerate}>Regenerate</Button>
              <Button variant="subtle" size="sm" onClick={() => setStatus('approved')}>Approve</Button>
              <Button variant="destructive" size="sm" onClick={() => setStatus('rejected')}>Reject</Button>
              <button className={buttonClasses('ghost', 'sm')}>Save to queue</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
