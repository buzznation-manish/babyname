import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/current-user';
import SaveNameButton from '@/components/save-name-button';

export const dynamic = 'force-dynamic';

export default async function ShortlistPage({ searchParams }: {
  searchParams?: Promise<{ profileId?: string | string[] }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const query = await searchParams;
  const profiles = await prisma.babyProfile.findMany({
    where: { userId }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });
  if (!profiles.length) redirect('/baby-profile');
  const requestedId = typeof query?.profileId === 'string' ? query.profileId : undefined;
  const profile = requestedId ? profiles.find((item) => item.id === requestedId) : profiles[0];
  if (!profile) return <main className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-3xl font-bold">Profile unavailable</h1><Link href="/shortlist" className="mt-6 inline-block underline">Choose your baby profile</Link></main>;
  const savedNames = await prisma.savedName.findMany({
    where: { userId, babyProfileId: profile.id },
    include: { name: true }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });
  const profileQuery = new URLSearchParams({ profileId: profile.id }).toString();

  return <main className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 px-6 py-12"><section className="mx-auto max-w-6xl">
    <nav className="mb-8 flex flex-wrap gap-5 text-sm text-rose-800"><Link href={`/recommendations?${profileQuery}`} className="underline">Your recommendations</Link><Link href={`/baby-profile?${profileQuery}`} className="underline">Manage baby profiles</Link><Link href="/names" className="underline">Browse all names</Link></nav>
    <p className="text-sm font-medium text-rose-700">Names you love</p><h1 className="mt-2 text-4xl font-bold text-stone-900">Your shortlist</h1><p className="mt-3 text-stone-600">{savedNames.length} saved {savedNames.length === 1 ? 'name' : 'names'} for {profile.babyName || 'your baby'}. Your saved names stay with this baby profile.</p>
    {profiles.length > 1 && <form action="/shortlist" className="mt-6 flex flex-wrap items-end gap-3"><label className="text-sm font-medium">Baby profile<select name="profileId" defaultValue={profile.id} className="mt-1 block rounded-lg border border-stone-300 bg-white p-3">{profiles.map((item, index) => <option key={item.id} value={item.id}>{item.babyName || `Baby profile ${index + 1}`}</option>)}</select></label><button className="rounded-lg bg-stone-900 px-5 py-3 text-sm text-white">Show shortlist</button></form>}
    {!savedNames.length ? <div className="mt-8 rounded-2xl bg-white p-8 text-center"><h2 className="text-xl font-semibold">Your shortlist is waiting for its first name</h2><p className="mt-3 text-stone-600">Save names from your recommendations or a name’s detail page.</p><Link href={`/recommendations?${profileQuery}`} className="mt-5 inline-block rounded-lg bg-stone-900 px-5 py-3 text-white">Explore recommendations</Link></div> : <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{savedNames.map(({ id, name }) => <article key={id} className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-2xl font-semibold text-stone-900"><Link href={`/names/${name.id}?${profileQuery}`} className="hover:underline">{name.nameRomanized}</Link></h2><p className="mt-1 text-stone-500">{name.nameNative} · {name.gender}</p><p className="mt-4 text-sm leading-6 text-stone-700">{name.meaning}</p><Link href={`/names/${name.id}?${profileQuery}`} className="mt-4 inline-block text-sm text-rose-800 underline">Explore name</Link><SaveNameButton profileId={profile.id} nameId={name.id} initialSaved /></article>)}</div>}
  </section></main>;
}
