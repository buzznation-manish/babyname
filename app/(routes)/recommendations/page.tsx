import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { buildNameFilters, getSupportedStyle, matchesStyle, rankNames } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams?: Promise<{ profileId?: string | string[]; page?: string | string[] }>;
}

export default async function RecommendationsPage({ searchParams }: Props) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();
  if (error || !authUser?.email) redirect('/login?redirectedFrom=%2Frecommendations');

  // Scope profiles to the authenticated account before accepting any profile ID.
  const user = await prisma.user.findUnique({ where: { email: authUser.email } });
  if (!user) redirect('/baby-profile');
  const profiles = await prisma.babyProfile.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });
  if (!profiles.length) redirect('/baby-profile');
  const requestedId = typeof query?.profileId === 'string' ? query.profileId : undefined;
  const profile = requestedId ? profiles.find((item) => item.id === requestedId) : profiles[0];

  if (!profile) {
    return <main className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-3xl font-bold">Profile unavailable</h1><p className="mt-4">Choose one of your baby profiles to see suggestions.</p><Link className="mt-6 inline-block underline" href="/recommendations">Your recommendations</Link></main>;
  }

  const where = buildNameFilters(profile);
  const style = getSupportedStyle(profile.preferredStyle);
  const requestedPage = typeof query?.page === 'string' ? Number(query.page) : 1;
  const pageNumber = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = 12;
  const [candidateCount, candidates] = await prisma.$transaction([
    prisma.name.count({ where }),
    prisma.name.findMany({
      where,
      include: { categories: { include: { category: true } } },
      orderBy: [{ popularityScore: 'desc' }, { trendScore: 'desc' }, { nameRomanized: 'asc' }],
      take: 200,
    }),
  ]);
  const ranked = rankNames(candidates, profile.preferredStyle);
  const totalPages = Math.max(1, Math.ceil(ranked.length / pageSize));
  const page = Math.min(pageNumber, totalPages);
  const names = ranked.slice((page - 1) * pageSize, page * pageSize);
  const pageLink = (target: number) => `/recommendations?${new URLSearchParams({ profileId: profile.id, page: String(target) })}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 px-6 py-12">
      <section className="mx-auto max-w-6xl">
        <nav className="mb-8 flex flex-wrap gap-5 text-sm text-rose-800"><Link href="/baby-profile" className="underline">Edit baby profile</Link><Link href="/names" className="underline">Browse all names</Link></nav>
        <p className="text-sm font-medium text-rose-700">Chosen with your family in mind</p>
        <h1 className="mt-2 text-4xl font-bold text-stone-900">Name recommendations</h1>
        <p className="mt-3 text-stone-600">Suggestions based on your saved preferences. Open a name to explore its meaning.</p>

        {profiles.length > 1 && <form className="mt-6 flex flex-wrap items-end gap-3" action="/recommendations"><label className="text-sm font-medium">Baby profile<select name="profileId" defaultValue={profile.id} className="mt-1 block rounded-lg border border-stone-300 bg-white p-3">{profiles.map((item, index) => <option key={item.id} value={item.id}>{item.babyName || `Baby profile ${index + 1}`}</option>)}</select></label><button className="rounded-lg bg-stone-900 px-5 py-3 text-sm text-white">Show suggestions</button></form>}

        <div className="my-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-stone-900">Preferences used</h2>
          <ul className="mt-3 flex flex-wrap gap-3 text-sm text-stone-700">
            <li>Gender: {profile.gender === 'UNISEX' ? 'All genders' : `${profile.gender === 'BOY' ? 'Boy' : 'Girl'} and unisex`}</li>
            {profile.preferredStartSyllable && <li>Starting syllable: {profile.preferredStartSyllable}</li>}
            {profile.preferredLengthMax !== null && <li>Up to {profile.preferredLengthMax} letters</li>}
            {style && <li>{style} names first</li>}
          </ul>
          <p className="mt-3 text-sm text-stone-500">Within these preferences, names are ordered by supported style, popularity, then trend. Birth details, religion, astrology and numerology are not used in this version.</p>
          {profile.preferredStyle && !style && <p className="mt-2 text-sm text-stone-600">Your style “{profile.preferredStyle}” is saved. Style matching currently supports Modern, Spiritual and Nature.</p>}
        </div>

        {!names.length ? <div className="rounded-2xl bg-white p-8 text-center"><h2 className="text-xl font-semibold">No names match these preferences yet</h2><p className="mt-3 text-stone-600">Try a different starting syllable or a longer maximum length.</p><Link href="/baby-profile" className="mt-5 inline-block rounded-lg bg-stone-900 px-5 py-3 text-white">Update preferences</Link></div> : <>
          <p className="mb-5 text-sm text-stone-600">{candidateCount} matching names{candidateCount > 200 ? '; showing suggestions from the 200 most popular matches' : ''}.</p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{names.map((name) => <article key={name.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold text-stone-900"><Link href={`/names/${name.id}`} className="hover:underline">{name.nameRomanized}</Link></h2><p className="text-stone-500">{name.nameNative}</p></div><span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-800">{name.gender}</span></div>
            <p className="mt-4 text-sm leading-6 text-stone-700">{name.meaning}</p>
            <p className="mt-4 text-sm text-stone-600">{name.characterLength} letters · {name.origin}</p>
            {style && matchesStyle(name, style) && <p className="mt-3 text-sm font-medium text-rose-700">Matches your {style.toLowerCase()} style</p>}
            <Link href={`/names/${name.id}`} className="mt-5 inline-block text-sm font-semibold text-rose-800 underline">Explore name</Link>
          </article>)}</div>
          {totalPages > 1 && <nav aria-label="Recommendation pages" className="mt-8 flex justify-center gap-5 text-sm">{page > 1 && <Link className="underline" href={pageLink(page - 1)}>Previous</Link>}<span>Page {page} of {totalPages}</span>{page < totalPages && <Link className="underline" href={pageLink(page + 1)}>Next</Link>}</nav>}
        </>}
      </section>
    </main>
  );
}
