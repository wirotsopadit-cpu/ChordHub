'use client';
import { useEffect, useState } from 'react';
import type { SearchIndexPayload, SearchItem } from '@/types/search';

const CACHE_KEY = 'chordhub:index:v1';
const MAX_AGE = 1000 * 60 * 60 * 6;      // 6 ชม.

type Status = 'loading' | 'ready' | 'error';

export function useSearchIndex() {
    const [items, setItems] = useState<SearchItem[]>([]);
    const [status, setStatus] = useState<Status>('loading');

    useEffect(() => {
        let alive = true;

        /* 1) แสดงผลจาก cache ก่อน (instant) */
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) {
                const cached = JSON.parse(raw) as SearchIndexPayload;
                if (Date.now() - cached.version < MAX_AGE) {
                    setItems(cached.items);
                    setStatus('ready');
                }
            }
        } catch { /* cache เสีย — ข้ามไป */ }

        /* 2) ดึงของใหม่เบื้องหลัง (stale-while-revalidate) */
        fetch('/api/search-index')
            .then(r => {
                if (!r.ok) throw new Error(String(r.status));
                return r.json() as Promise<SearchIndexPayload>;
            })
            .then(fresh => {
                if (!alive) return;
                setItems(fresh.items);
                setStatus('ready');
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
                } catch { /* quota เต็ม */ }
            })
            .catch(() => {
                if (alive && status !== 'ready') setStatus('error');
            });

        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { items, status };
}