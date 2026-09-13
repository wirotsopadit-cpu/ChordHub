'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { Search, X, SlidersHorizontal, Loader2, WifiOff } from 'lucide-react';

import { useSearchIndex } from '@/hooks/useSearchIndex';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeThai, swapKeyboardLayout, looksLikeMistypedThai } from '@/lib/normalize';
import { applyFilters, EMPTY_FILTERS, type Filters, type FilterResult } from '@/lib/searchFilters';
import type { SearchItem } from '@/types/search';

import FilterPanel from './FilterPanel';
import ActiveChips from './ActiveChips';
import SongCard from './SongCard';
import RecentSearches from './RecentSearches';

const PAGE_SIZE = 24;

const FUSE_OPTIONS: IFuseOptions<SearchItem> = {
    keys: [
        { name: 'nt', weight: 0.50 },   // normalized title
        { name: 't', weight: 0.20 },   // raw title (จับตัวพิมพ์ตรง)
        { name: 'na', weight: 0.18 },   // normalized artist
        { name: 'al', weight: 0.07 },   // alias
        { name: 'tg', weight: 0.05 },   // tags
    ],
    threshold: 0.34,
    distance: 200,
    ignoreLocation: true,     // ⚠️ สำคัญมากกับภาษาไทยที่ไม่มีช่องว่าง
    minMatchCharLength: 2,
    includeScore: true,
    shouldSort: true,
};

