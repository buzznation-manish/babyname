export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 px-6 py-16">
      <section className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="mb-4 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-rose-700 shadow-sm">
          Baby Name Recommendation Platform
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-6xl">
          Find a name as special as your little one.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
          A thoughtful starting point for meaningful, memorable, and culturally
          inspired baby names.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <span className="rounded-lg bg-stone-900 px-5 py-3 text-sm font-semibold text-white">
            Project scaffold ready
          </span>
          <span className="rounded-lg border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700">
            Next.js + TypeScript + Tailwind
          </span>
        </div>
      </section>
    </main>
  );
}
