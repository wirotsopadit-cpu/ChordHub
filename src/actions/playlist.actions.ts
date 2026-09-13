'use server';

import { adminDb } from '@/lib/firebase.admin';
import type { UserPlaylist, PlaylistSongItem } from '@/types/playlist';

/**
 * ดึงเพลย์ลิสต์ทั้งหมดของผู้ใช้
 */
export async function getUserPlaylists(userId: string): Promise<UserPlaylist[]> {
  if (!userId || !adminDb) return [];

  try {
    const snap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('playlists')
      .get();

    if (snap.empty) return [];

    const playlists: UserPlaylist[] = [];

    snap.forEach(doc => {
      const data = doc.data();
      playlists.push({
        id: doc.id,
        title: data.title || 'เพลย์ลิสต์ไม่มีชื่อ',
        description: data.description || '',
        songsCount: Array.isArray(data.songs) ? data.songs.length : (data.songsCount || 0),
        songs: Array.isArray(data.songs) ? data.songs : [],
        createdAt: typeof data.createdAt === 'number'
          ? data.createdAt
          : data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        updatedAt: typeof data.updatedAt === 'number'
          ? data.updatedAt
          : data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
      });
    });

    // เรียงตามเวลาอัปเดตล่าสุด
    playlists.sort((a, b) => b.updatedAt - a.updatedAt);
    return playlists;
  } catch (err) {
    console.error('[getUserPlaylists] error:', err);
    return [];
  }
}

/**
 * สร้างเพลย์ลิสต์ใหม่
 */
export async function createPlaylistAction(
  userId: string,
  title: string,
  description?: string
): Promise<{ ok: boolean; playlist?: UserPlaylist; error?: string }> {
  if (!userId) return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนสร้างเพลย์ลิสต์' };
  if (!title?.trim()) return { ok: false, error: 'กรุณาระบุชื่อเพลย์ลิสต์' };
  if (!adminDb) return { ok: false, error: 'ไม่พบการเชื่อมต่อฐานข้อมูล' };

  try {
    const docRef = adminDb.collection('users').doc(userId).collection('playlists').doc();
    const now = Date.now();

    const newPlaylistData = {
      title: title.trim(),
      description: description?.trim() || '',
      songsCount: 0,
      songs: [],
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newPlaylistData);

    return {
      ok: true,
      playlist: {
        id: docRef.id,
        ...newPlaylistData,
      },
    };
  } catch (err: any) {
    console.error('[createPlaylistAction] error:', err);
    return { ok: false, error: err.message || 'สร้างเพลย์ลิสต์ไม่สำเร็จ' };
  }
}

/**
 * เพิ่มเพลงเข้าเพลย์ลิสต์
 */
export async function addSongToPlaylistAction(
  userId: string,
  playlistId: string,
  song: PlaylistSongItem
): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !playlistId || !song?.songId || !adminDb) {
    return { ok: false, error: 'ข้อมูลไม่ครบถ้วน' };
  }

  try {
    const playlistRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('playlists')
      .doc(playlistId);

    const doc = await playlistRef.get();
    if (!doc.exists) {
      return { ok: false, error: 'ไม่พบเพลย์ลิสต์นี้' };
    }

    const data = doc.data()!;
    const songs: PlaylistSongItem[] = Array.isArray(data.songs) ? data.songs : [];

    // ตรวจสอบว่ามีเพลงนี้อยู่ในเพลย์ลิสต์แล้วหรือยัง
    const exists = songs.some(s => s.songId === song.songId || s.slug === song.slug);
    if (exists) {
      return { ok: false, error: 'เพลงนี้อยู่ในเพลย์ลิสต์แล้ว' };
    }

    const updatedSongs = [
      {
        songId: song.songId,
        title: song.title,
        artist: song.artist,
        slug: song.slug,
        originalKey: song.originalKey,
        addedAt: Date.now(),
      },
      ...songs,
    ];

    await playlistRef.update({
      songs: updatedSongs,
      songsCount: updatedSongs.length,
      updatedAt: Date.now(),
    });

    return { ok: true };
  } catch (err: any) {
    console.error('[addSongToPlaylistAction] error:', err);
    return { ok: false, error: err.message || 'ไม่สามารถเพิ่มเพลงเข้าเพลย์ลิสต์ได้' };
  }
}

/**
 * ลบเพลงออกจากเพลย์ลิสต์
 */
export async function removeSongFromPlaylistAction(
  userId: string,
  playlistId: string,
  songId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !playlistId || !songId || !adminDb) {
    return { ok: false, error: 'ข้อมูลไม่ครบถ้วน' };
  }

  try {
    const playlistRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('playlists')
      .doc(playlistId);

    const doc = await playlistRef.get();
    if (!doc.exists) return { ok: false, error: 'ไม่พบเพลย์ลิสต์' };

    const data = doc.data()!;
    const songs: PlaylistSongItem[] = Array.isArray(data.songs) ? data.songs : [];

    const updatedSongs = songs.filter(s => s.songId !== songId && s.slug !== songId);

    await playlistRef.update({
      songs: updatedSongs,
      songsCount: updatedSongs.length,
      updatedAt: Date.now(),
    });

    return { ok: true };
  } catch (err: any) {
    console.error('[removeSongFromPlaylistAction] error:', err);
    return { ok: false, error: err.message || 'ลบเพลงไม่สำเร็จ' };
  }
}

/**
 * ลบเพลย์ลิสต์ทั้งชุด
 */
export async function deletePlaylistAction(
  userId: string,
  playlistId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !playlistId || !adminDb) {
    return { ok: false, error: 'ข้อมูลไม่ครบถ้วน' };
  }

  try {
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('playlists')
      .doc(playlistId)
      .delete();

    return { ok: true };
  } catch (err: any) {
    console.error('[deletePlaylistAction] error:', err);
    return { ok: false, error: err.message || 'ลบเพลย์ลิสต์ไม่สำเร็จ' };
  }
}
