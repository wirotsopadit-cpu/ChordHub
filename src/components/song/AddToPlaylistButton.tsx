'use client';

import { useState, useEffect } from 'react';
import {
  ListPlus,
  Plus,
  Check,
  Loader2,
  X,
  Music,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import type { UserPlaylist } from '@/types/playlist';
import {
  getUserPlaylists,
  createPlaylistAction,
  addSongToPlaylistAction,
} from '@/actions/playlist.actions';

interface AddToPlaylistButtonProps {
  songId: string;
  title: string;
  artist: string;
  slug: string;
  originalKey: string;
}

export default function AddToPlaylistButton({
  songId,
  title,
  artist,
  slug,
  originalKey,
}: AddToPlaylistButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Quick Create New Playlist
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      if (u) {
        setUserId(u.uid);
      } else {
        const saved = localStorage.getItem('chordhub_gmail_user');
        if (saved) {
          try {
            setUserId(JSON.parse(saved).uid);
          } catch {
            setUserId(null);
          }
        } else {
          setUserId(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpen = async () => {
    if (!userId) {
      window.location.href = `/login?next=/song/${slug}`;
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    try {
      const data = await getUserPlaylists(userId);
      setPlaylists(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!userId) return;
    setAddingToId(playlistId);
    try {
      const res = await addSongToPlaylistAction(userId, playlistId, {
        songId,
        title,
        artist,
        slug,
        originalKey,
        addedAt: Date.now(),
      });

      if (res.ok) {
        setSuccessId(playlistId);
        setPlaylists(prev =>
          prev.map(p => {
            if (p.id === playlistId) {
              return {
                ...p,
                songsCount: p.songsCount + 1,
                songs: [
                  { songId, title, artist, slug, originalKey, addedAt: Date.now() },
                  ...p.songs,
                ],
              };
            }
            return p;
          })
        );
        setTimeout(() => setSuccessId(null), 2000);
      } else {
        alert(res.error || 'ไม่สามารถเพิ่มเพลงได้');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingToId(null);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newTitle.trim()) return;

    setIsSubmittingNew(true);
    try {
      const res = await createPlaylistAction(userId, newTitle.trim());
      if (res.ok && res.playlist) {
        // Auto add this song to the newly created playlist
        await addSongToPlaylistAction(userId, res.playlist.id, {
          songId,
          title,
          artist,
          slug,
          originalKey,
          addedAt: Date.now(),
        });

        res.playlist.songsCount = 1;
        res.playlist.songs = [
          { songId, title, artist, slug, originalKey, addedAt: Date.now() },
        ];

        setPlaylists(prev => [res.playlist!, ...prev]);
        setNewTitle('');
        setIsCreating(false);
        setSuccessId(res.playlist.id);
        setTimeout(() => setSuccessId(null), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="เพิ่มเข้าเพลย์ลิสต์"
        aria-label="เพิ่มเข้าเพลย์ลิสต์"
        className="no-print grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 transition active:scale-90"
      >
        <ListPlus size={19} />
      </button>

      {/* Playlist Selector Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                <FolderPlus size={18} className="text-emerald-400" />
                <span>เพิ่มเพลงเข้าเพลย์ลิสต์</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              เลือกเพลย์ลิสต์ที่ต้องการจัดเก็บเพลง <strong className="text-zinc-200">{title}</strong>
            </p>

            {/* Playlists List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-zinc-500 gap-2">
                  <Loader2 size={16} className="animate-spin text-emerald-400" />
                  <span className="text-xs">กำลังโหลดเพลย์ลิสต์...</span>
                </div>
              ) : playlists.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 text-center">
                  <p className="text-xs text-zinc-400 mb-2">คุณยังไม่มีเพลย์ลิสต์</p>
                  <p className="text-[11px] text-zinc-500">
                    สร้างเพลย์ลิสต์ใหม่ เช่น &quot;เพลงลูกทุ่ง&quot;, &quot;เพลงรัก&quot; ได้ด้านล่าง
                  </p>
                </div>
              ) : (
                playlists.map(p => {
                  const isAdded = p.songs?.some(s => s.songId === songId || s.slug === slug);
                  const isAddingThis = addingToId === p.id;
                  const isSuccess = successId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 hover:border-zinc-700 transition"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="text-xs font-bold text-zinc-100 truncate">{p.title}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {p.songsCount || p.songs?.length || 0} เพลง
                        </div>
                      </div>

                      {isAdded || isSuccess ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <Check size={12} /> เพิ่มแล้ว
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isAddingThis}
                          onClick={() => handleAddToPlaylist(p.id)}
                          className="flex items-center gap-1 text-[11px] font-bold bg-emerald-500 text-zinc-950 px-3 py-1 rounded-lg hover:bg-emerald-400 transition active:scale-95 disabled:opacity-50"
                        >
                          {isAddingThis ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Plus size={12} />
                          )}
                          <span>เพิ่ม</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Create Form */}
            {isCreating ? (
              <form onSubmit={handleCreateNew} className="border-t border-zinc-800 pt-3">
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                  ชื่อเพลย์ลิสต์ใหม่ (เช่น เพลงลูกทุ่ง, เพลงรัก)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="เช่น เพลงลูกทุ่ง..."
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNew || !newTitle.trim()}
                    className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition disabled:opacity-50"
                  >
                    {isSubmittingNew ? <Loader2 size={12} className="animate-spin" /> : 'สร้าง'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="rounded-xl border border-zinc-800 px-2.5 text-xs text-zinc-400 hover:text-white"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 py-2.5 text-xs font-semibold text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition"
              >
                <Plus size={14} />
                <span>+ สร้างเพลย์ลิสต์ใหม่</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
