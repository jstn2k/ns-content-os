'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const GROUPS: { title: string | null; items: { href: string; label: string }[] }[] = [
  { title: null, items: [{ href: '/', label: 'Dashboard' }] },
  {
    title: 'Intelligence',
    items: [
      { href: '/analysis', label: 'Analysis' },
      { href: '/brand-voice', label: 'Brand Voice' },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/queue', label: 'Queue' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/captions', label: 'Captions' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/connect', label: 'Account' },
      { href: '/settings', label: 'Settings' },
      { href: '/logs', label: 'Logs' },
    ],
  },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center border-b border-border px-5">
        <span className="font-semibold tracking-tight">NS Content OS</span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {GROUPS.map((group, i) => (
          <div key={i}>
            {group.title && (
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'block rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <button
          onClick={logout}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
