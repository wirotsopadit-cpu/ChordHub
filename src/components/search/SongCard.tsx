'use client';

import Link from 'next/link';
import { Eye, ArrowUpDown } from 'lucide-react';
import type { SearchItem } from '@/types/search';
import { transposeKey } from '@/lib/chords';

const DIFF = {
    easy: { label: 'ง่าย', cls: 'bg-emerald-500/15 text-emerald-400' },
    medium: { label: 'ปานกลาง', cls: 'bg-amber-500/15 text-amber-400' },
    hard: { label: 'ยาก', cls: 'bg-rose-500/15 text-rose-400' },
} as const;

export default function SongCard({
    item, query, playableShift,
}: {
    item: SearchItem;
    query: string;
    playableShift?: number | null;
}) {
    const href =
        playableShift ? `/song/${item.s}?t=${playableShift}` : `/song/${item.s}`;

    const playKey =
        playableShift != null && playableShift !== 0
            ? transposeKey(item.k, playableShift)
            : null;

    return (
        <li>
            <Link
                href={href}
                prefetch={true}
                className="group flex h-full flex-col rounded-xl border border-zinc-800
                   bg-zinc-900/50 p-3.5 transition
                   hover:border-emerald-500/50 hover:bg-zinc-900"
            >
                <div className="flex items-start gap-3">
                    {item.img && (
                        <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                            <img
                                src={item.img}
                                alt={item.t}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            {item.yt && (
                                <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-white text-[8px] shadow">
                                    ▶
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug
                                 group-hover:text-emerald-400">
                                <Highlight text={item.t} query={query} />
                            </h3>
                            <span className="shrink-0 rounded-md bg-zinc-800 px-1.5 py-0.5
                                   font-mono text-[11px] font-bold text-emerald-400">
                                {item.k}
                            </span>
                        </div>

                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                            <Highlight text={item.a} query={query} />
                        </p>
                    </div>
                </div>

                {/* คอร์ดที่ใช้ */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                    {item.ch.slice(0, 5).map((c, i) => (
                        <span key={i} className="rounded border border-zinc-800 bg-zinc-950/60
                                     px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                            {c}
                        </span>
                    ))}
                    {item.ch.length > 5 && (
                        <span className="px-1 text-[10px] text-zinc-600">+{item.ch.length - 5}</span>
                    )}
                </div>

                <div className="mt-auto flex items-center gap-2 pt-3 text-[10px] text-zinc-600">
                    <span className={`rounded px-1.5 py-0.5 font-medium ${DIFF[item.d].cls}`}>
                        {DIFF[item.d].label}
                    </span>
                    {item.c > 0 && <span>คาโป {item.c}</span>}
                    <span className="ml-auto inline-flex items-center gap-1">
                        <Eye size={11} /> {formatCount(item.v)}
                    </span>
                </div>

                {/* แสดงเมื่อกรองด้วย "คอร์ดที่เล่นเป็น" */}
                {playKey && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-500/10
                        px-2 py-1 text-[10px] font-medium text-emerald-400">
                        <ArrowUpDown size={10} />
                        เล่นได้ถ้าปรับเป็นคีย์ {playKey}
                    </p>
                )}
            </Link>
        </li>
    );
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

/** ไฮไลต์แบบ substring ธรรมดา — ปลอดภัยกับภาษาไทยกว่า index ของ Fuse */
function Highlight({ text, query }: { text: string; query: string }) {
    const q = query.trim();
    if (q.length < 2) return <>{text}</>;

    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <>{text}</>;

    return (
        <>
            {text.slice(0, idx)}
            <mark className="rounded bg-emerald-500/25 px-0.5 text-emerald-300">
                {text.slice(idx, idx + q.length)}
            </mark>
            {text.slice(idx + q.length)}
        </>
    );
}