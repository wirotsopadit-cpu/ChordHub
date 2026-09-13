export interface PlaylistSongItem {
  songId: string;
  title: string;
  artist: string;
  slug: string;
  originalKey: string;
  addedAt: number;
}

export interface UserPlaylist {
  id: string;
  title: string;          // เช่น "เพลงลูกทุ่ง", "เพลงรัก"
  description?: string;
  songsCount: number;
  songs: PlaylistSongItem[];
  createdAt: number;
  updatedAt: number;
}
