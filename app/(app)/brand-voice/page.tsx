import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { AiActionButton } from '@/components/AiActionButton';
import { getPrimaryAccount } from '@/lib/db/accounts';
import { getActiveBrandVoice } from '@/lib/db/ai';
import { isAiConfigured } from '@/lib/ai';
import { mockBrandProfile } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

const asArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export default async function BrandVoicePage() {
  const primary = await getPrimaryAccount();
  const profile = primary?.account ? await getActiveBrandVoice(primary.account.id) : null;
  const aiReady = isAiConfigured();
  return profile ? <RealBrandVoice profile={profile} /> : <MockBrandVoice aiReady={aiReady} />;
}

/* ----------------------------- Real ----------------------------- */

function RealBrandVoice({ profile }: { profile: NonNullable<Awaited<ReturnType<typeof getActiveBrandVoice>>> }) {
  const tone = asArr(profile.tone);
  const hooks = asArr(profile.commonHooks);
  const ctaStyles = asArr(profile.ctaStyles);
  const hashtags = asArr(profile.topHashtags);
  const recurringPhrases = asArr(profile.recurringPhrases);
  const avoidedTopics = asArr(profile.avoidedTopics);
  const sequencing = asArr(profile.sequencingPatterns);
  const emojiStyle = typeof profile.emojiStyle === 'string' ? profile.emojiStyle : '';

  return (
    <div>
      <PageHeader
        title="Brand Voice Profile"
        description={`Generated from your posts${profile.generatedAt ? ` · ${new Date(profile.generatedAt).toLocaleDateString()}` : ''}.`}
        actions={
          <AiActionButton
            endpoint="/api/brand-voice"
            label="Regenerate"
            loadingLabel="Generating…"
            variant="outline"
            size="sm"
            successMessage={() => 'Brand voice regenerated.'}
          />
        }
      />

      <Card className="mb-6">
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{profile.summary ?? '—'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tone.map((t) => <Badge key={t} variant="accent">{t}</Badge>)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Common hooks</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">{hooks.map((h) => <li key={h} className="rounded-md bg-muted px-3 py-2 text-sm">&ldquo;{h}&rdquo;</li>)}</ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>CTA styles</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">{ctaStyles.map((c) => <li key={c} className="rounded-md bg-muted px-3 py-2 text-sm">{c}</li>)}</ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Signature hashtags</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">{hashtags.map((h) => <Badge key={h} variant="outline">{h}</Badge>)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Style signals</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg caption length</p>
              <p className="mt-1">{profile.avgCaptionWords ?? '—'} words</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Emoji style</p>
              <p className="mt-1">{emojiStyle || '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recurring phrases</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">{recurringPhrases.map((r) => <Badge key={r}>&ldquo;{r}&rdquo;</Badge>)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Topics the brand avoids</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {avoidedTopics.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-destructive" /> {a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {sequencing.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Typical content sequence</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {sequencing.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <Badge>{s}</Badge>
                  {i < sequencing.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ----------------------------- Mock / empty ----------------------------- */

function MockBrandVoice({ aiReady }: { aiReady: boolean }) {
  const p = mockBrandProfile;
  return (
    <div>
      <PageHeader
        title="Brand Voice Profile"
        description="The learned voice the caption generator and recommendations use."
        actions={
          <AiActionButton
            endpoint="/api/brand-voice"
            label="Generate brand voice"
            loadingLabel="Generating…"
            successMessage={() => 'Brand voice generated.'}
            note={aiReady ? undefined : 'Needs ANTHROPIC_API_KEY + imported posts'}
          />
        }
      />
      <PreviewBanner note="Sample profile — click Generate brand voice to build a real one from your imported posts (needs ANTHROPIC_API_KEY)." />

      <Card className="mb-6">
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{p.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">{p.tone.map((t) => <Badge key={t} variant="accent">{t}</Badge>)}</div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Common hooks</CardTitle></CardHeader>
          <CardContent><ul className="space-y-2">{p.hooks.map((h) => <li key={h} className="rounded-md bg-muted px-3 py-2 text-sm">&ldquo;{h}&rdquo;</li>)}</ul></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>CTA styles</CardTitle></CardHeader>
          <CardContent><ul className="space-y-2">{p.ctaStyles.map((c) => <li key={c} className="rounded-md bg-muted px-3 py-2 text-sm">{c}</li>)}</ul></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Signature hashtags</CardTitle></CardHeader>
          <CardContent><div className="flex flex-wrap gap-2">{p.hashtags.map((h) => <Badge key={h} variant="outline">{h}</Badge>)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Topics the brand avoids</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">{p.avoidedTopics.map((a) => <li key={a} className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-destructive" /> {a}</li>)}</ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
