import { canonicalChord, simplifyChord, transposeChord, NOTE_INDEX } from './chords';
import type { SearchItem } from '@/types/search';
import type { Difficulty } from '@/types/song';

export type SortKey = 'relevance' | 'popular' | 'newest' | 'title' | 'easiest';

export interface Filters {
    q: string;
    keys: string[];              // คีย์ต้นฉบับ
    difficulty: Difficulty[];
    tags: string[];
    maxChords: number | null;    // เพลงที่ใช้คอร์ดไม่เกิน N ตัว
    myChords: string[];          // คอร์ดที่ผู้ใช้เล่นเป็น
    ignoreExtensions: boolean;   // ให้ Am7 นับเป็น Am
    noCapo: boolean;             // เฉพาะเพลงที่ไม่ต้องใช้คาโป
    sort: SortKey;
}

export const EMPTY_FILTERS: Filters = {
    q: '', keys: [], difficulty: [], tags: [],
    maxChords: null, myChords: [], ignoreExtensions: true,
    noCapo: false, sort: 'relevance',
};

/** เทียบคีย์แบบ enharmonic (C# = Db) */
function keyIndex(k: string): number {
    const isMinor = k.endsWith('m');
    const base = isMinor ? k.slice(0, -1) : k;
    return (NOTE_INDEX[base] ?? 0) + (isMinor ? 100 : 0);
}

/**
 * ⭐ หาว่าเพลงนี้ทรานสโพสไปกี่ครึ่งเสียงแล้วเล่นได้ด้วยคอร์ดที่รู้
 * คืนค่า: จำนวนครึ่งเสียงที่น้อยที่สุด | null ถ้าเล่นไม่ได้เลย
 */
export function findPlayableShift(
    chordsUsed: string[],
    known: Set<string>,
    simplify: boolean,
): number | null {
    if (!chordsUsed.length || !known.size) return null;

    const norm = (c: string) => (simplify ? simplifyChord(c) : canonicalChord(c));

    // ลองทรานสโพสจากน้อยไปมาก: 0, +1, -1, +2, -2, ...
    const order = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6];

    for (const shift of order) {
        const ok = chordsUsed.every(c => known.has(norm(transposeChord(c, shift))));
        if (ok) return shift;
    }
    return null;
}

export interface FilterResult {
    item: SearchItem;
    score?: number;
    playableShift?: number | null;
}

export function applyFilters(
    rows: FilterResult[],
    f: Filters,
): FilterResult[] {
    const keySet = new Set(f.keys.map(keyIndex));
    const diffSet = new Set(f.difficulty);
    const tagSet = new Set(f.tags);
    const known = new Set(
        f.myChords.map(c => (f.ignoreExtensions ? simplifyChord(c) : canonicalChord(c))),
    );

    let out = rows.filter(({ item }) => {
        if (keySet.size && !keySet.has(keyIndex(item.k))) return false;
        if (diffSet.size && !diffSet.has(item.d)) return false;
        if (tagSet.size && !item.tg.some(t => tagSet.has(t))) return false;
        if (f.maxChords !== null && item.ch.length > f.maxChords) return false;
        if (f.noCapo && item.c > 0) return false;
        return true;
    });

    // กรองด้วยคอร์ดที่เล่นเป็น + แนบข้อมูลว่าต้องทรานสโพสเท่าไหร่
    if (known.size) {
        out = out
            .map(r => ({
                ...r,
                playableShift: findPlayableShift(r.item.ch, known, f.ignoreExtensions),
            }))
            .filter(r => r.playableShift !== null);
    }

    return sortResults(out, f.sort, Boolean(f.q));
}

export function sortResults(
    rows: FilterResult[],
    sort: SortKey,
    hasQuery: boolean,
): FilterResult[] {
    const arr = [...rows];
    switch (sort) {
        case 'popular':
            return arr.sort((a, b) => b.item.v - a.item.v);
        case 'newest':
            return arr.sort((a, b) => b.item.ts - a.item.ts);
        case 'title':
            return arr.sort((a, b) => a.item.t.localeCompare(b.item.t, 'th'));
        case 'easiest':
            return arr.sort((a, b) => a.item.ch.length - b.item.ch.length || b.item.v - a.item.v);
        case 'relevance':
        default:
            if (!hasQuery) return arr.sort((a, b) => b.item.v - a.item.v);
            // Fuse เรียงมาให้แล้ว แต่ถ่วงน้ำหนักด้วยความนิยมเล็กน้อย
            return arr.sort((a, b) => {
                const sa = (a.score ?? 1) - Math.min(a.item.v, 50000) / 5_000_000;
                const sb = (b.score ?? 1) - Math.min(b.item.v, 50000) / 5_000_000;
                return sa - sb;
            });
    }
}