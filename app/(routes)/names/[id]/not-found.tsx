import Link from 'next/link';

export default function NameNotFound() {
  return <main className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-3xl font-bold">Name not found</h1><p className="mt-4 text-stone-600">This name is not in the collection.</p><Link href="/names" className="mt-6 inline-block underline">Browse names</Link></main>;
}
