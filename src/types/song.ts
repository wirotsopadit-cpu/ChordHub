export type Difficulty = 'easy' | 'medium' | 'hard';
export type SongStatus = 'published' | 'pending' | 'draft';

export interface Song {
  id: string;
  slug: string;
  title: string;
  artist: string;
  artistId: string;
  album?: string;
  originalKey: string;          // "C", "Am", "Bb"
  defaultCapo: number;          // 0–7
  tempo?: number;               // BPM
  timeSignature?: string;       // "4/4"
  strumming?: string;           // "ลง-ลง-ขึ้น-ขึ้น-ลง-ขึ้น"
  chordpro: string;             // เนื้อหาหลัก
  chordsUsed: string[];
  tags: string[];
  difficulty: Difficulty;
  youtubeId?: string;
  coverImage?: string;
  viewCount: number;
  status: SongStatus;
  createdBy: string;
  createdAt: string;            // ISO string (serialize แล้ว)
  updatedAt: string;
}

export interface SongListItem {
  id: string;
  slug: string;
  title: string;
  artist: string;
  originalKey: string;
  difficulty: Difficulty;
  coverImage?: string;
  youtubeId?: string;
}

export interface SongSettings {
  semitones: number;
  capo: number;
  fontSize: number;
  showChords: boolean;
  scrollSpeed: number;
  columns: 1 | 2;
}