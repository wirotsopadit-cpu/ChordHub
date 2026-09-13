'use client';

import Link from 'next/link';
import { Eye, Music2, Gauge, Guitar } from 'lucide-react';
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
  song, semitones, capo,
}: { song: Song; semitones: number; capo: number }) {
  const currentKey = transposeKey(song.originalKey, semitones);
  const shift = semitones - capo;
  const shownChords = song.chordsUsed.map(c => transposeChord(c, shift, currentKey));

  return (
    <header className="border-b border-zinc-800 pb-5 pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            {song.title}
          </h1>
          <Link
            href={`/artist/${song.artistId}`}
            className="mt-1 inline-block text-sm text-zinc-400 hover:text-emerald-400"
          >
            {song.artist}
          </Link>
        </div>

        <div className="flex items-center gap-2">
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