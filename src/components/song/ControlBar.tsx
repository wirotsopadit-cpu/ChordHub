'use client';

import {
  Minus, Plus, RotateCcw, Play, Pause,
  Type, Eye, EyeOff, Printer,
} from 'lucide-react';
import { transposeKey } from '@/lib/chords';
import type { Song } from '@/types/song';

interface Props {
  song: Song;
  semitones: number; setSemitones: (v: number) => void;
  capo: number; setCapo: (v: number) => void;
  fontSize: number; setFontSize: (v: number) => void;
  showChords: boolean; toggleChords: () => void;
  scrollSpeed: number; setScrollSpeed: (v: number) => void;
  isScrolling: boolean; setScrolling: (v: boolean) => void;
  onReset: () => void;
}

export default function ControlBar(p: Props) {
  const currentKey = transposeKey(p.song.originalKey, p.semitones);

  return (
    <div
      className="no-print sticky top-0 z-40 -mx-4 flex flex-wrap items-center gap-x-5
                 gap-y-3 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3
                 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60"
    >
      {/* ── Transpose ── */}
      <Group label="คีย์">
        <IconBtn onClick={() => p.setSemitones(p.semitones - 1)} aria="ลดคีย์">
          <Minus size={18} />
        </IconBtn>

        <div className="min-w-[72px] px-1 text-center">
          <div className="font-mono text-xl font-bold leading-none text-emerald-400">
            {currentKey}
          </div>
          <div className="mt-1 text-[10px] leading-none text-zinc-500">
            {p.semitones === 0
              ? 'ต้นฉบับ'
              : `${p.semitones > 0 ? '+' : ''}${p.semitones} ครึ่งเสียง`}
          </div>
        </div>

        <IconBtn onClick={() => p.setSemitones(p.semitones + 1)} aria="เพิ่มคีย์">
          <Plus size={18} />
        </IconBtn>
      </Group>

      <Divider />

      {/* ── Capo ── */}
      <Group label="คาโป">
        <select
          value={p.capo}
          onChange={e => p.setCapo(Number(e.target.value))}
          className="h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5
                     font-mono text-sm text-zinc-100 outline-none
                     focus:border-emerald-500"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <option key={i} value={i}>{i === 0 ? 'ไม่ใช้' : `ช่อง ${i}`}</option>
          ))}
        </select>
      </Group>

      <Divider />

      {/* ── Font size ── */}
      <Group label="ขนาด">
        <IconBtn onClick={() => p.setFontSize(p.fontSize - 1)} aria="ลดขนาดตัวอักษร">
          <Type size={14} />
        </IconBtn>
        <span className="w-8 text-center font-mono text-xs text-zinc-400">
          {p.fontSize}
        </span>
        <IconBtn onClick={() => p.setFontSize(p.fontSize + 1)} aria="เพิ่มขนาดตัวอักษร">
          <Type size={19} />
        </IconBtn>
      </Group>

      <Divider />

      {/* ── Auto scroll ── */}
      <Group label="เลื่อนอัตโนมัติ">
        <IconBtn
          onClick={() => p.setScrolling(!p.isScrolling)}
          aria={p.isScrolling ? 'หยุดเลื่อน' : 'เริ่มเลื่อน'}
          active={p.isScrolling}
        >
          {p.isScrolling ? <Pause size={18} /> : <Play size={18} />}
        </IconBtn>

        <input
          type="range" min={1} max={10} step={1}
          value={p.scrollSpeed}
          onChange={e => p.setScrollSpeed(Number(e.target.value))}
          className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-zinc-700
                     accent-emerald-500"
          aria-label="ความเร็วการเลื่อน"
        />
      </Group>

      <div className="ml-auto flex items-center gap-1.5">
        <IconBtn onClick={p.toggleChords} aria="ซ่อน/แสดงคอร์ด" active={!p.showChords}>
          {p.showChords ? <Eye size={17} /> : <EyeOff size={17} />}
        </IconBtn>
        <IconBtn onClick={() => window.print()} aria="พิมพ์">
          <Printer size={17} />
        </IconBtn>
        <IconBtn onClick={p.onReset} aria="รีเซ็ตทั้งหมด">
          <RotateCcw size={16} />
        </IconBtn>
      </div>
    </div>
  );
}

/* ── ชิ้นส่วนย่อย ── */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-9 w-px self-end bg-zinc-800" />;
}

function IconBtn({
  children, onClick, aria, active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  aria: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      title={aria}
      className={`grid h-10 w-10 place-items-center rounded-lg transition
                  active:scale-90
                  ${active
          ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
    >
      {children}
    </button>
  );
}