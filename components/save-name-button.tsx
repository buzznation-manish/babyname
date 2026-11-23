'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SaveNameButton({ profileId, nameId, initialSaved }: {
  profileId: string;
  nameId: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setSaved(initialSaved), [initialSaved]);

  async function toggleSaved() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/saved-names', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, nameId }),
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const body = await response.json().catch(() => null) as { saved?: boolean; error?: string } | null;
      if (!response.ok || typeof body?.saved !== 'boolean') {
        throw new Error(body?.error ?? 'Unable to update saved names. Please try again.');
      }
      setSaved(body.saved);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to update saved names.');
    } finally {
      setPending(false);
    }
  }

  return <div className="mt-4"><button type="button" onClick={toggleSaved} disabled={pending} aria-pressed={saved} className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50">{pending ? 'Updating…' : saved ? 'Remove from shortlist' : 'Save to shortlist'}</button>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
