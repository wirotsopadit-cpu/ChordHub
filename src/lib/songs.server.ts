import 'server-only';
import { cache } from 'react';
import { adminDb } from './firebase.admin';
import type { Song, SongListItem } from '@/types/song';
import { Timestamp } from 'firebase-admin/firestore';

const toISO = (v: any): string => {
  if (!v) return new Date().toISOString();
  if (typeof v?.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return new Date().toISOString();
};

// ── ข้อมูลเพลงตัวอย่าง (Mock Data) สำหรับรันและทดสอบได้ทันที ──
export const MOCK_SONGS: Song[] = [
  {
    id: 'jai-nak-leng',
    slug: 'jai-nak-leng',
    title: 'ใจนักเลง',
    artist: 'อ๊อฟ พงษ์พัฒน์',
    artistId: 'pongpat',
    album: 'พงษ์พัฒน์ ภาค 2',
    originalKey: 'G',
    defaultCapo: 0,
    tempo: 78,
    timeSignature: '4/4',
    strumming: 'ลง - ลง - ขึ้น - ขึ้น - ลง - ขึ้น',
    chordsUsed: ['G', 'Em', 'C', 'D', 'Bm', 'Am'],
    tags: ['เพลงเพื่อชีวิต', 'เพลงยุค 90', 'อกหัก', 'ร็อค'],
    difficulty: 'easy',
    viewCount: 14520,
    status: 'published',
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    chordpro: `{c: Intro}
[G] [Em] [C] [D] (2 times)

{sov: Verse 1}
[G]เมื่อเธอเลือกอยู่กับเขา [Em]ตัวฉันคุกเข่าสั่นไหว
[C]ใจนักเลงถึงคราวปราชัย [D]ยอมให้เธอไปดี
[G]เมื่อเขานั้นดีกว่าฉัน [Em]จะรั้งเธอนั้นทำไม
[C]ปล่อยเธอไปตามทางหัวใจ [D]ไม่ขอขัดขวาง
{eov}

{soc: Chorus}
[C]ให้เธอได้ไปดี [D]กับคนที่เธอหวัง
[Bm]ส่วนฉันคนนี้ยังคง [Em]มีความหวังดีให้เธอ
[Am]เจ็บปวดเพียงใดใจนักเลง [D]ไม่เคยคิดแค้นเธอ
[C]ขอเพียงเธอ [D]ได้พบเจอ [G]สิ่งที่ดี
{eoc}

{sov: Verse 2}
[G]จะจำเรื่องราวดีๆ [Em]ที่มีให้กันเรื่อยไป
[C]ถึงแม้ตัวฉันต้องเสียใจ [D]แต่ใจยังยอมรับฟัง
[G]ความรักไม่ใช่การแย่งชิง [Em]หากรักจริงต้องปล่อยวาง
[C]ขอให้ความรักนำทาง [D]สู่ฝันที่เธอรอ
{eov}

{c: Outro}
[C] [D] [G]`
  },
  {
    id: 'ru-doo-ron',
    slug: 'ru-doo-ron',
    title: 'ฤดูร้อน',
    artist: 'Paradox',
    artistId: 'paradox',
    album: 'Summer',
    originalKey: 'A',
    defaultCapo: 0,
    tempo: 125,
    timeSignature: '4/4',
    strumming: 'ลง - ลง - ขึ้น - ลง - ขึ้น',
    chordsUsed: ['A', 'C#m', 'D', 'E', 'F#m', 'Bm'],
    tags: ['ร็อค', 'อินดี้', 'เพลงหน้าร้อน', 'เพลงฮิต'],
    difficulty: 'medium',
    viewCount: 28940,
    status: 'published',
    createdBy: 'system',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    chordpro: `{c: Intro}
[A] [C#m] [D] [E] (2 times)

{sov: Verse 1}
[A] บาดแผลคราวนี้ช่างลึกเกินทน [C#m]
จะทนรับมันได้นานสักเท่าไร [D]
เมื่อความรักพังทลาย [E] จากไป
{eov}

{soc: Chorus}
[A]ยืนมองท้องฟ้าไม่เป็นเช่นเคย [C#m]
ฤดูร้อนไม่มีเธอเหมือนก่อน [D]
วันที่เคยรักกัน [E] กลับกลายเป็นความช้ำ
[F#m]ปล่อยให้น้ำตา [C#m] ไหลรินร่วงโรย
[D] ลืมเรื่องราวในอดีต [E] ที่เคยมี
{eoc}

{sov: Verse 2}
[A] สายลมพัดผ่านพาความหลังกลับมา [C#m]
แววตาคู่นั้นยังคงชัดเจน [D]
และยังคิดถึงเธอเสมอ [E] ไม่เคยลืม
{eov}`
  },
  {
    id: 'wat-jai',
    slug: 'wat-jai',
    title: 'วัดใจ',
    artist: 'Silly Fools',
    artistId: 'silly-fools',
    album: 'Juicy',
    originalKey: 'Em',
    defaultCapo: 0,
    tempo: 138,
    timeSignature: '4/4',
    strumming: 'ลง - ลง - ลง - ขึ้น - ลง - ขึ้น',
    chordsUsed: ['Em', 'C', 'D', 'G', 'Bm', 'Am'],
    tags: ['ร็อค', 'ปลุกพลัง', 'เพลงฮิตยุค 2000'],
    difficulty: 'medium',
    viewCount: 39500,
    status: 'published',
    createdBy: 'system',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
    chordpro: `{c: Intro}
[Em] [C] [D] [G] [Bm]

{sov: Verse 1}
[Em] มีจริงไหมใครสักคน [C] ที่เข้าใจ
[D] พร้อมจะยืนเคียงข้างกัน [G] ไม่เปลี่ยนไป
[Em] ทางข้างหน้าจะมืดมน [C] สักเท่าใด
[D] ไม่เคยหวั่นไหว [Em] ก้าวไปด้วยกัน
{eov}

{soc: Chorus}
[C] มีเพียงใจเท่านั้น [D] ที่พร้อมจะวัดดู
[Bm] สู้จนหยดสุดท้าย [Em] ไม่ยอมแพ้ใคร
[Am] หากว่าใจดวงนี้ [D] ยังคงเต้นอยู่
[C] จะพิสูจน์ให้รู้ [D] ว่าใครคือตัวจริง [Em]
{eoc}`
  },
  {
    id: 'dept-17',
    slug: '17',
    title: '17',
    artist: 'Dept',
    artistId: 'dept',
    album: 'Single',
    originalKey: 'C',
    defaultCapo: 0,
    tempo: 110,
    timeSignature: '4/4',
    strumming: 'ลง - ลง - ขึ้น - ขึ้น - ลง',
    chordsUsed: ['C', 'Em', 'F', 'G', 'Dm', 'Am'],
    tags: ['อินดี้ป็อป', 'วัยรุ่น', 'รักสดใส'],
    difficulty: 'easy',
    viewCount: 18200,
    status: 'published',
    createdBy: 'system',
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
    chordpro: `{c: Intro}
[C] [Em] [F] [G]

{sov: Verse 1}
[C] ย้อนเวลากลับไปตอนอายุ 17 [Em]
ตอนที่ความรักยังเป็นแค่เรื่องง่ายๆ [F]
ไม่ต้องคิดอะไรให้มากมาย [G]
แค่อยากเจอเธอทุกวัน
{eov}

{soc: Chorus}
[F]ถ้าหากวันนั้นฉันบอกรัก [G]
[Em]เธอจะยังอยู่ข้างฉันไหม [Am]
[Dm]คำถามที่ค้างคาในใจ [G]
[C]ตั้งแต่ตอนอายุสิบเจ็ด [C7]
{eoc}`
  }
];

function mapSong(id: string, d: Record<string, any>): Song {
  return {
    id,
    slug: d.slug ?? id,
    title: d.title ?? '',
    artist: d.artist ?? 'ไม่ทราบชื่อศิลปิน',
    artistId: d.artistId ?? '',
    album: d.album ?? undefined,
    originalKey: d.originalKey ?? 'C',
    defaultCapo: d.defaultCapo ?? 0,
    tempo: d.tempo ?? undefined,
    timeSignature: d.timeSignature ?? '4/4',
    strumming: d.strumming ?? undefined,
    chordpro: d.chordpro ?? '',
    chordsUsed: d.chordsUsed ?? [],
    tags: d.tags ?? [],
    difficulty: d.difficulty ?? 'medium',
    youtubeId: d.youtubeId ?? undefined,
    viewCount: d.viewCount ?? 0,
    status: d.status ?? 'draft',
    createdBy: d.createdBy ?? '',
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  };
}

/**
 * ดึงรายการเพลงทั้งหมด (ใช้ในหน้าแรก หรือ ค้นหา)
 */
export const getAllSongs = cache(async (): Promise<Song[]> => {
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection('songs')
        .where('status', '==', 'published')
        .limit(100)
        .get();

      if (!snap.empty) {
        const songs = snap.docs.map(doc => mapSong(doc.id, doc.data()));
        return songs.sort((a, b) => b.viewCount - a.viewCount);
      }
    } catch (err) {
      console.warn('[getAllSongs] Firebase query failed, using mock data:', err);
    }
  }

  return MOCK_SONGS;
});

