'use client';

import Link from 'next/link';

export default function NameDetailsError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-3xl font-bold">Unable to load this name</h1><p className="mt-4 text-stone-600">Please try again in a moment.</p><div className="mt-6 flex gap-5"><button onClick={reset} className="rounded-lg bg-stone-900 px-5 py-3 text-white">Try again</button><Link href="/names" className="self-center underline">Browse names</Link></div></main>;
}
