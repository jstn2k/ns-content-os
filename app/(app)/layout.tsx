import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Nav from '@/components/Nav';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-full flex-1">
      <Nav />
      <div className="flex min-h-full flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
