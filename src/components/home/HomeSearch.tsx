'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Flame, Music, Sparkles } from 'lucide-react';
import type { Song } from '@/types/song';

const DIFF_LABEL = { easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' } as const;
const DIFF_STYLE = {
  easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
} as const;

export default function HomeSearch({ initialSongs }: { initialSongs: Song[] }) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    initialSongs.forEach(s => s.tags.forEach(t => set.add(t)));
    return ['all', ...Array.from(set)];
  }, [initialSongs]);

  const filtered = useMemo(() => {
    return initialSongs.filter(s => {
      const matchQuery =
        !query.trim() ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));

      const matchTag = selectedTag === 'all' || s.tags.includes(selectedTag);

      return matchQuery && matchTag;
    });
  }, [initialSongs, query, selectedTag]);

  return (
    <div className="w-full">
      {/* Search Input Bar */}
      <div className="relative mx-auto max-w-xl">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-500">
          <Search size={20} />
        </div>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อเพลง ศิลปิน หรือแนวเพลง เช่น ฤดูร้อน, ใจนักเลง..."
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 py-3.5 pl-12 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 shadow-xl backdrop-blur-md"
        />
      </div>

      {/* Tag Pills */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs">
        {allTags.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => setSelectedTag(tag)}
            className={`rounded-full px-3 py-1 transition ${
              selectedTag === tag
                ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {tag === 'all' ? 'ทั้งหมด' : `#${tag}`}
          </button>
        ))}
      </div>

      {/* Song List Results */}
      <div className="mt-10 text-left">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Flame className="text-amber-400" size={20} />
            {query || selectedTag !== 'all' ? `ผลลัพธ์การค้นหา (${filtered.length})` : 'เพลงแนะนำยอดนิยม'}
          </h2>
          <span className="text-xs text-zinc-500">อัปเดตล่าสุด</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-12 text-center">
            <Music size={36} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-zinc-400 font-medium">ไม่พบเพลงที่ตรงกับการค้นหา</p>
            <p className="text-xs text-zinc-500 mt-1">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูสิ</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(song => (
              <Link
                key={song.id}
                href={`/song/${song.slug}`}
                prefetch={true}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition hover:border-emerald-500/50 hover:bg-zinc-900 shadow-md hover:shadow-emerald-950/20"
              >
                <div className="flex items-start gap-3.5">
                  {song.coverImage && (
                    <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      {song.youtubeId && (
                        <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-white text-[8px] shadow">
                          ▶
                        </span>
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-zinc-100 group-hover:text-emerald-400 transition truncate">
                        {song.title}
                      </h3>
                      <span className="shrink-0 rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                        คีย์ {song.originalKey}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{song.artist}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs">
                  <div className="flex flex-wrap items-center gap-1">
                    {song.chordsUsed.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="rounded bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300"
                      >
                        {c}
                      </span>
                    ))}
                    {song.chordsUsed.length > 4 && (
                      <span className="text-[10px] text-zinc-500">+{song.chordsUsed.length - 4}</span>
                    )}
                  </div>

                  <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${DIFF_STYLE[song.difficulty]}`}>
                    {DIFF_LABEL[song.difficulty]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
