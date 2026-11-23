import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function NameDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const name = await prisma.name.findUnique({
    where: { id },
    include: { categories: { include: { category: true } } },
  });
  if (!name) notFound();

  return <main className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 px-6 py-12"><article className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
    <nav className="mb-8 flex flex-wrap gap-5 text-sm text-rose-800"><Link href="/recommendations" className="underline">Your recommendations</Link><Link href="/names" className="underline">All names</Link></nav>
    <p className="text-sm font-medium text-rose-700">Discover the meaning</p><h1 className="mt-3 text-5xl font-bold text-stone-900">{name.nameRomanized}</h1><p className="mt-3 text-2xl text-stone-500">{name.nameNative}</p><p className="mt-6 text-lg leading-8 text-stone-700">{name.meaning}</p>
    <dl className="mt-8 grid grid-cols-2 gap-6 text-sm">{[['Gender', name.gender], ['Origin', name.origin], ['Starting syllable', name.startingSyllable], ['Letters', name.characterLength], ['Syllables', name.syllablesCount], ...(name.pronunciation ? [['Pronunciation', name.pronunciation]] : [])].map(([label, value]) => <div key={label}><dt className="text-stone-500">{label}</dt><dd className="mt-1 font-semibold text-stone-900">{value}</dd></div>)}</dl>
    <div className="mt-8 flex flex-wrap gap-2">{name.categories.map(({ category }) => <span key={category.id} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900">{category.name}</span>)}</div>
  </article></main>;
}
