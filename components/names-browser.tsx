'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { NameFilters } from '@/lib/name-filters';

type Gender = 'BOY' | 'GIRL' | 'UNISEX';

interface NameRecord {
  id: string;
  nameRomanized: string;
  nameNative: string;
  startingSyllable: string;
  gender: Gender;
  origin: string;
  meaning: string;
  pronunciation: string | null;
  syllablesCount: number;
  characterLength: number;
  popularityScore: number;
  trendScore: number;
  modernityScore: number;
  spiritualityScore: number;
  uniquenessScore: number;
  categories: { category: { name: string } }[];
}

interface NamesResponse {
  names: NameRecord[];
  categories: string[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  error?: string;
}

export default function NamesBrowser({ initialFilters }: { initialFilters: NameFilters }) {
  const [search, setSearch] = useState(initialFilters.search);
  const [settledSearch, setSettledSearch] = useState(initialFilters.search);
  const [gender, setGender] = useState(initialFilters.gender);
  const [category, setCategory] = useState(initialFilters.category);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NamesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (search !== settledSearch) return;
    const controller = new AbortController();
    async function loadNames() {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), pageSize: '12' });
      if (settledSearch.trim()) params.set('search', settledSearch.trim());
      if (gender) params.set('gender', gender);
      if (category) params.set('category', category);
      try {
        const response = await fetch(`/api/names?${params}`, { signal: controller.signal });
        const body = await response.json().catch(() => null) as NamesResponse | null;
        if (!response.ok || !body?.names || !body.pagination) throw new Error(body?.error ?? 'Unable to load names. Please try again.');
        if (!controller.signal.aborted) setData(body);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : 'Unable to load names.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadNames();
    return () => controller.abort();
  }, [category, gender, page, settledSearch, search]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setIsLoading(true);
    setter(value);
    setPage(1);
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-rose-700">Explore the collection</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-stone-900">Find a meaningful baby name</h1>
        <p className="mt-3 text-stone-600">Search names by meaning, gender, starting syllable, or category.</p>
      </div>

      <div className="mb-8 grid gap-3 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-4">
        <input value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} aria-label="Search names or meanings" placeholder="Search names or meanings" className="rounded-lg border border-stone-300 px-3 py-2 md:col-span-2" />
        <select aria-label="Filter by gender" value={gender} onChange={(event) => updateFilter(setGender, event.target.value)} className="rounded-lg border border-stone-300 bg-white px-3 py-2">
          <option value="">All genders</option><option value="BOY">Boy</option><option value="GIRL">Girl</option><option value="UNISEX">Unisex</option>
        </select>
        <select aria-label="Filter by category" value={category} onChange={(event) => updateFilter(setCategory, event.target.value)} className="rounded-lg border border-stone-300 bg-white px-3 py-2">
          <option value="">All categories</option>
          {data?.categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {isLoading && <p role="status" className="mb-4 text-stone-600">{data ? 'Updating names…' : 'Loading names…'}</p>}
      {isLoading && !data && <div aria-hidden="true" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-64 rounded-2xl bg-white p-6 shadow-sm motion-safe:animate-pulse"><div className="h-7 w-24 rounded bg-stone-100" /><div className="mt-6 h-4 rounded bg-stone-100" /><div className="mt-3 h-4 w-3/4 rounded bg-stone-100" /></div>)}</div>}
      {!isLoading && !error && data?.names.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-stone-600 shadow-sm">No names matched your filters.</p>}

      <div aria-busy={isLoading} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {!error && data?.names.map((name) => (
          <article key={name.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="text-2xl font-semibold text-stone-900"><Link href={`/names/${name.id}`} className="hover:underline">{name.nameRomanized}</Link></h2><p className="text-sm text-stone-500">{name.nameNative}</p></div>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">{name.gender}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-700">{name.meaning}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-xs text-stone-500">
              <div><dt>Origin</dt><dd className="font-medium text-stone-700">{name.origin}</dd></div>
              <div><dt>Starts with</dt><dd className="font-medium text-stone-700">{name.startingSyllable}</dd></div>
              <div><dt>Syllables</dt><dd className="font-medium text-stone-700">{name.syllablesCount}</dd></div>
              <div><dt>Popularity</dt><dd className="font-medium text-stone-700">{name.popularityScore}</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">{name.categories.map(({ category: item }) => <span key={item.name} className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-800">{item.name}</span>)}</div>
          </article>
        ))}
      </div>

      {!error && data && data.pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button disabled={isLoading || page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-stone-600">Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <button disabled={isLoading || page >= data.pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </section>
  );
}
