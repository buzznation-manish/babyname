'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SaveNameButton from '@/components/save-name-button';

interface ProfileOption { id: string; babyName: string | null }

export default function NameShortlistPanel({ nameId, preferredProfileId }: {
  nameId: string;
  preferredProfileId?: string;
}) {
  const [profiles, setProfiles] = useState<ProfileOption[] | null>(null);
  const [profileId, setProfileId] = useState('');
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedState, setSavedState] = useState<{ profileId: string; saved: boolean } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfiles() {
      setError(null);
      try {
        const response = await fetch('/api/baby-profiles', { signal: controller.signal, cache: 'no-store' });
        if (response.status === 401) { setSignedOut(true); return; }
        const body = await response.json().catch(() => null) as { profiles?: ProfileOption[] } | null;
        if (!response.ok || !Array.isArray(body?.profiles)) throw new Error('Unable to load baby profiles.');
        if (controller.signal.aborted) return;
        const ownedProfiles = body.profiles;
        setProfiles(ownedProfiles);
        setProfileId((current) => ownedProfiles.some((item) => item.id === current) ? current :
          ownedProfiles.find((item) => item.id === preferredProfileId)?.id ?? ownedProfiles[0]?.id ?? '');
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load profiles.');
      }
    }
    void loadProfiles();
    return () => controller.abort();
  }, [preferredProfileId, retry]);

  useEffect(() => {
    if (!profileId) return;
    const controller = new AbortController();
    async function loadSavedState() {
      setError(null);
      setSavedState(null);
      try {
        const response = await fetch(`/api/saved-names?${new URLSearchParams({ profileId })}`, { signal: controller.signal, cache: 'no-store' });
        if (response.status === 401) { setSignedOut(true); return; }
        const body = await response.json().catch(() => null) as { savedNames?: { nameId: string }[] } | null;
        if (!response.ok || !Array.isArray(body?.savedNames)) throw new Error('Unable to load saved names.');
        if (!controller.signal.aborted) setSavedState({ profileId, saved: body.savedNames.some((item) => item.nameId === nameId) });
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load saved names.');
      }
    }
    void loadSavedState();
    return () => controller.abort();
  }, [profileId, nameId, retry]);

  return <section className="mt-8 border-t border-stone-100 pt-6"><h2 className="text-lg font-semibold text-stone-900">Keep this name for your family</h2>
    {signedOut ? <Link href="/login" className="mt-3 inline-block text-rose-800 underline">Sign in to save names</Link> : error ? <div><p role="alert" className="mt-3 text-sm text-red-700">{error}</p><button onClick={() => setRetry((value) => value + 1)} className="mt-2 text-sm underline">Try again</button></div> : profiles === null ? <p role="status" className="mt-3 text-sm text-stone-600">Loading your profiles…</p> : profiles.length === 0 ? <Link href="/baby-profile" className="mt-3 inline-block underline">Create a baby profile to start a shortlist</Link> : <>
      <label className="mt-3 block text-sm font-medium text-stone-700">Save for<select value={profileId} onChange={(event) => setProfileId(event.target.value)} className="mt-1 block rounded-lg border border-stone-300 bg-white p-3">{profiles.map((profile, index) => <option key={profile.id} value={profile.id}>{profile.babyName || `Baby profile ${index + 1}`}</option>)}</select></label>
      {savedState?.profileId === profileId ? <SaveNameButton key={`${profileId}:${nameId}`} profileId={profileId} nameId={nameId} initialSaved={savedState.saved} /> : <p role="status" className="mt-3 text-sm text-stone-600">Checking your shortlist…</p>}
      <Link href={`/shortlist?${new URLSearchParams({ profileId })}`} className="mt-4 inline-block text-sm text-rose-800 underline">View this baby’s shortlist</Link>
    </>}
  </section>;
}
