'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CATEGORY_TEMPLATES, type TemplateKey } from '@/lib/categories/templates';

const MODES: { key: string; label: string; desc: string; disabled?: boolean }[] = [
  { key: 'manual', label: 'Manual', desc: 'Recommendations only — never publishes.' },
  { key: 'approval', label: 'Approval', desc: 'Publishes only after you approve each post.' },
  { key: 'auto', label: 'Auto', desc: 'Publishes automatically. Disabled until reliability is proven.', disabled: true },
];

const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC'];

export default function SettingsPage() {
  const [mode, setMode] = useState<string>('approval');
  const [tz, setTz] = useState('America/New_York');
  const [template, setTemplate] = useState<TemplateKey>('fitness');

  return (
    <div>
      <PageHeader title="Settings" description="Publishing safety, timezone, and content pillars." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Publishing mode</CardTitle>
          <CardDescription>Controls how much the app is allowed to do on its own.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                disabled={m.disabled}
                onClick={() => !m.disabled && setMode(m.key)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  active ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted',
                  m.disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <span className={cn('mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border', active ? 'border-accent' : 'border-muted-foreground')}>
                  {active && <span className="h-2 w-2 rounded-full bg-accent" />}
                </span>
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {m.label}
                    {m.disabled && <Badge variant="outline">Coming later</Badge>}
                    {m.key === 'approval' && <Badge variant="success">Recommended</Badge>}
                  </span>
                  <span className="block text-xs text-muted-foreground">{m.desc}</span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>Used for scheduling and posting-rhythm recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          >
            {TIMEZONES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Content pillars</CardTitle>
          <CardDescription>Start from a template; the AI refines these from your real posts and you can edit them.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_TEMPLATES) as TemplateKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setTemplate(k)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs transition-colors',
                  template === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {CATEGORY_TEMPLATES[k].label}
              </button>
            ))}
          </div>
          <div className="divide-y divide-border rounded-lg border border-border">
            {CATEGORY_TEMPLATES[template].pillars.map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
                <button className={buttonClasses('ghost', 'sm')}>Edit</button>
              </div>
            ))}
          </div>
          <button className={cn(buttonClasses('outline', 'sm'), 'mt-3')}>+ Add pillar</button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button>Save changes</Button>
        <span className="text-xs text-muted-foreground">(Wiring to the database comes with the settings API.)</span>
      </div>

      <Card className="mt-8 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Disconnect the Instagram account and remove stored tokens.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/connect" className={buttonClasses('destructive', 'sm')}>
            Manage connection
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
