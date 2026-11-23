import NamesBrowser from '@/components/names-browser';
import { parseNameFilters } from '@/lib/name-filters';

export default async function NamesPage({ searchParams }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseNameFilters(await searchParams ?? {});
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 px-6 py-12">
      <NamesBrowser key={JSON.stringify(filters)} initialFilters={filters} />
    </main>
  );
}
