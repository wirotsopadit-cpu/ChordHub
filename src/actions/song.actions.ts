'use server';

import { adminDb } from '@/lib/firebase.admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { Song, Difficulty } from '@/types/song';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

/**
 * สกัดคอร์ดทั้งหมดที่ใช้จากเนื้อหา ChordPro โดยอัตโนมัติ
 */
function extractChords(chordpro: string): string[] {
  const matches = chordpro.match(/\[([A-G][#b]?[^\]]*)\]/g);
  if (!matches) return [];
  const unique = new Set(matches.map(m => m.slice(1, -1).trim()));
  return Array.from(unique);
}

/**
 * สร้าง slug ภาษาไทยหรืออังกฤษแบบปลอดภัย
 */
function createSlug(title: string, artist: string): string {
  const clean = `${title}-${artist}`
    .toLowerCase()
    .trim()
    .replace(/[^\wก-๙\s-]/g, '')
    .replace(/\s+/g, '-');
  return clean || `song-${Date.now()}`;
}

export interface CreateSongInput {
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  originalKey: string;
  defaultCapo?: number;
  tempo?: number;
  timeSignature?: string;
  strumming?: string;
  chordpro: string;
  tags?: string[];
  difficulty?: Difficulty;
  slug?: string;
  youtubeUrl?: string;
  youtubeId?: string;
  coverImage?: string;
  createdBy?: string;
  createdByName?: string;
}

/**
 * เพิ่มเพลงใหม่ลงใน Firebase Firestore (ผูกสิทธิ์กับผู้สร้าง)
 */
export async function createSong(input: CreateSongInput): Promise<{ ok: boolean; slug?: string; error?: string }> {
  if (!input.title || !input.artist || !input.chordpro) {
    return { ok: false, error: 'กรุณากรอกชื่อเพลง ศิลปิน และเนื้อเพลงคอร์ด' };
  }

  if (!adminDb) {
    return { ok: false, error: 'ไม่พบการเชื่อมต่อ Firebase Admin (ตรวจสอบ service-account.json)' };
  }

  try {
    const slug = input.slug?.trim() || createSlug(input.title, input.artist);
    const chordsUsed = extractChords(input.chordpro);

    const youtubeId = extractYouTubeId(input.youtubeUrl) || extractYouTubeId(input.youtubeId) || undefined;
    const coverImage = input.coverImage?.trim() || (youtubeId ? getYouTubeThumbnail(youtubeId) : undefined);

    const newSongData: Record<string, any> = {
      title: input.title.trim(),
      artist: input.artist.trim(),
      artistId: input.artistId?.trim() || input.artist.toLowerCase().replace(/\s+/g, '-'),
      album: input.album?.trim() || '',
      originalKey: input.originalKey || 'C',
      defaultCapo: Number(input.defaultCapo ?? 0),
      tempo: input.tempo ? Number(input.tempo) : null,
      timeSignature: input.timeSignature || '4/4',
      strumming: input.strumming?.trim() || '',
      chordpro: input.chordpro.trim(),
      chordsUsed,
      tags: input.tags ?? [],
      difficulty: input.difficulty || 'medium',
      youtubeId: youtubeId || null,
      coverImage: coverImage || null,
      status: 'published',
      viewCount: 0,
      createdBy: input.createdBy?.trim() || 'admin',
      createdByName: input.createdByName?.trim() || 'แอดมิน',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      slug,
    };

    const docRef = adminDb.collection('songs').doc(slug);
    await docRef.set(newSongData, { merge: true });

    // ล้าง Cache หน้าแรก หน้าค้นหา และหน้ารายเพลง
    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath(`/song/${slug}`);
    revalidatePath('/api/search-index');

    return { ok: true, slug };
  } catch (err: any) {
    console.error('[createSong] Error adding song:', err);
    return { ok: false, error: err.message || 'เกิดข้อผิดพลาดในการบันทึกเพลง' };
  }
}

/**
 * แก้ไขข้อมูลเพลง (เฉพาะเจ้าของเพลงหรือ admin)
 */
export async function updateSongAction(
  slug: string,
  input: Partial<CreateSongInput>,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!slug || !userId) return { ok: false, error: 'ข้อมูลไม่ครบถ้วน' };
  if (!adminDb) return { ok: false, error: 'ไม่พบการเชื่อมต่อฐานข้อมูล' };

  try {
    const docRef = adminDb.collection('songs').doc(slug);
    const doc = await docRef.get();
    if (!doc.exists) return { ok: false, error: 'ไม่พบเพลงนี้ในระบบ' };

    const data = doc.data()!;
    const isOwner = data.createdBy === userId || data.createdBy === 'admin';
    if (!isOwner) {
      return { ok: false, error: 'คุณไม่มีสิทธิ์แก้ไขเพลงนี้ เนื่องจากไม่ใช่เจ้าของเพลง' };
    }

    const updates: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };

    if (input.title) updates.title = input.title.trim();
    if (input.artist) updates.artist = input.artist.trim();
    if (input.originalKey) updates.originalKey = input.originalKey;
    if (input.defaultCapo !== undefined) updates.defaultCapo = Number(input.defaultCapo);
    if (input.tempo !== undefined) updates.tempo = input.tempo ? Number(input.tempo) : null;
    if (input.timeSignature) updates.timeSignature = input.timeSignature;
    if (input.strumming !== undefined) updates.strumming = input.strumming.trim();
    if (input.difficulty) updates.difficulty = input.difficulty;
    if (input.tags) updates.tags = input.tags;

    if (input.youtubeUrl !== undefined || input.youtubeId !== undefined) {
      const parsedYt = extractYouTubeId(input.youtubeUrl) || extractYouTubeId(input.youtubeId) || null;
      updates.youtubeId = parsedYt;
      if (!input.coverImage && parsedYt) {
        updates.coverImage = getYouTubeThumbnail(parsedYt);
      }
    }

    if (input.coverImage !== undefined) {
      updates.coverImage = input.coverImage.trim() || null;
    }

    if (input.chordpro) {
      updates.chordpro = input.chordpro.trim();
      updates.chordsUsed = extractChords(input.chordpro);
    }

    await docRef.update(updates);

    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath(`/song/${slug}`);
    revalidatePath('/api/search-index');

    return { ok: true };
  } catch (err: any) {
    console.error('[updateSongAction] Error:', err);
    return { ok: false, error: err.message || 'เกิดข้อผิดพลาดในการแก้ไขเพลง' };
  }
}

/**
 * ลบเพลงออกจากระบบ (เฉพาะเจ้าของเพลงหรือ admin)
 */
export async function deleteSongAction(
  slug: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!slug || !userId) return { ok: false, error: 'ข้อมูลไม่ครบถ้วน' };
  if (!adminDb) return { ok: false, error: 'ไม่พบการเชื่อมต่อฐานข้อมูล' };

  try {
    const docRef = adminDb.collection('songs').doc(slug);
    const doc = await docRef.get();
    if (!doc.exists) return { ok: false, error: 'ไม่พบเพลงนี้ในระบบ' };

    const data = doc.data()!;
    const isOwner = data.createdBy === userId || data.createdBy === 'admin';
    if (!isOwner) {
      return { ok: false, error: 'คุณไม่มีสิทธิ์ลบเพลงนี้ เนื่องจากไม่ใช่เจ้าของเพลง' };
    }

    await docRef.delete();

    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath(`/song/${slug}`);
    revalidatePath('/api/search-index');

    return { ok: true };
  } catch (err: any) {
    console.error('[deleteSongAction] Error:', err);
    return { ok: false, error: err.message || 'เกิดข้อผิดพลาดในการลบเพลง' };
  }
}

/**
 * ดึงรายการเพลงทั้งหมดที่ผู้ใช้นี้เป็นผู้เพิ่ม (My Songs)
 */
export async function getUserUploadedSongs(userId: string): Promise<Song[]> {
  if (!userId || !adminDb) return [];
  try {
    const snap = await adminDb
      .collection('songs')
      .where('createdBy', '==', userId)
      .get();

    if (snap.empty) return [];

    const list: Song[] = [];
    snap.forEach(doc => {
      const d = doc.data();
      list.push({
        id: doc.id,
        slug: d.slug || doc.id,
        title: d.title || '',
        artist: d.artist || '',
        artistId: d.artistId || '',
        album: d.album || '',
        originalKey: d.originalKey || 'C',
        defaultCapo: d.defaultCapo ?? 0,
        tempo: d.tempo ?? undefined,
        timeSignature: d.timeSignature || '4/4',
        strumming: d.strumming || '',
        chordpro: d.chordpro || '',
        chordsUsed: d.chordsUsed || [],
        tags: d.tags || [],
        difficulty: d.difficulty || 'medium',
        youtubeId: d.youtubeId || undefined,
        coverImage: d.coverImage || (d.youtubeId ? getYouTubeThumbnail(d.youtubeId) : undefined),
        viewCount: d.viewCount || 0,
        status: d.status || 'published',
        createdBy: d.createdBy || '',
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : new Date().toISOString(),
      });
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.error('[getUserUploadedSongs] Error:', err);
    return [];
  }
}

/**
 * ดึงข้อมูลเพลงสำหรับแก้ไข พร้อมตรวจสอบสิทธิ์
 */
export async function getSongForEditAction(
  slug: string,
  userId: string
): Promise<{ ok: boolean; song?: Song; isOwner?: boolean; error?: string }> {
  if (!slug || !adminDb) return { ok: false, error: 'ไม่พบเพลง' };
  try {
    const doc = await adminDb.collection('songs').doc(slug).get();
    if (!doc.exists) return { ok: false, error: 'ไม่พบเพลงนี้ในระบบ' };
    const d = doc.data()!;
    const isOwner = d.createdBy === userId || d.createdBy === 'admin';

    const song: Song = {
      id: doc.id,
      slug: d.slug || doc.id,
      title: d.title || '',
      artist: d.artist || '',
      artistId: d.artistId || '',
      album: d.album || '',
      originalKey: d.originalKey || 'C',
      defaultCapo: d.defaultCapo ?? 0,
      tempo: d.tempo ?? undefined,
      timeSignature: d.timeSignature || '4/4',
      strumming: d.strumming || '',
      chordpro: d.chordpro || '',
      chordsUsed: d.chordsUsed || [],
      tags: d.tags || [],
      difficulty: d.difficulty || 'medium',
      youtubeId: d.youtubeId || undefined,
      coverImage: d.coverImage || (d.youtubeId ? getYouTubeThumbnail(d.youtubeId) : undefined),
      viewCount: d.viewCount || 0,
      status: d.status || 'published',
      createdBy: d.createdBy || '',
      createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : new Date().toISOString(),
    };

    return { ok: true, song, isOwner };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * เพิ่มยอดวิว
 */
export async function incrementViewCount(songId: string): Promise<void> {
  if (!songId || !adminDb) return;
  try {
    await adminDb.collection('songs').doc(songId).update({
      viewCount: FieldValue.increment(1),
      lastViewedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[incrementViewCount]', err);
  }
}

/** รายงานคอร์ดผิด */
export async function reportSong(
  songId: string,
  reason: string,
  detail: string,
): Promise<{ ok: boolean; message: string }> {
  if (!songId || !reason) return { ok: false, message: 'ข้อมูลไม่ครบ' };
  if (detail.length > 1000) return { ok: false, message: 'รายละเอียดยาวเกินไป' };

  if (!adminDb) {
    return { ok: true, message: 'ขอบคุณสำหรับการแจ้ง เราจะตรวจสอบโดยเร็ว (โหมดออฟไลน์)' };
  }

  try {
    await adminDb.collection('reports').add({
      songId,
      reason,
      detail: detail.slice(0, 1000),
      status: 'open',
      createdAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, message: 'ขอบคุณสำหรับการแจ้ง เราจะตรวจสอบโดยเร็ว' };
  } catch {
    return { ok: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}

/**
 * ค้นหาเพลงจากคลังออนไลน์อัตโนมัติสำหรับแอดมิน
 */
export async function searchSongOnlineAction(query: string) {
  const { searchOnlineSongCatalog } = await import('@/lib/songScraper.server');
  return await searchOnlineSongCatalog(query);
}

/**
 * ดึงเพลงและแปลงคอร์ดจาก URL คอร์ดเพลงภายนอก
 */
export async function fetchSongFromUrlAction(url: string) {
  const { fetchSongFromUrl } = await import('@/lib/songScraper.server');
  return await fetchSongFromUrl(url);
}

/**
 * แปลงคอร์ดและเนื้อร้องแบบธรรมดา (2 บรรทัด) เป็นรูปแบบ ChordPro อัตโนมัติ
 */
export async function convertTabToChordProAction(rawText: string): Promise<string> {
  const { convertPlainTextToChordPro } = await import('@/lib/chordConverter');
  return convertPlainTextToChordPro(rawText);
}

/**
 * ใช้ Gemini API ค้นหาและสร้าง ChordPro จากชื่อเพลง
 */
export async function aiGenerateChordsAction(query: string): Promise<{
  ok: boolean;
  title?: string;
  artist?: string;
  key?: string;
  content?: string;
  error?: string;
}> {
  if (!query?.trim()) return { ok: false, error: 'กรุณาระบุชื่อเพลง' };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: 'ไม่พบ GEMINI_API_KEY ใน environment variables' };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemPrompt = `You are an expert music arranger and chord sheet specialist.
When the user asks for a song, search the web to look up the authentic chord progression and verified lyrics.
Format the chord sheet in standard ChordPro style where chords appear in square brackets directly before the syllables, like [C] or [Am7].
Structure the song with clear section markers:
- Use {c: Intro} for intro sections
- Use {sov: Verse 1} and {eov} for verse sections
- Use {soc: Chorus} and {eoc} for chorus sections
- Use {sob: Bridge} and {eob} for bridge sections
Output MUST be a clean JSON object without extra conversational preamble matching this schema:
{
  "title": "Exact Song Title",
  "artist": "Artist Name",
  "key": "Original Key (e.g. C, G, D, Am)",
  "content": "Chord sheet in ChordPro format with chords in square brackets [Chord]"
}`;

  try {
    const payload = {
      contents: [{
        parts: [{ text: `Search and retrieve the real chord progression and structure for: "${query}". Keep lyrics accurate and properly place chords in square brackets [G].` }]
      }],
      tools: [{ "google_search": {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[aiGenerateChords] API error:', errText);
      return { ok: false, error: `Gemini API Error: ${response.status}` };
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { ok: false, error: 'ไม่ได้รับผลลัพธ์จาก AI' };
    }

    const cleanJson = rawText.replace(/```json\s*|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      ok: true,
      title: parsed.title || query,
      artist: parsed.artist || 'ไม่ระบุ',
      key: parsed.key || 'C',
      content: parsed.content || '',
    };
  } catch (err: any) {
    console.error('[aiGenerateChords] Error:', err);
    return { ok: false, error: err.message || 'ไม่สามารถสร้างคอร์ดได้ กรุณาลองใหม่' };
  }
}

/**
 * ใช้ Gemini API จับคู่คอร์ดลงบนเนื้อเพลงที่ให้มา
 */
export async function aiHarmonizeLyricsAction(
  lyrics: string,
  songHint: string
): Promise<{ ok: boolean; content?: string; error?: string }> {
  if (!lyrics?.trim()) return { ok: false, error: 'กรุณาระบุเนื้อเพลง' };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: 'ไม่พบ GEMINI_API_KEY ใน environment variables' };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const payload = {
      contents: [{
        parts: [{
          text: `Insert the correct guitar chords in square brackets like [C] or [Am] into these exact lyrics for "${songHint}". Do NOT change, replace, or delete any of the original lyrics words. Use ChordPro format with section markers like {sov: Verse 1}/{eov}, {soc: Chorus}/{eoc}. Return only the annotated ChordPro text without any markdown code blocks:\n\n${lyrics}`
        }]
      }],
      tools: [{ "google_search": {} }],
      systemInstruction: {
        parts: [{ text: "You are a professional musician. Place guitar chords into the provided lyrics without altering the wording or spelling. Return only the annotated ChordPro text without any code block markers." }]
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { ok: false, error: `Gemini API Error: ${response.status}` };
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { ok: false, error: 'ไม่ได้รับผลลัพธ์จาก AI' };
    }

    const cleaned = rawText.replace(/```[a-z]*\n?|```/g, '').trim();
    return { ok: true, content: cleaned };
  } catch (err: any) {
    console.error('[aiHarmonizeLyrics] Error:', err);
    return { ok: false, error: err.message || 'ไม่สามารถจับคู่คอร์ดได้ กรุณาลองใหม่' };
  }
}