'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ListMusic,
  ChevronRight,
  ChevronLeft,
  Play,
  X,
  Music,
  SkipBack,
  SkipForward,
  ArrowLeft,
} from 'lucide-react';
import { getUserPlaylists } from '@/actions/playlist.actions';
import type { UserPlaylist, PlaylistSongItem } from '@/types/playlist';

interface PlaylistSidebarProps {
  currentSlug: string;
}

export default function PlaylistSidebar({ currentSlug }: PlaylistSidebarProps) {
  const searchParams = useSearchParams();
  const playlistId = searchParams.get('playlist');
  const userId = searchParams.get('uid');

  const [playlist, setPlaylist] = useState<UserPlaylist | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Find current song index
  const currentIndex = playlist
    ? playlist.songs.findIndex(
        s => s.slug === currentSlug || s.songId === currentSlug
      )
    : -1;

  const prevSong = currentIndex > 0 ? playlist?.songs[currentIndex - 1] : null;
  const nextSong =
    playlist && currentIndex < playlist.songs.length - 1
      ? playlist.songs[currentIndex + 1]
      : null;

  // Build link with playlist context
  const buildLink = useCallback(
    (song: PlaylistSongItem) => {
      const base = `/song/${song.slug || song.songId}`;
      if (playlistId && userId) {
        return `${base}?playlist=${playlistId}&uid=${userId}`;
      }
      return base;
    },
    [playlistId, userId]
  );

  useEffect(() => {
    if (!playlistId || !userId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const playlists = await getUserPlaylists(userId);
        const found = playlists.find(p => p.id === playlistId);
        if (found) {
          setPlaylist(found);
        }
      } catch (err) {
        console.error('[PlaylistSidebar] Failed to load playlist:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [playlistId, userId]);

  // Don't render if no playlist context
  if (!playlistId || !userId) return null;
  if (isLoading) return null;
  if (!playlist || playlist.songs.length === 0) return null;

  return (
    <>
      {/* Collapsed Tab Button (when sidebar is closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="no-print fixed right-0 top-1/2 -translate-y-1/2 z-40
                     flex items-center gap-1.5 rounded-l-2xl border border-r-0 border-emerald-500/40
                     bg-zinc-900/95 backdrop-blur-xl px-3 py-3
                     text-emerald-400 hover:bg-zinc-800 hover:border-emerald-500/60
                     transition shadow-lg shadow-black/30
                     animate-in slide-in-from-right"
          title="เปิดเมนูเพลย์ลิสต์"
        >
          <ChevronLeft size={16} />
          <ListMusic size={16} />
          <span className="text-[10px] font-bold writing-mode-vertical hidden sm:block"
            style={{ writingMode: 'vertical-rl' }}
          >
            {playlist.title}
          </span>
        </button>
      )}

      {/* Sidebar Panel */}
      {isOpen && (
        <div
          className="no-print fixed right-0 top-0 z-40 h-dvh w-72 sm:w-80
                     border-l border-zinc-800 bg-zinc-950/98 backdrop-blur-2xl
                     shadow-2xl shadow-black/50
                     flex flex-col
                     animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3.5 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                  <ListMusic size={15} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-zinc-100 truncate">
                    {playlist.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {playlist.songs.length} เพลง
                    {currentIndex >= 0 && (
                      <span className="text-emerald-400 ml-1">
                        • กำลังเล่น {currentIndex + 1}/{playlist.songs.length}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Back to Profile Playlist */}
              <Link
                href="/profile"
                className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                title="กลับไปหน้าเพลย์ลิสต์"
              >
                <ArrowLeft size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                title="ซ่อนเมนูเพลย์ลิสต์"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Prev / Next Navigation */}
          {(prevSong || nextSong) && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/60 shrink-0">
              {prevSong ? (
                <Link
                  href={buildLink(prevSong)}
                  className="flex items-center gap-1.5 flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition truncate"
                  title={`เพลงก่อนหน้า: ${prevSong.title}`}
                >
                  <SkipBack size={12} className="shrink-0" />
                  <span className="truncate">{prevSong.title}</span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              {nextSong ? (
                <Link
                  href={buildLink(nextSong)}
                  className="flex items-center gap-1.5 flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition truncate text-right justify-end"
                  title={`เพลงถัดไป: ${nextSong.title}`}
                >
                  <span className="truncate">{nextSong.title}</span>
                  <SkipForward size={12} className="shrink-0" />
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          )}

          {/* Song List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="py-2">
              {playlist.songs.map((song, idx) => {
                const isCurrent =
                  song.slug === currentSlug || song.songId === currentSlug;

                return (
                  <Link
                    key={`${song.songId}-${idx}`}
                    href={buildLink(song)}
                    className={`group flex items-center gap-3 px-4 py-2.5 transition relative ${
                      isCurrent
                        ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                        : 'hover:bg-zinc-900 border-l-2 border-transparent'
                    }`}
                  >
                    {/* Track Number */}
                    <span
                      className={`font-mono text-[11px] w-5 text-right shrink-0 ${
                        isCurrent ? 'text-emerald-400 font-bold' : 'text-zinc-600'
                      }`}
                    >
                      {isCurrent ? (
                        <Play size={11} className="fill-emerald-400 text-emerald-400 inline" />
                      ) : (
                        `${idx + 1}`
                      )}
                    </span>

                    {/* Song Info */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate transition ${
                          isCurrent
                            ? 'text-emerald-400'
                            : 'text-zinc-200 group-hover:text-emerald-400'
                        }`}
                      >
                        {song.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>

                    {/* Key Badge */}
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                        isCurrent
                          ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/25'
                          : 'text-zinc-500 bg-zinc-800/80'
                      }`}
                    >
                      {song.originalKey || 'C'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-zinc-800 px-4 py-2.5">
            <Link
              href="/profile"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 py-2 text-[11px] font-semibold text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40 transition"
            >
              <ArrowLeft size={12} />
              <span>กลับไปหน้าเพลย์ลิสต์</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
