'use client';

import Link from 'next/link';
import { Eye, Music2, Gauge, Guitar, Play } from 'lucide-react';
import YoutubeIcon from '@/components/icons/YoutubeIcon';
import type { Song } from '@/types/song';
import { transposeKey, transposeChord } from '@/lib/chords';
import FavoriteButton from './FavoriteButton';
import AddToPlaylistButton from './AddToPlaylistButton';
import SongOwnerActions from './SongOwnerActions';

const DIFF_LABEL = { easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' } as const;
const DIFF_STYLE = {
  easy: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  medium: 'bg-amber-500/15  text-amber-400   ring-amber-500/30',
  hard: 'bg-rose-500/15   text-rose-400    ring-rose-500/30',
} as const;

export default function SongHeader({
  song,
  semitones,
  capo,
  isPlayerOpen,
  onTogglePlayer,
}: {
  song: Song;
  semitones: number;
  capo: number;
  isPlayerOpen?: boolean;
  onTogglePlayer?: () => void;
}) {
  const currentKey = transposeKey(song.originalKey, semitones);
  const shift = semitones - capo;
  const shownChords = song.chordsUsed.map(c => transposeChord(c, shift, currentKey));

  return (
    <header className="border-b border-zinc-800 pb-5 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          {song.coverImage && (
            <div className="relative group shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md">
              <img
                src={song.coverImage}
                alt={song.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {song.youtubeId && onTogglePlayer && (
                <button
                  onClick={onTogglePlayer}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  title="ดู MV / ฟังเพลง"
                >
                  <Play size={22} className="fill-white text-white drop-shadow" />
                </button>
              )}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl text-zinc-100">
              {song.title}
            </h1>
            <Link
              href={`/artist/${song.artistId}`}
              className="mt-1 inline-block text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              {song.artist}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {song.youtubeId && onTogglePlayer && (
            <button
              onClick={onTogglePlayer}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition shadow-sm ${
                isPlayerOpen
                  ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40 hover:bg-red-500/30'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-red-600 hover:text-white ring-1 ring-zinc-700'
              }`}
            >
              <YoutubeIcon size={14} className={isPlayerOpen ? 'text-red-400' : 'text-red-500'} />
              <span>{isPlayerOpen ? 'ซ่อน MV' : 'ดู MV / ฟังเพลง'}</span>
            </button>
          )}

          <SongOwnerActions song={song} />
          <AddToPlaylistButton
            songId={song.id}
            title={song.title}
            artist={song.artist}
            slug={song.slug}
            originalKey={currentKey}
          />
          <FavoriteButton
            songId={song.id}
            savedKey={currentKey}
            savedCapo={capo}
          />
        </div>
      </div>

      {/* Meta chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <Chip icon={<Music2 size={13} />}>
          คีย์ <b className="font-mono text-emerald-400">{currentKey}</b>
          {semitones !== 0 && (
            <span className="text-zinc-500"> (เดิม {song.originalKey})</span>
          )}
        </Chip>

        {capo > 0 && (
          <Chip icon={<Guitar size={13} />}>
            คาโป <b className="font-mono text-emerald-400">ช่อง {capo}</b>
          </Chip>
        )}

        {song.tempo && (
          <Chip icon={<Gauge size={13} />}>{song.tempo} BPM</Chip>
        )}

        <span className={`rounded-full px-2.5 py-1 font-medium ring-1 ${DIFF_STYLE[song.difficulty]}`}>
          {DIFF_LABEL[song.difficulty]}
        </span>

        <Chip icon={<Eye size={13} />}>
          {song.viewCount.toLocaleString('th-TH')}
        </Chip>
      </div>

      {/* คอร์ดที่ใช้ */}
      {shownChords.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-zinc-500">คอร์ดที่ใช้:</span>
          {shownChords.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="rounded-md border border-zinc-700 bg-zinc-800/70 px-2 py-1
                         font-mono text-xs font-bold text-emerald-400"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {song.strumming && (
        <p className="mt-3 text-xs text-zinc-400">
          <span className="text-zinc-500">จังหวะตี:</span>{' '}
          <span className="font-mono">{song.strumming}</span>
        </p>
      )}
    </header>
  );
}

function Chip({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/70
                     px-2.5 py-1 text-zinc-300">
      {icon}{children}
    </span>
  );
}