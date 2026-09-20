'use client';

import { type FormEvent, useEffect, useState } from 'react';

type Gender = 'BOY' | 'GIRL' | 'UNISEX';

interface BabyProfile {
  id: string;
  babyName: string | null;
  gender: Gender;
  dob: string;
  birthTime: string | null;
  birthPlace: string | null;
  nakshatra: string | null;
  rashi: string | null;
  preferredStyle: string | null;
  preferredLengthMax: number | null;
  preferredStartSyllable: string | null;
  religion: string;
}

type FormState = Omit<BabyProfile, 'id'>;

const emptyForm: FormState = {
  babyName: '',
  gender: 'UNISEX',
  dob: '',
  birthTime: '',
  birthPlace: '',
  nakshatra: '',
  rashi: '',
  preferredStyle: '',
  preferredLengthMax: null,
  preferredStartSyllable: '',
  religion: 'Hindu',
};

function toFormState(profile: BabyProfile): FormState {
  return {
    ...profile,
    dob: profile.dob.slice(0, 10),
    babyName: profile.babyName ?? '',
    birthTime: profile.birthTime ?? '',
    birthPlace: profile.birthPlace ?? '',
    nakshatra: profile.nakshatra ?? '',
    rashi: profile.rashi ?? '',
    preferredStyle: profile.preferredStyle ?? '',
    preferredStartSyllable: profile.preferredStartSyllable ?? '',
    preferredLengthMax: profile.preferredLengthMax,
  };
}

export default function BabyProfileForm() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/baby-profiles');
        if (response.status === 401) {
          window.location.assign('/login');
          return;
        }

        const body = (await response.json()) as {
          profiles?: BabyProfile[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error ?? 'Unable to load baby profile.');
        }

        const firstProfile = body.profiles?.[0];
        if (firstProfile) {
          setProfileId(firstProfile.id);
          setForm(toFormState(firstProfile));
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load baby profile.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, []);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/baby-profiles', {
        method: profileId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileId ? { id: profileId, ...form } : form),
      });

      const body = (await response.json()) as {
        profile?: BabyProfile;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to save baby profile.');
      }

      window.location.assign('/recommendations');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save baby profile.');
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-center text-stone-600">Loading your baby profile…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-8">
        <p className="text-sm font-medium text-rose-700">Your baby profile</p>
        <h1 className="mt-2 text-3xl font-bold text-stone-900">Tell us what matters to your family</h1>
        <p className="mt-2 text-sm text-stone-600">These details help personalize future name recommendations.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-stone-700">
          Baby name (optional)
          <input value={form.babyName ?? ''} onChange={(event) => updateField('babyName', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Gender
          <select value={form.gender} onChange={(event) => updateField('gender', event.target.value as Gender)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="BOY">Boy</option>
            <option value="GIRL">Girl</option>
            <option value="UNISEX">Unisex</option>
          </select>
        </label>
        <label className="text-sm font-medium text-stone-700">
          Date of birth
          <input type="date" value={form.dob} onChange={(event) => updateField('dob', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Birth time (optional)
          <input type="time" value={form.birthTime ?? ''} onChange={(event) => updateField('birthTime', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Birth place (optional)
          <input value={form.birthPlace ?? ''} onChange={(event) => updateField('birthPlace', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Nakshatra (optional)
          <input value={form.nakshatra ?? ''} onChange={(event) => updateField('nakshatra', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Rashi (optional)
          <input value={form.rashi ?? ''} onChange={(event) => updateField('rashi', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Preferred style (optional)
          <input value={form.preferredStyle ?? ''} onChange={(event) => updateField('preferredStyle', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" placeholder="Traditional, modern, spiritual…" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Maximum name length (optional)
          <input type="number" min={1} value={form.preferredLengthMax ?? ''} onChange={(event) => updateField('preferredLengthMax', event.target.value ? Number(event.target.value) : null)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Preferred starting syllable (optional)
          <input value={form.preferredStartSyllable ?? ''} onChange={(event) => updateField('preferredStartSyllable', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Religion
          <input value={form.religion} onChange={(event) => updateField('religion', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" required />
        </label>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={isSaving} className="mt-8 w-full rounded-lg bg-stone-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
        {isSaving ? 'Saving profile…' : profileId ? 'Update profile and continue' : 'Save profile and continue'}
      </button>
    </form>
  );
}
