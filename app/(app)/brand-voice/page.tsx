import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { mockBrandProfile } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

export default function BrandVoicePage() {
  const p = mockBrandProfile;
  return (
    <div>
      <PageHeader
        title="Brand Voice Profile"
        description="The learned voice the caption generator and recommendations use."
        actions={<button className={buttonClasses('outline', 'sm')}>Regenerate</button>}
      />
      <PreviewBanner note="Sample profile — generated from your real posts once analysis is wired." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">{p.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {p.tone.map((t) => (
              <Badge key={t} variant="accent">{t}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Common hooks</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {p.hooks.map((h) => (
                <li key={h} className="rounded-md bg-muted px-3 py-2 text-sm">&ldquo;{h}&rdquo;</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>CTA styles</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {p.ctaStyles.map((c) => (
                <li key={c} className="rounded-md bg-muted px-3 py-2 text-sm">{c}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Signature hashtags</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {p.hashtags.map((h) => (
                <Badge key={h} variant="outline">{h}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Style signals</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg caption length</p>
              <p className="mt-1">{p.avgCaptionWords} words</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Emoji style</p>
              <p className="mt-1">{p.emojiStyle}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recurring phrases</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {p.recurringPhrases.map((r) => (
                <Badge key={r} variant="default">&ldquo;{r}&rdquo;</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Topics the brand avoids</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {p.avoidedTopics.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Typical content sequence</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {p.sequencing.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <Badge variant="default">{s}</Badge>
                {i < p.sequencing.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
