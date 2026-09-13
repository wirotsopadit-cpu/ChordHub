'use client';

import { useEffect, useState } from 'react';
import { X, Volume2 } from 'lucide-react';
import { getShape } from '@/lib/chordShapes';
import { playChord } from '@/lib/audio';

const W = 180, H = 200, PAD_X = 26, PAD_TOP = 36;
const STR = 6, FRETS = 5;
const SW = (W - PAD_X * 2) / (STR - 1);           // ระยะระหว่างสาย
const FH = (H - PAD_TOP - 16) / FRETS;            // ความสูงต่อเฟร็ต
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

export default function ChordDiagram({
  chord, onClose,
}: { chord: string; onClose: () => void }) {
  const shape = getShape(chord);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handlePlaySound = () => {
    setPlaying(true);
    playChord(chord);
    setTimeout(() => setPlaying(false), 800);
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog" aria-modal="true" aria-label={`คอร์ด ${chord}`}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[280px] rounded-3xl border border-zinc-800
                      bg-zinc-900/95 p-6 text-center shadow-2xl backdrop-blur-md">
        <button
          onClick={onClose}
          aria-label="ปิด"
          className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center
                     rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition"
        >
          <X size={16} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-2">
          <h4 className="font-mono text-3xl font-bold text-emerald-400">{chord}</h4>
          <button
            type="button"
            onClick={handlePlaySound}
            title="กดเพื่อฟังเสียงคอร์ด"
            aria-label="ฟังเสียงคอร์ด"
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-95 ${
              playing
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 scale-105'
                : 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-emerald-500/60 hover:text-emerald-400'
            }`}
          >
            <Volume2 size={16} />
          </button>
        </div>

        <p className="text-xs text-zinc-400 mb-3">ตารางคอร์ดกีตาร์มาตรฐาน</p>

        {shape ? (
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[190px]">
              {/* nut */}
              {shape.baseFret === 1 && (
                <rect
                  x={PAD_X - 1}
                  y={PAD_TOP - 4}
                  width={SW * 5 + 2}
                  height={5}
                  fill="#e4e4e7"
                  rx={1}
                />
              )}

              {/* เส้นเฟร็ต */}
              {Array.from({ length: FRETS + 1 }, (_, i) => (
                <line
                  key={`f${i}`}
                  x1={PAD_X}
                  y1={PAD_TOP + i * FH}
                  x2={PAD_X + SW * 5}
                  y2={PAD_TOP + i * FH}
                  stroke="#52525b"
                  strokeWidth={1.2}
                />
              ))}

              {/* เส้นสาย */}
              {Array.from({ length: STR }, (_, i) => (
                <line
                  key={`s${i}`}
                  x1={PAD_X + i * SW}
                  y1={PAD_TOP}
                  x2={PAD_X + i * SW}
                  y2={PAD_TOP + FH * FRETS}
                  stroke="#71717a"
                  strokeWidth={1 + (5 - i) * 0.25} // สายเบสหนากว่าสายแหลม
                />
              ))}

              {/* บาร์เร่ (Barre) */}
              {shape.barres?.map((b, i) => {
                const x1 = PAD_X + (6 - b.from) * SW;
                const x2 = PAD_X + (6 - b.to) * SW;
                const y = PAD_TOP + (b.fret - shape.baseFret + 0.5) * FH;
                return (
                  <line
                    key={`b${i}`}
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke="#10b981"
                    strokeWidth={14}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                );
              })}

              {/* จุดนิ้ว + สัญลักษณ์ x / o */}
              {shape.frets.map((fret, i) => {
                const x = PAD_X + i * SW;

                if (fret === -1)
                  return (
                    <text
                      key={i}
                      x={x}
                      y={PAD_TOP - 9}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight="bold"
                      fill="#71717a"
                    >
                      ✕
                    </text>
                  );

                if (fret === 0)
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={PAD_TOP - 13}
                      r={4}
                      fill="none"
                      stroke="#a1a1aa"
                      strokeWidth={1.5}
                    />
                  );

                const y = PAD_TOP + (fret - shape.baseFret + 0.5) * FH;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={9} fill="#10b981" />
                    {shape.fingers[i] > 0 && (
                      <text
                        x={x}
                        y={y + 3.5}
                        textAnchor="middle"
                        fontSize={10.5}
                        fontWeight="bold"
                        fill="#09090b"
                      >
                        {shape.fingers[i]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* เลขเฟร็ตเริ่มต้น */}
              {shape.baseFret > 1 && (
                <text
                  x={PAD_X - 10}
                  y={PAD_TOP + FH * 0.65}
                  textAnchor="end"
                  fontSize={12}
                  fontWeight="bold"
                  fill="#a1a1aa"
                >
                  {shape.baseFret}fr
                </text>
              )}

              {/* ชื่อสายด้านล่าง */}
              {STRING_NAMES.map((name, i) => (
                <text
                  key={`name-${i}`}
                  x={PAD_X + i * SW}
                  y={PAD_TOP + FH * FRETS + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#71717a"
                >
                  {name}
                </text>
              ))}
            </svg>
          </div>
        ) : (
          <p className="py-8 text-sm text-zinc-500">
            ยังไม่มีแผนภาพสำหรับคอร์ดนี้
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <p className="text-zinc-500">ตัวเลขในวงกลม: 1=ชี้, 2=กลาง, 3=นาง, 4=ก้อย</p>
          <p className="text-zinc-500">✕ = ไม่ดีดสายนั้น · ○ = ดีดสายเปล่า</p>
        </div>
      </div>
    </div>
  );
}