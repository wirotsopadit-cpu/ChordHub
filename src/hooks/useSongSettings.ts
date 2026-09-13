'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface State {
  songId: string | null;
  semitones: number;
  capo: number;
  fontSize: number;
  showChords: boolean;
  scrollSpeed: number;
  isScrolling: boolean;

  hydrateFromSong: (songId: string, defaultCapo: number) => void;
  setSemitones: (v: number) => void;
  setCapo: (v: number) => void;
  setFontSize: (v: number) => void;
  toggleChords: () => void;
  setScrollSpeed: (v: number) => void;
  setScrolling: (v: boolean) => void;
  reset: (defaultCapo: number) => void;
}

export const useSongSettings = create<State>()(
  persist(
    (set, get) => ({
      songId: null,
      semitones: 0,
      capo: 0,
      fontSize: 17,
      showChords: true,
      scrollSpeed: 3,
      isScrolling: false,

      /* เปลี่ยนเพลง → รีเซ็ต transpose แต่คง fontSize/showChords ไว้ */
      hydrateFromSong: (songId, defaultCapo) => {
        if (get().songId === songId) return;
        set({ songId, semitones: 0, capo: defaultCapo, isScrolling: false });
      },

      setSemitones: v => set({ semitones: clamp(v, -11, 11) }),
      setCapo: v => set({ capo: clamp(v, 0, 7) }),
      setFontSize: v => set({ fontSize: clamp(v, 13, 30) }),
      toggleChords: () => set(s => ({ showChords: !s.showChords })),
      setScrollSpeed: v => set({ scrollSpeed: clamp(v, 1, 10) }),
      setScrolling: v => set({ isScrolling: v }),

      reset: defaultCapo =>
        set({ semitones: 0, capo: defaultCapo, isScrolling: false }),
    }),
    {
      name: 'chordhub-settings',
      // persist เฉพาะค่าที่ควรจำข้ามเพลง
      partialize: s => ({
        fontSize: s.fontSize,
        showChords: s.showChords,
        scrollSpeed: s.scrollSpeed,
      }),
    },
  ),
);