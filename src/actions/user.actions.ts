'use server';

import { adminDb } from '@/lib/firebase.admin';
import type { Song } from '@/types/song';

export interface UserFavoriteItem {
  songId: string;
  savedKey: string;
  savedCapo: number;
  addedAt?: number;
  song?: {
    id: string;
    title: string;
    artist: string;
    slug: string;
    originalKey: string;
    difficulty: string;
  };
}

export interface UserCommentItem {
  id: string;
  songId: string;
  content: string;
  likesCount: number;
  createdAt: number;
  songTitle?: string;
  songSlug?: string;
}

/**
 * ดึงรายการเพลงโปรดของผู้ใช้ พร้อมข้อมูลเพลง
 */
export async function getUserFavorites(userId: string): Promise<UserFavoriteItem[]> {
  if (!userId || !adminDb) return [];

  try {
    const favSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('favorites')
      .get();

    if (favSnap.empty) return [];

    const favorites: UserFavoriteItem[] = [];

    for (const doc of favSnap.docs) {
      const data = doc.data();
      const songId = data.songId || doc.id;

      // ดึงข้อมูลเพลงจาก collection 'songs'
      let songData: any = null;
      try {
        const songDoc = await adminDb.collection('songs').doc(songId).get();
        if (songDoc.exists) {
          const s = songDoc.data()!;
          songData = {
            id: songDoc.id,
            title: s.title || songId,
            artist: s.artist || '',
            slug: s.slug || songId,
            originalKey: s.originalKey || 'C',
            difficulty: s.difficulty || 'medium',
          };
        } else {
          // ลองค้นหาจาก slug
          const querySnap = await adminDb.collection('songs').where('slug', '==', songId).limit(1).get();
          if (!querySnap.empty) {
            const s = querySnap.docs[0].data();
            songData = {
              id: querySnap.docs[0].id,
              title: s.title || songId,
              artist: s.artist || '',
              slug: s.slug || songId,
              originalKey: s.originalKey || 'C',
              difficulty: s.difficulty || 'medium',
            };
          }
        }
      } catch (e) {
        console.error('Error fetching song for favorite:', e);
      }

      favorites.push({
        songId,
        savedKey: data.savedKey || songData?.originalKey || 'C',
        savedCapo: Number(data.savedCapo ?? 0),
        addedAt: typeof data.addedAt === 'number'
          ? data.addedAt
          : data.addedAt?.toMillis ? data.addedAt.toMillis() : Date.now(),
        song: songData,
      });
    }

    // เรียงตามเวลาที่เพิ่มล่าสุด
    favorites.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

    return favorites;
  } catch (err) {
    console.error('[getUserFavorites] error:', err);
    return [];
  }
}

/**
 * ดึงประวัติความคิดเห็นที่ผู้ใช้เคยโพสต์
 */
export async function getUserComments(userId: string): Promise<UserCommentItem[]> {
  if (!userId || !adminDb) return [];

  try {
    const snap = await adminDb
      .collection('comments')
      .where('userId', '==', userId)
      .get();

    if (snap.empty) return [];

    const comments: UserCommentItem[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const songId = data.songId;

      let songTitle = songId;
      let songSlug = songId;

      try {
        const sDoc = await adminDb.collection('songs').doc(songId).get();
        if (sDoc.exists) {
          songTitle = sDoc.data()!.title || songId;
          songSlug = sDoc.data()!.slug || songId;
        }
      } catch {}

      comments.push({
        id: doc.id,
        songId,
        content: data.content || '',
        likesCount: data.likesCount || 0,
        createdAt: typeof data.createdAt === 'number'
          ? data.createdAt
          : data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        songTitle,
        songSlug,
      });
    }

    comments.sort((a, b) => b.createdAt - a.createdAt);
    return comments;
  } catch (err) {
    console.error('[getUserComments] error:', err);
    return [];
  }
}

/**
 * อัปเดตข้อมูลผู้ใช้ (Preferences เช่น เครื่องดนตรี, ความชำนาญ)
 */
export async function updateUserProfile(
  userId: string,
  data: {
    displayName?: string;
    instrument?: string;
    skillLevel?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !adminDb) return { ok: false, error: 'ไม่พบข้อมูลผู้ใช้' };

  try {
    await adminDb.collection('users').doc(userId).set(
      {
        ...data,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'บันทึกข้อมูลไม่สำเร็จ' };
  }
}
