'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { StatusBadge } from './StatusBadge';
import type { MockQueueStatus } from '@/lib/mock/data';

export type ClientQueueItem = {
  id: string;
  status: string;
  categoryId: string | null;
  categoryLabel: string | null;
  caption: string | null;
  hashtags: string[] | null;
  mediaUrl: string | null;
  mediaType: string | null;
  scheduledAtISO: string | null;
  rhythmExplanation: string | null;
  publishedPermalink: string | null;
};

export type ClientRec = {
  order: number;
  pillarKey: string;
  pillarLabel: string;
  day: string;
  time: string;
  confidence: number;
  reason: string;
};

type Pillar = { key: string; label: string };
const MEDIA_TYPES = ['IMAGE', 'CAROUSEL', 'REEL', 'VIDEO', 'STORY'];

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
function fmt(iso: string | null): string {
  if (!iso) return 'Not scheduled';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const inputCls =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring';

function PostForm({
  pillars,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  busy,
}: {
  pillars: Pillar[];
  initial?: Partial<ClientQueueItem>;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [categoryKey, setCategoryKey] = useState(
    pillars.find((p) => p.label === initial?.categoryLabel)?.key ?? pillars[0]?.key ?? '',
  );
  const [mediaType, setMediaType] = useState(initial?.mediaType ?? 'IMAGE');
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(initial?.scheduledAtISO ?? null));
  const [caption, setCaption] = useState(initial?.caption ?? '');
  const [hashtags, setHashtags] = useState((initial?.hashtags ?? []).join(' '));
  const [mediaUrl, setMediaUrl] = useState(initial?.mediaUrl ?? '');

  function submit() {
    onSubmit({
      categoryKey,
      mediaType,
      scheduledAt: fromLocalInput(scheduledAt) ?? null,
      caption,
      hashtags: hashtags.split(/[\s,]+/).filter(Boolean),
      mediaUrl: mediaUrl || undefined,
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Pillar</label>
          <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} className={inputCls}>
            {pillars.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Media type</label>
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className={inputCls}>
            {MEDIA_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Scheduled date/time</label>
        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Caption</label>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} className={`${inputCls} resize-y`} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Hashtags (space-separated)</label>
        <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#discipline #transformation" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Media URL (optional, public)</label>
        <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" className={inputCls} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={busy}>{busy ? 'Saving…' : submitLabel}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function QueueRow({
  item,
  pillars,
  onPatch,
  onDelete,
  busy,
}: {
  item: ClientQueueItem;
  pillars: Pillar[];
  onPatch: (id: string, body: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status as MockQueueStatus} />
            <span className="text-sm font-medium">{item.categoryLabel ?? 'Uncategorized'}</span>
            {item.mediaType && <Badge variant="outline">{item.mediaType}</Badge>}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{item.caption || '(no caption yet)'}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{fmt(item.scheduledAtISO)}</p>
          {item.rhythmExplanation && <p className="mt-0.5 text-xs text-muted-foreground italic">{item.rhythmExplanation}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex gap-1.5">
            {item.status !== 'approved' && item.status !== 'scheduled' && item.status !== 'published' && (
              <Button size="sm" variant="subtle" onClick={() => onPatch(item.id, { status: 'approved' })} disabled={busy}>Approve</Button>
            )}
            {item.status === 'approved' && (
              <Button
                size="sm"
                onClick={() => onPatch(item.id, { status: 'scheduled' })}
                disabled={busy || !item.scheduledAtISO}
                title={item.scheduledAtISO ? '' : 'Set a date/time first'}
              >
                Schedule
              </Button>
            )}
            {item.status === 'scheduled' && (
              <Button size="sm" variant="outline" onClick={() => onPatch(item.id, { status: 'approved' })} disabled={busy}>Unschedule</Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setEditing((v) => !v)}>{editing ? 'Close' : 'Edit'}</Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(item.id)} disabled={busy}>Delete</Button>
          </div>
        </div>
      </div>
      {editing && (
        <div className="mt-3 rounded-lg bg-muted/50 p-3">
          <PostForm
            pillars={pillars}
            initial={item}
            submitLabel="Save changes"
            busy={busy}
            onCancel={() => setEditing(false)}
            onSubmit={(body) => {
              onPatch(item.id, body);
              setEditing(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function QueueManager({
  items,
  pillars,
  recommendations,
  warnings,
  publishingMode,
  isRealRecs,
}: {
  items: ClientQueueItem[];
  pillars: Pillar[];
  recommendations: ClientRec[];
  warnings: string[];
  publishingMode: string;
  isRealRecs: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(url: string, method: string, body?: unknown): Promise<boolean> {
    setError(null);
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j.error as string) || 'Action failed');
      return false;
    }
    return true;
  }

  async function create(body: Record<string, unknown>) {
    setBusy('new');
    const ok = await call('/api/queue', 'POST', { ...body, status: 'needs_review' });
    setBusy(null);
    if (ok) { setShowNew(false); router.refresh(); }
  }
  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    const ok = await call(`/api/queue/${id}`, 'PATCH', body);
    setBusy(null);
    if (ok) router.refresh();
  }
  async function remove(id: string) {
    if (!confirm('Delete this queued post?')) return;
    setBusy(id);
    const ok = await call(`/api/queue/${id}`, 'DELETE');
    setBusy(null);
    if (ok) router.refresh();
  }
  async function addFromRec(rec: ClientRec) {
    setBusy(`rec-${rec.order}`);
    const ok = await call('/api/queue', 'POST', { categoryKey: rec.pillarKey, status: 'draft', rhythmExplanation: rec.reason });
    setBusy(null);
    if (ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</div>}

      {warnings.map((w, i) => (
        <div key={i} className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">⚠ {w}</div>
      ))}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            Queued posts <span className="ml-1 text-xs font-normal text-muted-foreground">· {publishingMode} mode</span>
          </CardTitle>
          <Button size="sm" onClick={() => setShowNew((v) => !v)}>{showNew ? 'Close' : '+ New post'}</Button>
        </CardHeader>
        <CardContent>
          {showNew && (
            <div className="mb-4 rounded-lg border border-border p-4">
              <PostForm pillars={pillars} submitLabel="Add to queue" busy={busy === 'new'} onCancel={() => setShowNew(false)} onSubmit={create} />
            </div>
          )}
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No queued posts yet. Click “+ New post”, or add one from the recommendations below.
            </p>
          ) : (
            items.map((item) => (
              <QueueRow key={item.id} item={item} pillars={pillars} onPatch={patch} onDelete={remove} busy={busy === item.id} />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Recommended next {recommendations.length} posts
            {!isRealRecs && <span className="ml-1 text-xs font-normal text-muted-foreground">(sample — import + categorize to personalize)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.map((r) => (
            <div key={r.order} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{r.order}</span>
                <div>
                  <p className="text-sm font-medium">{r.pillarLabel}</p>
                  <p className="text-xs text-muted-foreground">{r.day} · {r.time} — {r.reason}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="accent">{Math.round(r.confidence * 100)}%</Badge>
                <Button size="sm" variant="outline" onClick={() => addFromRec(r)} disabled={busy === `rec-${r.order}`}>Add</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
