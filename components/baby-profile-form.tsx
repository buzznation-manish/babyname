'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { emptyProfileForm, profileFormState, type BabyProfileData, type BabyProfileRecord, type ProfileGender } from '@/lib/baby-profiles';

export default function BabyProfileForm({ initialProfile = null }: { initialProfile?: BabyProfileRecord | null }) {
  const profileId = initialProfile?.id ?? null;
  const [form, setForm] = useState<BabyProfileData>(() => initialProfile ? profileFormState(initialProfile) : emptyProfileForm());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveRequest = useRef<AbortController | null>(null);
  useEffect(() => () => saveRequest.current?.abort(), []);

  function updateField<K extends keyof BabyProfileData>(field: K, value: BabyProfileData[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    const controller = new AbortController();
    saveRequest.current = controller;

    try {
      const response = await fetch('/api/baby-profiles', {
        method: profileId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileId ? { id: profileId, ...form } : form),
        signal: controller.signal,
      });

      const body = (await response.json().catch(() => null)) as {
        profile?: BabyProfileRecord;
        error?: string;
      } | null;

      if (controller.signal.aborted) return;
      if (response.status === 401) { window.location.assign('/login'); return; }
      if (!response.ok || !body?.profile?.id) {
        throw new Error(body?.error ?? 'Unable to save baby profile.');
      }

      window.location.assign(`/recommendations?${new URLSearchParams({ profileId: body.profile.id })}`);
    } catch (saveError) {
      if (controller.signal.aborted) return;
      setError(saveError instanceof Error ? saveError.message : 'Unable to save baby profile.');
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-8">
        <p className="text-sm font-medium text-rose-700">{profileId ? 'Edit baby profile' : 'New baby profile'}</p>
        <h1 className="mt-2 text-3xl font-bold text-stone-900">Tell us what matters to your family</h1>
        <p className="mt-2 text-sm text-stone-600">These details help personalize future name recommendations.</p>
      </div>

      <fieldset disabled={isSaving} className="grid gap-5 md:grid-cols-2 disabled:opacity-60">
        <label className="text-sm font-medium text-stone-700">
          Baby name (optional)
          <input maxLength={100} value={form.babyName ?? ''} onChange={(event) => updateField('babyName', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Gender
          <select value={form.gender} onChange={(event) => updateField('gender', event.target.value as ProfileGender)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="BOY">Boy</option>
            <option value="GIRL">Girl</option>
            <option value="UNISEX">Unisex</option>
          </select>
        </label>
        <label className="text-sm font-medium text-stone-700">
          Birth or expected date
          <input type="date" value={form.dob} onChange={(event) => updateField('dob', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Birth time (optional)
          <input type="time" step="1" value={form.birthTime ?? ''} onChange={(event) => updateField('birthTime', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Birth place (optional)
          <input maxLength={150} value={form.birthPlace ?? ''} onChange={(event) => updateField('birthPlace', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Nakshatra (optional)
          <input maxLength={50} value={form.nakshatra ?? ''} onChange={(event) => updateField('nakshatra', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Rashi (optional)
          <input maxLength={50} value={form.rashi ?? ''} onChange={(event) => updateField('rashi', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Preferred style (optional)
          <input maxLength={50} value={form.preferredStyle ?? ''} onChange={(event) => updateField('preferredStyle', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" placeholder="Traditional, modern, spiritual…" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Maximum name length in letters (optional)
          <input type="number" min={1} max={100} value={form.preferredLengthMax ?? ''} onChange={(event) => updateField('preferredLengthMax', event.target.value ? Number(event.target.value) : null)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Preferred starting syllable (optional)
          <input maxLength={10} value={form.preferredStartSyllable ?? ''} onChange={(event) => updateField('preferredStartSyllable', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Religion
          <input maxLength={50} value={form.religion} onChange={(event) => updateField('religion', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" required />
        </label>
      </fieldset>

      {profileId && <div className="mt-6 flex flex-wrap gap-4 text-sm text-rose-800"><Link href={`/recommendations?${new URLSearchParams({ profileId })}`} className="underline">View recommendations without saving</Link><Link href={`/shortlist?${new URLSearchParams({ profileId })}`} className="underline">View shortlist</Link></div>}
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={isSaving} className="mt-8 w-full rounded-lg bg-stone-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
        {isSaving ? 'Saving profile…' : profileId ? 'Update profile and continue' : 'Save profile and continue'}
      </button>
    </form>
  );
}
