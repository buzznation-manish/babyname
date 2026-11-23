'use client';

export default function BabyProfilesError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-3xl font-bold">Unable to load baby profiles</h1><p className="mt-4 text-stone-600">Please try again in a moment.</p><button onClick={reset} className="mt-6 rounded-lg bg-stone-900 px-5 py-3 text-white">Try again</button></main>;
}
