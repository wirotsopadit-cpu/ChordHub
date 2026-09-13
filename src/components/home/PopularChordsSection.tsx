'use client';

import { useState } from 'react';
import { Guitar, Volume2, Sparkles, SlidersHorizontal, Flame, Info, Check } from 'lucide-react';
import ChordDiagram from '@/components/song/ChordDiagram';
import { playChord } from '@/lib/audio';

interface ChordCategory {
  id: string;
  name: string;
  chords: string[];
}

const CATEGORIES: ChordCategory[] = [
  {
    id: 'basic',
    name: 'คอร์ดพื้นฐาน (Open)',
    chords: ['C', 'G', 'D', 'Em', 'Am', 'F', 'E', 'A'],
  },
  {
    id: 'minor',
    name: 'คอร์ดไมเนอร์ (Minor)',
    chords: ['Am', 'Em', 'Dm', 'Bm', 'F#m', 'C#m', 'Gm', 'Cm'],
  },
  {
    id: 'seventh',
    name: 'คอร์ด 7th',
    chords: ['C7', 'G7', 'D7', 'E7', 'A7', 'B7', 'Am7'],
  },
  {
    id: 'barre',
    name: 'คอร์ดทาบ (Barre)',
    chords: ['F', 'Bm', 'Bb', 'Gm', 'Cm', 'B'],
  },
];

export default function PopularChordsSection() {
  const [activeCategory, setActiveCategory] = useState<string>('basic');
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [activeFeatureModal, setActiveFeatureModal] = useState<string | null>(null);

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory) ?? CATEGORIES[0];

  const handleChordClick = (chord: string) => {
    // Play guitar strum sound and open diagram modal
    playChord(chord);
    setSelectedChord(chord);
  };

  return (
    <>
      <section id="chords" className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
        {/* Header with Title & Category Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Guitar size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                คอร์ดพื้นฐานยอดนิยม
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  <Volume2 size={12} /> กดเพื่อดูวิธีจับ & ฟังเสียง
                </span>
              </h2>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-xl px-3 py-1.5 font-medium transition active:scale-95 ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chords Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {currentCategory.chords.map(chord => (
            <button
              key={chord}
              type="button"
              onClick={() => handleChordClick(chord)}
              title={`คลิกเพื่อดูวิธีจับคอร์ด ${chord} และฟังเสียง`}
              className="group relative flex flex-col items-center justify-center p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 hover:border-emerald-500/50 hover:bg-zinc-900 hover:shadow-lg hover:shadow-emerald-950/20 transition-all duration-200 active:scale-95 cursor-pointer text-center"
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400">
                <Volume2 size={13} />
              </div>
              <span className="font-mono text-2xl font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                {chord}
              </span>
              <span className="text-[11px] text-zinc-400 mt-1">คอร์ด {chord}</span>
              <span className="mt-1.5 text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                ดูวิธีจับ
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3 Feature Cards Showcase */}
      <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div
            onClick={() => setActiveFeatureModal('transpose')}
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-emerald-500/30 transition cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center mb-3.5 group-hover:scale-105 transition-transform">
              <SlidersHorizontal size={20} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-emerald-400 transition">
              เปลี่ยนคีย์ได้ทันที
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Transpose ปรับขึ้น-ลงตามคีย์ที่ร้องสะดวก พร้อมคำนวณตำแหน่งคาโปให้อัตโนมัติ รองรับคีย์ลัด ↑ / ↓
            </p>
          </div>

          <div
            onClick={() => setActiveFeatureModal('diagram')}
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-emerald-500/30 transition cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center mb-3.5 group-hover:scale-105 transition-transform">
              <Guitar size={20} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-emerald-400 transition">
              ดูวิธีจับคอร์ดได้ทุกท่อน
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              คลิกที่ชื่อคอร์ดในเนื้อเพลงเพื่อเปิดตารางนิ้วเฟร็ต พร้อมฟังเสียงตัวอย่างคอร์ดกีตาร์สมจริง
            </p>
          </div>

          <div
            onClick={() => setActiveFeatureModal('scroll')}
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-emerald-500/30 transition cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center mb-3.5 group-hover:scale-105 transition-transform">
              <Flame size={20} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-emerald-400 transition">
              เลื่อนหน้าจออัตโนมัติ
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              ไม่ต้องปล่อยมือจากกีตาร์ ปรับความเร็วการเลื่อนตามจังหวะเพลง พร้อมระบบ WakeLock ป้องกันจอดับ
            </p>
          </div>
        </div>
      </section>

      {/* Chord Diagram Popup Modal */}
      {selectedChord && (
        <ChordDiagram chord={selectedChord} onClose={() => setSelectedChord(null)} />
      )}
    </>
  );
}
