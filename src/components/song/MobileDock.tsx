'use client';

import { useState } from 'react';
import {
  Minus, Plus, ChevronUp, X, Play, Pause,
  Type, RotateCcw, Eye, EyeOff,
} from 'lucide-react';
import { transposeKey } from '@/lib/chords';
import type { Song } from '@/types/song';

export default function MobileDock(p: any) {
  const [open, setOpen] = useState(false);
  const song: Song = p.song;
  const currentKey = transposeKey(song.originalKey, p.semitones);

  return (
    <>
      {/* แถบล่างแบบย่อ */}
      <div
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800
                   bg-zinc-950/90 px-3 pb-[env(safe-area-inset-bottom)] pt-2
                   backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => p.setSemitones(p.semitones - 1)}
            aria-label="ลดคีย์"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl
                       bg-zinc-800 text-zinc-200 active:scale-90"
          >
            <Minus size={22} />
          </button>

          <button
            onClick={() => setOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl
                       bg-zinc-800/70 py-2.5 active:scale-[0.98]"
          >
            <div className="text-center">
              <div className="font-mono text-lg font-bold leading-none text-emerald-400">
                {currentKey}
              </div>
              <div className="mt-0.5 text-[10px] text-zinc-500">
                {p.capo > 0 ? `คาโป ${p.capo} · ` : ''}
                {p.semitones === 0 ? 'ต้นฉบับ' : `${p.semitones > 0 ? '+' : ''}${p.semitones}`}
              </div>
            </div>
            <ChevronUp size={16} className="text-zinc-500" />
          </button>

          <button
            onClick={() => p.setScrolling(!p.isScrolling)}
            aria-label={p.isScrolling ? 'หยุด' : 'เลื่อนอัตโนมัติ'}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl active:scale-90
                        ${p.isScrolling
                ? 'bg-emerald-500 text-zinc-950'
                : 'bg-zinc-800 text-zinc-200'}`}
          >
            {p.isScrolling ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={() => p.setSemitones(p.semitones + 1)}
            aria-label="เพิ่มคีย์"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl
                       bg-zinc-800 text-zinc-200 active:scale-90"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Bottom sheet เต็ม */}
      {open && (
        <div className="no-print fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div
            className="absolute inset-x-0 bottom-0 animate-[slideUp_.22s_ease-out]
                       rounded-t-3xl border-t border-zinc-800 bg-zinc-900 p-5
                       pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-zinc-700" />

            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">ตั้งค่าการแสดงผล</h3>
              <button onClick={() => setOpen(false)} aria-label="ปิด"
                className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-800">
                <X size={18} />
              </button>
            </div>

            {/* Capo */}
            <Row label={`คาโป${p.capo ? ` — ช่อง ${p.capo}` : ''}`}>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {Array.from({ length: 8 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => p.setCapo(i)}
                    className={`h-11 min-w-11 shrink-0 rounded-xl font-mono text-sm
                                ${p.capo === i
                        ? 'bg-emerald-500 font-bold text-zinc-950'
                        : 'bg-zinc-800 text-zinc-300'}`}
                  >
                    {i === 0 ? '—' : i}
                  </button>
                ))}
              </div>
            </Row>

            {/* Font size */}
            <Row label={`ขนาดตัวอักษร — ${p.fontSize}px`}>
              <div className="flex items-center gap-3">
                <button onClick={() => p.setFontSize(p.fontSize - 1)}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-800">
                  <Type size={14} />
                </button>
                <input
                  type="range" min={13} max={30} value={p.fontSize}
                  onChange={e => p.setFontSize(Number(e.target.value))}
                  className="h-1.5 flex-1 appearance-none rounded-full bg-zinc-700 accent-emerald-500"
                />
                <button onClick={() => p.setFontSize(p.fontSize + 1)}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-800">
                  <Type size={20} />
                </button>
              </div>
            </Row>

            {/* Scroll speed */}
            <Row label={`ความเร็วเลื่อน — ระดับ ${p.scrollSpeed}`}>
              <input
                type="range" min={1} max={10} value={p.scrollSpeed}
                onChange={e => p.setScrollSpeed(Number(e.target.value))}
                className="h-1.5 w-full appearance-none rounded-full bg-zinc-700 accent-emerald-500"
              />
            </Row>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={p.toggleChords}
                className="flex h-12 items-center justify-center gap-2 rounded-xl
                           bg-zinc-800 text-sm font-medium"
              >
                {p.showChords ? <EyeOff size={16} /> : <Eye size={16} />}
                {p.showChords ? 'ซ่อนคอร์ด' : 'แสดงคอร์ด'}
              </button>
              <button
                onClick={() => { p.onReset(); setOpen(false); }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl
                           bg-zinc-800 text-sm font-medium"
              >
                <RotateCcw size={16} /> รีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs text-zinc-400">{label}</p>
      {children}
    </div>
  );
}