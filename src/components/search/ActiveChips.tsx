'use client';
import { X } from 'lucide-react';
import type { Filters } from '@/lib/searchFilters';

const DIFF_LABEL: Record<string, string> = {
    easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก',
};

export default function ActiveChips({
    filters, onPatch, onClear,
}: {
    filters: Filters;
    onPatch: (p: Partial<Filters>) => void;
    onClear: () => void;
}) {
    const chips: { label: string; remove: () => void }[] = [
        ...filters.keys.map(k => ({
            label: `คีย์ ${k}`,
            remove: () => onPatch({ keys: filters.keys.filter(x => x !== k) }),
        })),
        ...filters.difficulty.map(d => ({
            label: DIFF_LABEL[d],
            remove: () => onPatch({ difficulty: filters.difficulty.filter(x => x !== d) }),
        })),
        ...filters.myChords.map(c => ({
            label: `เล่น ${c} ได้`,
            remove: () => onPatch({ myChords: filters.myChords.filter(x => x !== c) }),
        })),
        ...filters.tags.map(t => ({
            label: t,
            remove: () => onPatch({ tags: filters.tags.filter(x => x !== t) }),
        })),
        ...(filters.maxChords !== null
            ? [{ label: `≤ ${filters.maxChords} คอร์ด`, remove: () => onPatch({ maxChords: null }) }]
            : []),
        ...(filters.noCapo
            ? [{ label: 'ไม่ใช้คาโป', remove: () => onPatch({ noCapo: false }) }]
            : []),
    ];

    return (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {chips.map((c, i) => (
                <button
                    key={i}
                    onClick={c.remove}
                    className="inline-flex h-7 items-center gap-1 rounded-full border
                     border-emerald-500/30 bg-emerald-500/10 pl-2.5 pr-1.5
                     text-xs text-emerald-300 hover:bg-emerald-500/20"
                >
                    {c.label}<X size={12} />
                </button>
            ))}
            <button onClick={onClear} className="ml-1 text-xs text-zinc-500 hover:text-zinc-300">
                ล้างทั้งหมด
            </button>
        </div>
    );
}