export default function SearchClient() {
    const router = useRouter();
    const params = useSearchParams();
    const { items, status } = useSearchIndex();

    /* ── state ── */
    const [filters, setFilters] = useState<Filters>(() => fromURL(params));
    const [input, setInput] = useState(filters.q);
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [panelOpen, setPanelOpen] = useState(false);

    const query = useDebounce(input, 180);
    const inputRef = useRef<HTMLInputElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    /* ── sync state → URL (ไม่ทำให้หน้าเด้ง) ── */
    useEffect(() => {
        const next = { ...filters, q: query };
        const qs = toURL(next);
        router.replace(qs ? `/search?${qs}` : '/search', { scroll: false });
        setVisible(PAGE_SIZE);
    }, [query, filters, router]);

    /* ── สร้าง Fuse index (หนัก — ทำครั้งเดียว) ── */
    const fuse = useMemo(
        () => (items.length ? new Fuse(items, FUSE_OPTIONS) : null),
        [items],
    );

    /* ── ค้นหา + กรอง ── */
    const results = useMemo<FilterResult[]>(() => {
        if (!items.length) return [];

        let rows: FilterResult[];
        const q = query.trim();

        if (!q || !fuse) {
            rows = items.map(item => ({ item }));
        } else {
            const norm = normalizeThai(q);
            let hits = fuse.search(norm.length >= 2 ? norm : q);

            // ผู้ใช้ลืมเปลี่ยนแป้นพิมพ์ → ลองแปลงแล้วค้นใหม่
            if (!hits.length && looksLikeMistypedThai(q)) {
                hits = fuse.search(normalizeThai(swapKeyboardLayout(q)));
            }
            rows = hits.map((h: { item: SearchItem; score?: number }) => ({ item: h.item, score: h.score }));
        }

        return applyFilters(rows, { ...filters, q: query });
    }, [items, fuse, query, filters]);

    const shown = results.slice(0, visible);

    /* ── infinite scroll ── */
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(v => v + PAGE_SIZE); },
            { rootMargin: '400px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [shown.length]);

    /* ── คีย์ลัด: / หรือ Cmd+K เพื่อโฟกัสช่องค้นหา ── */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            const typing = tag === 'INPUT' || tag === 'TEXTAREA';
            if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
            if (e.key === 'Escape' && typing) inputRef.current?.blur();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const patch = useCallback(
        (p: Partial<Filters>) => setFilters(f => ({ ...f, ...p })),
        [],
    );

    const activeCount =
        filters.keys.length + filters.difficulty.length + filters.tags.length +
        filters.myChords.length + (filters.maxChords !== null ? 1 : 0) +
        (filters.noCapo ? 1 : 0);

    /* ────────────── render ────────────── */
    return (
        <div className="mx-auto max-w-6xl px-4 pb-24">
            {/* ── Search bar ── */}
            <div className="sticky top-0 z-30 -mx-4 bg-zinc-950/85 px-4 pb-3 pt-4 backdrop-blur-xl">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                        />
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            type="search"
                            inputMode="search"
                            enterKeyHint="search"
                            autoComplete="off"
                            placeholder="ชื่อเพลง ศิลปิน หรือคำในเนื้อเพลง…"
                            aria-label="ค้นหาเพลง"
                            className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-10
                         text-[16px] text-zinc-100 placeholder:text-zinc-600
                         outline-none transition focus:border-emerald-500
                         focus:ring-2 focus:ring-emerald-500/20"
                        />
                        {input && (
                            <button
                                onClick={() => { setInput(''); inputRef.current?.focus(); }}
                                aria-label="ล้างคำค้นหา"
                                className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2
                           place-items-center rounded-lg text-zinc-500 hover:bg-zinc-800"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setPanelOpen(true)}
                        aria-label="ตัวกรอง"
                        className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-xl
                        border transition lg:hidden
                        ${activeCount
                                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}
                    >
                        <SlidersHorizontal size={18} />
                        {activeCount > 0 && (
                            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center
                               rounded-full bg-emerald-500 text-[10px] font-bold text-zinc-950">
                                {activeCount}
                            </span>
                        )}
                    </button>
                </div>

                {activeCount > 0 && (
                    <ActiveChips
                        filters={filters}
                        onPatch={patch}
                        onClear={() => setFilters({ ...EMPTY_FILTERS, q: filters.q })}
                    />
                )}
            </div>

            {/* ── Layout ── */}
            <div className="flex gap-8 pt-4">
                {/* Sidebar (desktop) */}
                <aside className="hidden w-64 shrink-0 lg:block">
                    <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1">
                        <FilterPanel
                            filters={filters}
                            items={items}
                            onPatch={patch}
                            onClear={() => setFilters({ ...EMPTY_FILTERS, q: filters.q })}
                        />
                    </div>
                </aside>

                {/* Results */}
                <div className="min-w-0 flex-1">
                    {status === 'loading' && !items.length && (
                        <div className="flex items-center justify-center gap-2 py-20 text-sm text-zinc-500">
                            <Loader2 size={16} className="animate-spin" /> กำลังโหลดรายการเพลง…
                        </div>
                    )}

                    {status === 'error' && !items.length && (
                        <div className="py-20 text-center">
                            <WifiOff size={40} className="mx-auto text-zinc-700" />
                            <p className="mt-4 text-sm text-zinc-400">โหลดข้อมูลไม่สำเร็จ</p>
                            <button
                                onClick={() => location.reload()}
                                className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
                            >
                                ลองใหม่
                            </button>
                        </div>
                    )}

                    {status === 'ready' && (
                        <>
                            {!query && activeCount === 0 ? (
                                <RecentSearches
                                    items={items}
                                    onPick={q => { setInput(q); inputRef.current?.focus(); }}
                                />
                            ) : (
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <p className="text-sm text-zinc-500">
                                        พบ <b className="text-zinc-200">{results.length.toLocaleString('th-TH')}</b> เพลง
                                    </p>
                                    <select
                                        value={filters.sort}
                                        onChange={e => patch({ sort: e.target.value as Filters['sort'] })}
                                        aria-label="เรียงลำดับ"
                                        className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5
                               text-xs text-zinc-300 outline-none focus:border-emerald-500"
                                    >
                                        <option value="relevance">ตรงที่สุด</option>
                                        <option value="popular">ยอดนิยม</option>
                                        <option value="newest">ใหม่ล่าสุด</option>
                                        <option value="easiest">คอร์ดน้อยที่สุด</option>
                                        <option value="title">ชื่อเพลง ก–ฮ</option>
                                    </select>
                                </div>
                            )}

                            {results.length === 0 && (query || activeCount > 0) && (
                                <EmptyState
                                    query={query}
                                    onClear={() => { setInput(''); setFilters(EMPTY_FILTERS); }}
                                />
                            )}

                            <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                                {shown.map(r => (
                                    <SongCard
                                        key={r.item.i}
                                        item={r.item}
                                        query={query}
                                        playableShift={r.playableShift}
                                    />
                                ))}
                            </ul>

                            {visible < results.length && (
                                <div ref={sentinelRef} className="py-8 text-center text-xs text-zinc-600">
                                    กำลังโหลดเพิ่ม…
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Mobile filter sheet */}
            {panelOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setPanelOpen(false)} />
                    <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto
                          rounded-t-3xl border-t border-zinc-800 bg-zinc-900 p-5
                          pb-[calc(1.25rem+env(safe-area-inset-bottom))]
                          animate-[slideUp_.22s_ease-out]">
                        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-zinc-700" />
                        <FilterPanel
                            filters={filters}
                            items={items}
                            onPatch={patch}
                            onClear={() => setFilters({ ...EMPTY_FILTERS, q: filters.q })}
                        />
                        <button
                            onClick={() => setPanelOpen(false)}
                            className="mt-6 h-12 w-full rounded-xl bg-emerald-500 font-semibold text-zinc-950"
                        >
                            ดู {results.length.toLocaleString('th-TH')} เพลง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── URL <-> Filters ─── */
function fromURL(sp: URLSearchParams | ReturnType<typeof useSearchParams>): Filters {
    const get = (k: string) => sp.get(k) ?? '';
    const list = (k: string) => (get(k) ? get(k).split(',').filter(Boolean) : []);
    return {
        ...EMPTY_FILTERS,
        q: get('q'),
        keys: list('key'),
        difficulty: list('diff') as Filters['difficulty'],
        tags: list('tag'),
        myChords: list('chords'),
        maxChords: get('max') ? Number(get('max')) : null,
        noCapo: get('nocapo') === '1',
        sort: (get('sort') || 'relevance') as Filters['sort'],
    };
}

function toURL(f: Filters): string {
    const p = new URLSearchParams();
    if (f.q) p.set('q', f.q);
    if (f.keys.length) p.set('key', f.keys.join(','));
    if (f.difficulty.length) p.set('diff', f.difficulty.join(','));
    if (f.tags.length) p.set('tag', f.tags.join(','));
    if (f.myChords.length) p.set('chords', f.myChords.join(','));
    if (f.maxChords !== null) p.set('max', String(f.maxChords));
    if (f.noCapo) p.set('nocapo', '1');
    if (f.sort !== 'relevance') p.set('sort', f.sort);
    return p.toString();
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
    return (
        <div className="py-16 text-center">
            <Search size={40} className="mx-auto text-zinc-700" />
            <p className="mt-4 text-zinc-300">
                ไม่พบเพลง{query && <> ที่ตรงกับ “<b className="text-emerald-400">{query}</b>”</>}
            </p>
            <p className="mt-2 text-xs text-zinc-600">
                ลองลดตัวกรอง หรือพิมพ์คำสั้นลง เช่น ชื่อศิลปินอย่างเดียว
            </p>
            <button onClick={onClear}
                className="mt-5 rounded-xl border border-zinc-700 px-5 py-2.5 text-sm
                         hover:bg-zinc-900">
                ล้างตัวกรองทั้งหมด
            </button>
        </div>
    );
}