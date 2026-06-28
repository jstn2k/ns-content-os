'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DisconnectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function disconnect() {
    if (!confirm('Disconnect this Instagram account? Stored access tokens will be removed.')) return;
    setLoading(true);
    await fetch('/api/account/disconnect', { method: 'POST' });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={disconnect}
      disabled={loading}
      className="inline-flex h-10 items-center rounded-lg border border-red-300 px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
    >
      {loading ? 'Disconnecting…' : 'Disconnect'}
    </button>
  );
}
