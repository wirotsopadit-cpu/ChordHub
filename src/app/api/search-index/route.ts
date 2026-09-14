import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getAllSongs } from '@/lib/songs.server';
import { normalizeThai } from '@/lib/normalize';
import type { SearchIndexPayload, SearchItem } from '@/types/search';

export const revalidate = 3600; // ISR 1 ชม.

export async function GET() {
  let items: SearchItem[] = [];

  if (adminDb) {
    try {
      const snap = await adminDb
        .collection('songs')
        .where('status', '==', 'published')
        .limit(200)
        .get();

      if (!snap.empty) {
        items = snap.docs.map(doc => {
          const d = doc.data();
          return {
            i: doc.id,
            s: d.slug ?? doc.id,
            t: d.title ?? '',
            a: d.artist ?? '',
            ai: d.artistId ?? '',
            k: d.originalKey ?? 'C',
            c: d.defaultCapo ?? 0,
            d: d.difficulty ?? 'medium',
            ch: d.chordsUsed ?? [],
            tg: d.tags ?? [],
            v: d.viewCount ?? 0,
            ts: d.createdAt?.toMillis?.() ?? Date.now(),
            img: d.coverImage || (d.youtubeId ? `https://img.youtube.com/vi/${d.youtubeId}/hqdefault.jpg` : undefined),
            yt: d.youtubeId || undefined,
            nt: normalizeThai(d.title ?? ''),
            na: normalizeThai(d.artist ?? ''),
            ...(d.alias ? { al: normalizeThai(d.alias) } : {}),
          };
        });
        items.sort((a, b) => b.v - a.v);
      }
    } catch (err) {
      console.warn('[api/search-index] Failed to fetch from Firebase, using fallback songs:', err);
    }
  }

  // Fallback if Firebase is not configured or returned 0 songs
  if (items.length === 0) {
    const allSongs = await getAllSongs();
    items = allSongs.map(s => ({
      i: s.id,
      s: s.slug,
      t: s.title,
      a: s.artist,
      ai: s.artistId,
      k: s.originalKey,
      c: s.defaultCapo,
      d: s.difficulty,
      ch: s.chordsUsed,
      tg: s.tags,
      v: s.viewCount,
      ts: new Date(s.createdAt).getTime(),
      img: s.coverImage || (s.youtubeId ? `https://img.youtube.com/vi/${s.youtubeId}/hqdefault.jpg` : undefined),
      yt: s.youtubeId,
      nt: normalizeThai(s.title),
      na: normalizeThai(s.artist),
    }));
  }

  const payload: SearchIndexPayload = {
    version: Date.now(),
    count: items.length,
    items,
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}