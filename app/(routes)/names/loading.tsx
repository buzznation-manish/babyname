export default function LoadingNames() {
  return <main className="min-h-screen bg-[#f8f8f1] px-6 py-12"><div className="mx-auto max-w-6xl"><p role="status" className="text-stone-600">Opening the name collection…</p><div aria-hidden="true" className="mt-8 grid gap-5 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-64 rounded-2xl bg-white shadow-sm motion-safe:animate-pulse" />)}</div></div></main>;
}
