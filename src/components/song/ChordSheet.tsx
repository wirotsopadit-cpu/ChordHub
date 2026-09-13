'use client';

import { useMemo, useState } from 'react';
import { parseChordPro } from '@/lib/chordpro';
import { transposeChord, transposeKey } from '@/lib/chords';
import ChordDiagram from './ChordDiagram';

interface Props {
  source: string;
  originalKey: string;
  semitones: number;
  capo: number;
  fontSize: number;
  showChords: boolean;
}

const SECTION_COLOR: Record<string, string> = {
  intro: 'bg-sky-500/10 text-sky-400 ring-sky-500/25',
  verse: 'bg-zinc-700/40 text-zinc-300 ring-zinc-600/40',
  chorus: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25',
  bridge: 'bg-violet-500/10 text-violet-400 ring-violet-500/25',
  other: 'bg-zinc-700/40 text-zinc-300 ring-zinc-600/40',
};

export default function ChordSheet({
  source, originalKey, semitones, capo, fontSize, showChords,
}: Props) {
  const [activeChord, setActiveChord] = useState<string | null>(null);

  const parsed = useMemo(() => parseChordPro(source), [source]);

  // คอร์ดที่นิ้วจับจริง = คีย์ที่ได้ยิน − ตำแหน่งคาโป
  const shift = semitones - capo;
  const targetKey = useMemo(
    () => transposeKey(originalKey, semitones),
    [originalKey, semitones],
  );

  if (!parsed.sections.length) {
    return <p className="py-10 text-center text-zinc-500">ยังไม่มีเนื้อเพลงสำหรับเพลงนี้</p>;
  }

  return (
    <>
      <div
        className="chord-sheet select-text"
        style={{ fontSize: `${fontSize}px` }}
      >
        {parsed.sections.map((sec, si) => (
          <section key={si} className="mb-7">
            {sec.name && (
              <h3
                className={`mb-2 inline-block rounded-md px-2 py-0.5 text-[11px]
                            font-bold uppercase tracking-widest ring-1
                            ${SECTION_COLOR[sec.type] ?? SECTION_COLOR.other}`}
              >
                {sec.name}
              </h3>
            )}

            {sec.lines.map((line, li) => {
              if (line.type === 'empty') {
                return <div key={li} style={{ height: fontSize * 0.7 }} />;
              }

              if (line.type === 'comment') {
                return (
                  <p key={li} className="my-1.5 text-[0.85em] italic text-zinc-500">
                    {line.text}
                  </p>
                );
              }

              return (
                <div
                  key={li}
                  className="lyric-line flex flex-wrap items-end"
                  style={{ marginBottom: showChords ? fontSize * 0.45 : fontSize * 0.15 }}
                >
                  {line.tokens.map((tk, ti) => {
                    const chord = tk.chord
                      ? transposeChord(tk.chord, shift, targetKey)
                      : null;

                    return (
                      <span
                        key={ti}
                        className="relative inline-flex flex-col whitespace-pre"
                      >
                        {showChords && (
                          <span
                            className="h-[1.45em] font-mono text-[0.8em] font-bold
                                       leading-none tracking-tight"
                          >
                            {chord ? (
                              <button
                                type="button"
                                onClick={() => setActiveChord(chord)}
                                className="-mx-0.5 rounded px-0.5 text-emerald-400
                                           transition hover:bg-emerald-400/15
                                           active:scale-95"
                                aria-label={`ดูวิธีจับคอร์ด ${chord}`}
                              >
                                {chord}
                              </button>
                            ) : (
                              '\u00A0'
                            )}
                          </span>
                        )}
                        <span className="text-zinc-100">{tk.lyric || '\u00A0'}</span>
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </section>
        ))}
      </div>

      {activeChord && (
        <ChordDiagram chord={activeChord} onClose={() => setActiveChord(null)} />
      )}
    </>
  );
}