/**
 * ดึงเพลงด้วย slug — ห่อด้วย React cache() เพื่อไม่ให้ query ซ้ำ
 */
export const getSongBySlug = cache(async (slug: string): Promise<Song | null> => {
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection('songs')
        .where('slug', '==', slug)
        .where('status', '==', 'published')
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        return mapSong(doc.id, doc.data());
      }
    } catch (err) {
      console.warn('[getSongBySlug] Firebase query failed, using mock data:', err);
    }
  }

  const found = MOCK_SONGS.find(s => s.slug === slug || s.id === slug);
  return found ?? null;
});

/** เพลงอื่นของศิลปินเดียวกัน (แสดงท้ายหน้า) */
export const getRelatedSongs = cache(
  async (artistId: string, excludeId: string, max = 6): Promise<SongListItem[]> => {
    if (!artistId) return [];

    if (adminDb) {
      try {
        const snap = await adminDb
          .collection('songs')
          .where('artistId', '==', artistId)
          .limit(max + 5)
          .get();

        if (!snap.empty) {
          return snap.docs
            .filter(d => d.id !== excludeId && d.data()?.status === 'published')
            .slice(0, max)
            .map(d => {
              const x = d.data();
              return {
                id: d.id,
                slug: x.slug ?? d.id,
                title: x.title,
                artist: x.artist,
                originalKey: x.originalKey ?? 'C',
                difficulty: x.difficulty ?? 'medium',
              };
            });
        }
      } catch (err) {
        console.warn('[getRelatedSongs] Firebase query failed, fallback to mock:', err);
      }
    }

    return MOCK_SONGS
      .filter(s => s.id !== excludeId && (s.artistId === artistId || artistId === 'all'))
      .slice(0, max)
      .map(s => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        artist: s.artist,
        originalKey: s.originalKey,
        difficulty: s.difficulty,
      }));
  },
);

/** สำหรับ generateStaticParams — pre-render เพลงยอดนิยม */
export async function getPopularSlugs(limit = 200): Promise<string[]> {
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection('songs')
        .where('status', '==', 'published')
        .limit(limit)
        .get();

      if (!snap.empty) {
        return snap.docs.map(d => d.data().slug ?? d.id);
      }
    } catch (err) {
      console.warn('[getPopularSlugs] Firebase query failed, using mock slugs:', err);
    }
  }

  return MOCK_SONGS.slice(0, limit).map(s => s.slug);
}