import BabyProfileForm from '@/components/baby-profile-form';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/current-user';
import { selectBabyProfile, serializeBabyProfile } from '@/lib/baby-profiles';

export const dynamic = 'force-dynamic';

export default async function BabyProfilePage({ searchParams }: {
  searchParams?: Promise<{ profileId?: string | string[]; new?: string | string[] }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const profiles = (await prisma.babyProfile.findMany({
    where: { userId }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  })).map(serializeBabyProfile);
  const selection = selectBabyProfile(profiles, await searchParams ?? {});
  const selected = selection.mode === 'edit' ? selection.profile : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 flex flex-wrap gap-5 text-sm text-rose-800"><Link href="/names" className="underline">Browse all names</Link>{selected && <><Link href={`/recommendations?${new URLSearchParams({ profileId: selected.id })}`} className="underline">Your recommendations</Link><Link href={`/shortlist?${new URLSearchParams({ profileId: selected.id })}`} className="underline">Your shortlist</Link></>}</nav>
        <div className="grid items-start gap-8 lg:grid-cols-[18rem_1fr]">
          <aside className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-900">Your baby profiles</h2>
            <p className="mt-2 text-sm text-stone-600">Keep preferences and saved names separate for each baby.</p>
            <Link href="/baby-profile?new=1" className="mt-5 inline-block rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white">{profiles.length ? 'Add another baby' : 'Create your first profile'}</Link>
            {profiles.length ? <ul className="mt-6 space-y-4">{profiles.map((profile, index) => {
              const query = new URLSearchParams({ profileId: profile.id }).toString();
              return <li key={profile.id} className={`rounded-lg border p-3 ${selected?.id === profile.id ? 'border-rose-300 bg-rose-50' : 'border-stone-200'}`}><Link aria-current={selected?.id === profile.id ? 'page' : undefined} href={`/baby-profile?${query}`} className="font-semibold text-stone-900 hover:underline">{profile.babyName || `Baby profile ${index + 1}`}</Link><p className="mt-1 text-xs text-stone-500">{profile.gender} · Birth / expected date: {profile.dob}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-rose-800"><Link href={`/baby-profile?${query}`} className="underline">Edit</Link><Link href={`/recommendations?${query}`} className="underline">Recommendations</Link><Link href={`/shortlist?${query}`} className="underline">Shortlist</Link></div></li>;
            })}</ul> : <p className="mt-5 text-sm text-stone-600">No baby profiles yet. Start with the form to get personalized suggestions.</p>}
          </aside>
          {selection.mode === 'unavailable' ? <section className="rounded-2xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold">Profile unavailable</h1><p className="mt-3 text-stone-600">Choose one of your profiles or create a new one.</p><Link href="/baby-profile" className="mt-5 inline-block underline">Back to your profiles</Link></section> : <div>{selection.mode === 'new' && profiles.length > 0 && <p className="mb-4 text-sm text-stone-600">You’re creating a separate baby profile. Choose an existing profile on the left to edit it instead.</p>}<BabyProfileForm key={selected?.id ?? 'new'} initialProfile={selected} /></div>}
        </div>
      </div>
    </main>
  );
}
