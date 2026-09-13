export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      <div className="h-8 w-2/3 rounded-lg bg-zinc-800" />
      <div className="mt-3 h-4 w-32 rounded bg-zinc-800/70" />

      <div className="mt-6 flex gap-2">
        {[16, 14, 20, 12].map((w, i) => (
          <div key={i} className="h-7 rounded-full bg-zinc-800/70" style={{ width: w * 4 }} />
        ))}
      </div>

      <div className="mt-8 h-14 rounded-xl bg-zinc-800/60" />

      <div className="mt-8 space-y-6">
        {Array.from({ length: 4 }).map((_, s) => (
          <div key={s} className="space-y-3">
            <div className="h-5 w-20 rounded-md bg-zinc-800/70" />
            {Array.from({ length: 4 }).map((_, l) => (
              <div key={l} className="space-y-1.5">
                <div className="h-3 rounded bg-zinc-800/50"
                  style={{ width: `${45 + ((l * 13) % 35)}%` }} />
                <div className="h-4 rounded bg-zinc-800"
                  style={{ width: `${65 + ((l * 11) % 30)}%` }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}