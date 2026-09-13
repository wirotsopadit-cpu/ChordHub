'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, TrendingUp, X } from 'lucide-react';
import type { SearchItem } from '@/types/search';

const KEY = 'chordhub:recent';
const MAX = 8;

export function pushRecent(q: string) {
    if (!q.trim()) return;
    try {
        const cur: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
        const next = [q, ...cur.filter(x => x !== q)].slice(0, MAX);
        localStorage.setItem(KEY, JSON.stringify(next));
    } catch { /* ignore */ }
}

export default function RecentSearches({
    items, onPick,
}: { items: SearchItem[]; onPick: (q: string) => void }) {
    const [recent, setRecent] = useState<string[]>([]);

    useEffect(() => {
        try { setRecent(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { }
    }, []);

    const popular = items.slice(0, 10);   // index เรียงตาม viewCount มาแล้ว

    return (
        <div className="space-y-8 py-2">
            {recent.length > 0 && (
                <section>
                    <div className="mb-2.5 flex items-center justify-between">
                        <h2 className="flex items-center gap-1.5 text-xs font-semibold
                           uppercase tracking-wider text-zinc-500">
                            <Clock size={13} /> ค้นหาล่าสุด
                        </h2>
                        <button
                            onClick={() => { localStorage.removeItem(KEY); setRecent([]); }}
                            className="text-xs text-zinc-600 hover:text-zinc-400"
                        >
                            ล้าง
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {recent.map(q => (
                            <button key={q} onClick={() => onPick(q)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg
                                 bg-zinc-900 px-3 text-xs text-zinc-300 hover:bg-zinc-800">
                                {q}
                                <X size={11}
                                    className="text-zinc-600 hover:text-zinc-300"
                                    onClick={e => {
                                        e.stopPropagation();
                                        const next = recent.filter(x => x !== q);
                                        setRecent(next);
                                        localStorage.setItem(KEY, JSON.stringify(next));
                                    }} />
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold
                       uppercase tracking-wider text-zinc-500">
                    <TrendingUp size={13} /> เพลงยอดนิยม
                </h2>
                <ol className="divide-y divide-zinc-800/70 overflow-hidden rounded-xl
                       border border-zinc-800 bg-zinc-900/40">
                    {popular.map((s, i) => (
                        <li key={s.i}>
                            <Link href={`/song/${s.s}`}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900">
                                <span className="w-5 shrink-0 text-center font-mono text-sm text-zinc-600">
                                    {i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm">{s.t}</p>
                                    <p className="truncate text-xs text-zinc-500">{s.a}</p>
                                </div>
                                <span className="shrink-0 rounded-md bg-zinc-800 px-1.5 py-0.5
                                 font-mono text-[11px] text-emerald-400">{s.k}</span>
                            </Link>
                        </li>
                    ))}
                </ol>
            </section>
        </div>
    );
}