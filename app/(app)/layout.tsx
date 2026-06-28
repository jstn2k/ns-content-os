import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Nav from '@/components/Nav';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
