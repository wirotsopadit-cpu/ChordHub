export default function SongSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6 px-4 py-8">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-zinc-800/70 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-8 bg-zinc-800 rounded-lg w-2/3" />
          <div className="h-4 bg-zinc-800/60 rounded w-1/3" />
        </div>
      </div>
      <div className="flex gap-2">
        {[20, 16, 24, 14].map((w, i) => (
          <div key={i} className="h-7 rounded-full bg-zinc-800/60" style={{ width: w * 4 }} />
        ))}
      </div>
      <div className="h-12 bg-zinc-800/40 rounded-xl" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 bg-zinc-800/50 rounded" style={{ width: `${55 + ((i * 17) % 40)}%` }} />
        ))}
      </div>
    </div>
  );
}
