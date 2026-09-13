'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Song } from '@/types/song';
import { useSongSettings } from '@/hooks/useSongSettings';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useWakeLock } from '@/hooks/useWakeLock';
import { incrementViewCount } from '@/actions/song.actions';

import SongHeader from './SongHeader';
import ControlBar from './ControlBar';
import MobileDock from './MobileDock';
import ChordSheet from './ChordSheet';
import PlaylistSidebar from './PlaylistSidebar';

export default function SongView({ song }: { song: Song }) {
  const {
    semitones, capo, fontSize, showChords, scrollSpeed, isScrolling,
    setSemitones, setCapo, setFontSize, toggleChords,
    setScrollSpeed, setScrolling, reset, hydrateFromSong,
  } = useSongSettings();

  const searchParams = useSearchParams();
  const viewedRef = useRef(false);

  /* ตั้งค่าเริ่มต้นจากข้อมูลเพลง (capo เริ่มต้น) และ query param ?t= (transpose shift จากหน้าค้นหา) */
  useEffect(() => {
    hydrateFromSong(song.id, song.defaultCapo);

    const t = Number(searchParams.get('t'));
    if (Number.isInteger(t) && t !== 0 && Math.abs(t) <= 11) {
      setSemitones(t);
    }
  }, [song.id, song.defaultCapo, searchParams, hydrateFromSong, setSemitones]);

  /* นับวิว 1 ครั้ง หลังผู้ใช้อยู่บนหน้า 5 วินาที (กัน bot / bounce) */
  useEffect(() => {
    const t = setTimeout(() => {
      if (viewedRef.current) return;
      viewedRef.current = true;
      incrementViewCount(song.id);
    }, 5000);
    return () => clearTimeout(t);
  }, [song.id]);

  /* auto-scroll + กันจอดับ */
  useAutoScroll(scrollSpeed, isScrolling);
  useWakeLock(isScrolling);

  /* คีย์ลัดบน Desktop */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); setSemitones(semitones + 1); break;
        case 'ArrowDown': e.preventDefault(); setSemitones(semitones - 1); break;
        case ' ': e.preventDefault(); setScrolling(!isScrolling); break;
        case '0': reset(song.defaultCapo); break;
        case '+': case '=': setFontSize(fontSize + 1); break;
        case '-': setFontSize(fontSize - 1); break;
        case 'c': toggleChords(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [semitones, isScrolling, fontSize, song.defaultCapo,
    setSemitones, setScrolling, setFontSize, toggleChords, reset]);

  const hasPlaylistContext = !!searchParams.get('playlist');

  return (
    <>
      {/* Playlist Sidebar (only shows when ?playlist= is in URL) */}
      <PlaylistSidebar currentSlug={song.slug} />

      <div className={`mx-auto max-w-4xl px-4 transition-all duration-300 ${hasPlaylistContext ? 'mr-72 sm:mr-80' : ''}`}>
        <SongHeader song={song} semitones={semitones} capo={capo} />

        {/* Desktop / Tablet */}
        <div className="hidden md:block">
          <ControlBar
            song={song}
            semitones={semitones} setSemitones={setSemitones}
            capo={capo} setCapo={setCapo}
            fontSize={fontSize} setFontSize={setFontSize}
            showChords={showChords} toggleChords={toggleChords}
            scrollSpeed={scrollSpeed} setScrollSpeed={setScrollSpeed}
            isScrolling={isScrolling} setScrolling={setScrolling}
            onReset={() => reset(song.defaultCapo)}
          />
        </div>

        <article className="py-6">
          <ChordSheet
            source={song.chordpro}
            originalKey={song.originalKey}
            semitones={semitones}
            capo={capo}
            fontSize={fontSize}
            showChords={showChords}
          />
        </article>

        {/* Mobile */}
        <div className="md:hidden">
          <MobileDock
            song={song}
            semitones={semitones} setSemitones={setSemitones}
            capo={capo} setCapo={setCapo}
            fontSize={fontSize} setFontSize={setFontSize}
            showChords={showChords} toggleChords={toggleChords}
            scrollSpeed={scrollSpeed} setScrollSpeed={setScrollSpeed}
            isScrolling={isScrolling} setScrolling={setScrolling}
            onReset={() => reset(song.defaultCapo)}
          />
        </div>
      </div>
    </>
  );
}
