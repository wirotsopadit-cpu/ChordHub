'use client';

import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import type { SearchItem } from '@/types/search';
import type { Filters } from '@/lib/searchFilters';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MINOR_KEYS = KEYS.map(k => k + 'm');
const COMMON_CHORDS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'G7', 'C7', 'D7', 'E7', 'A7', 'B7'];
const DIFFICULTIES = [
    { v: 'easy', label: 'ง่าย', color: 'emerald' },
    { v: 'medium', label: 'ปานกลาง', color: 'amber' },
    { v: 'hard', label: 'ยาก', color: 'rose' },
] as const;

interface Props {
    filters: Filters;
    items: SearchItem[];
    onPatch: (p: Partial<Filters>) => void;
    onClear: () => void;
}

export default function FilterPanel({ filters, items, onPatch, onClear }: Props) {
    /* นับจำนวนเพลงในแต่ละ tag แบบ dynamic */
    const topTags = useMemo(() => {
        const count = new Map<string, number>();
        for (const it of items) for (const t of it.tg) count.set(t, (count.get(t) ?? 0) + 1);
        return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
    }, [items]);

    const toggle = <K extends keyof Filters>(field: K, value: string) => {
        const cur = filters[field] as unknown as string[];
        const next = cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value];
        onPatch({ [field]: next } as Partial<Filters>);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-200">ตัวกรอง</h2>
                <button onClick={onClear}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
                    <RotateCcw size={12} /> ล้าง
                </button>
            </div>

            {/* ── ⭐ คอร์ดที่ฉันเล่นเป็น ── */}
            <Section
                title="คอร์ดที่ฉันเล่นเป็น"
                hint="ระบบจะหาเพลงที่ทรานสโพสแล้วเล่นได้ด้วยคอร์ดเหล่านี้"
            >
                <div className="flex flex-wrap gap-1.5">
                    {COMMON_CHORDS.map(c => (
                        <Pill key={c}
                            active={filters.myChords.includes(c)}
                            onClick={() => toggle('myChords', c)}
                            mono>
                            {c}
                        </Pill>
                    ))}
                </div>

                {filters.myChords.length > 0 && (
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                        <input
                            type="checkbox"
                            checked={filters.ignoreExtensions}
                            onChange={e => onPatch({ ignoreExtensions: e.target.checked })}
                            className="h-4 w-4 rounded accent-emerald-500"
                        />
                        นับ Am7 / Asus4 เป็น Am / A ด้วย
                    </label>
                )}
            </Section>

            {/* ── คีย์ต้นฉบับ ── */}
            <Section title="คีย์ต้นฉบับ">
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-600">เมเจอร์</p>
                <div className="flex flex-wrap gap-1.5">
                    {KEYS.map(k => (
                        <Pill key={k} active={filters.keys.includes(k)}
                            onClick={() => toggle('keys', k)} mono>{k}</Pill>
                    ))}
                </div>
                <p className="mb-1.5 mt-3 text-[10px] uppercase tracking-wider text-zinc-600">ไมเนอร์</p>
                <div className="flex flex-wrap gap-1.5">
                    {MINOR_KEYS.map(k => (
                        <Pill key={k} active={filters.keys.includes(k)}
                            onClick={() => toggle('keys', k)} mono>{k}</Pill>
                    ))}
                </div>
            </Section>

            {/* ── ความยาก ── */}
            <Section title="ระดับความยาก">
                <div className="flex gap-1.5">
                    {DIFFICULTIES.map(d => (
                        <Pill key={d.v}
                            active={filters.difficulty.includes(d.v)}
                            onClick={() => toggle('difficulty', d.v)}>
                            {d.label}
                        </Pill>
                    ))}
                </div>
            </Section>

            {/* ── จำนวนคอร์ด ── */}
            <Section title="จำนวนคอร์ดในเพลง">
                <div className="flex gap-1.5">
                    {[3, 4, 5, 6].map(n => (
                        <Pill key={n}
                            active={filters.maxChords === n}
                            onClick={() => onPatch({ maxChords: filters.maxChords === n ? null : n })}>
                            ≤ {n}
                        </Pill>
                    ))}
                </div>
            </Section>

            {/* ── คาโป ── */}
            <Section title="คาโป">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                    <input type="checkbox"
                        checked={filters.noCapo}
                        onChange={e => onPatch({ noCapo: e.target.checked })}
                        className="h-4 w-4 rounded accent-emerald-500" />
                    เฉพาะเพลงที่ไม่ต้องใช้คาโป
                </label>
            </Section>

            {/* ── แนวเพลง ── */}
            {topTags.length > 0 && (
                <Section title="แนวเพลง">
                    <div className="flex flex-wrap gap-1.5">
                        {topTags.map(([tag, n]) => (
                            <Pill key={tag} active={filters.tags.includes(tag)}
                                onClick={() => toggle('tags', tag)}>
                                {tag} <span className="opacity-50">{n}</span>
                            </Pill>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
}

/* ── ชิ้นส่วนย่อย ── */
function Section({
    title, hint, children,
}: { title: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {title}
            </h3>
            {hint && <p className="mb-2 text-[11px] leading-snug text-zinc-600">{hint}</p>}
            {children}
        </div>
    );
}

function Pill({
    active, onClick, children, mono = false,
}: {
    active: boolean; onClick: () => void; children: React.ReactNode; mono?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`h-8 rounded-lg px-2.5 text-xs transition active:scale-95
                  ${mono ? 'font-mono font-semibold' : ''}
                  ${active
                    ? 'bg-emerald-500 font-bold text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}`}
        >
            {children}
        </button>
    );
}