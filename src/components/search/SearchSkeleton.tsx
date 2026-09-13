export default function SearchSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 animate-pulse">
      {/* Search bar skeleton */}
      <div className="h-12 w-full rounded-xl bg-zinc-900 border border-zinc-800" />

      <div className="flex gap-8 pt-8">
        {/* Sidebar skeleton */}
        <div className="hidden w-64 shrink-0 space-y-6 lg:block">
          <div className="h-6 w-24 rounded bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-zinc-800/70" />
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-zinc-800/50" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-zinc-800/70" />
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-16 rounded-lg bg-zinc-800/50" />
              ))}
            </div>
          </div>
        </div>

        {/* Results skeleton */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="h-4 w-36 rounded bg-zinc-800/60" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3"
              >
                <div className="flex justify-between">
                  <div className="h-5 w-3/4 rounded bg-zinc-800" />
                  <div className="h-5 w-8 rounded bg-zinc-800/80" />
                </div>
                <div className="h-3 w-1/2 rounded bg-zinc-800/60" />
                <div className="flex gap-1 pt-2">
                  <div className="h-4 w-8 rounded bg-zinc-800/50" />
                  <div className="h-4 w-8 rounded bg-zinc-800/50" />
                  <div className="h-4 w-8 rounded bg-zinc-800/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
