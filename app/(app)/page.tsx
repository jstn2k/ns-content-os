import Link from 'next/link';
import { getPrimaryAccount } from '@/lib/db/accounts';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const primary = await getPrimaryAccount();
  const connected = primary?.account.status === 'connected' && primary.hasToken;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your Instagram content intelligence & publishing workspace.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-medium text-zinc-500">Account status</h2>
        {connected ? (
          <div className="mt-2">
            <p className="text-lg font-semibold">
              Connected{primary?.account.username ? ` · @${primary.account.username}` : ''}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              You&apos;re ready to import history and analyze your posting rhythm (coming next).
            </p>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-lg font-semibold">No account connected</p>
            <p className="mt-1 text-sm text-zinc-500">
              Connect your Instagram Professional account to get started.
            </p>
            <Link
              href="/connect"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Connect account
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Historical import', desc: 'Pull your past posts & metrics' },
          { title: 'Brand voice profile', desc: 'Learn your tone, hooks & pillars' },
          { title: 'Posting rhythm', desc: 'Recommend what to post next' },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-5 dark:border-zinc-700 dark:bg-zinc-900/40"
          >
            <p className="font-medium">{c.title}</p>
            <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
            <span className="mt-3 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
              Coming next
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
