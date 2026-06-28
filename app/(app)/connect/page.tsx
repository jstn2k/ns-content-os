import { getPrimaryAccount } from '@/lib/db/accounts';
import { getImportedPostCount } from '@/lib/db/posts';
import DisconnectButton from '@/components/DisconnectButton';
import { CapabilitiesPanel } from '@/components/CapabilitiesPanel';
import { ImportButton } from '@/components/ImportButton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const primary = await getPrimaryAccount();
  const account = primary?.account;
  const connected = account?.status === 'connected' && primary?.hasToken;
  const postCount = connected && account ? await getImportedPostCount(account.id) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connected Account</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Connect one Instagram Professional account via official Instagram Login.
        </p>
      </div>

      {sp.connected && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          Account connected successfully.
        </div>
      )}
      {sp.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Connection failed: {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {connected && account ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {account.username ? `@${account.username}` : 'Connected account'}
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Connected
                </span>
              </div>
              <DisconnectButton />
            </div>
            <div className="rounded-lg bg-zinc-50 px-4 py-1 dark:bg-zinc-900">
              <Row label="Instagram handle" value={account.username ? `@${account.username}` : '—'} />
              <Row label="Account ID" value={<code className="text-xs">{account.igUserId}</code>} />
              <Row label="Account type" value={account.accountType ?? '—'} />
              <Row
                label="Token expires"
                value={
                  primary?.tokenExpiresAt
                    ? new Date(primary.tokenExpiresAt).toLocaleDateString()
                    : '—'
                }
              />
              <Row
                label="Granted permissions"
                value={
                  account.scopes && account.scopes.length > 0
                    ? `${account.scopes.length} scopes`
                    : '—'
                }
              />
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-lg font-semibold">No account connected</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
              You&apos;ll be redirected to Instagram to authorize access. Make sure your account is a
              Professional (Business or Creator) account.
            </p>
            <a
              href="/api/auth/instagram"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Connect Instagram
            </a>
          </div>
        )}
      </div>

      {connected && <CapabilitiesPanel />}

      {connected && account && (
        <Card>
          <CardHeader>
            <CardTitle>Historical import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                Imported posts: <span className="font-medium text-foreground">{postCount}</span>
              </span>
              <span className="text-muted-foreground">
                Last synced:{' '}
                <span className="font-medium text-foreground">
                  {account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : '—'}
                </span>
              </span>
            </div>
            <ImportButton hasPosts={postCount > 0} />
            <p className="text-xs text-muted-foreground">
              Pulls your posts, captions, hashtags, mentions, CTAs, and available insights from the
              official API. Thumbnail re-hosting is added once Supabase Storage keys are set.
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-zinc-400">
        We use official Instagram Login only. Tokens are encrypted at rest and never shared. You can
        disconnect at any time, which removes stored access tokens.
      </p>
    </div>
  );
}
