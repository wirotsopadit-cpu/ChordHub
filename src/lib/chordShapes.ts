/**
 * frets: 6 ค่า เรียงจากสาย 6 (E ต่ำ) → สาย 1 (E สูง)
 *        -1 = ไม่ดีด, 0 = สายเปล่า
 * fingers: เลขนิ้ว 1–4, 0 = ไม่ใช้
 * baseFret: เฟร็ตเริ่มต้นของแผนภาพ
 */
export interface Shape {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres?: { fret: number; from: number; to: number }[];
}

export const CHORD_SHAPES: Record<string, Shape> = {
  C: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  C7: { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 },
  Cm: {
    frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3,
    barres: [{ fret: 3, from: 5, to: 1 }]
  },
  D: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
  Dm: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
  D7: { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
  Dsus4: { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1 },
  E: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
  E7: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  F: {
    frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1,
    barres: [{ fret: 1, from: 6, to: 1 }]
  },
  'F#m': {
    frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2,
    barres: [{ fret: 2, from: 6, to: 1 }]
  },
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  Gm: {
    frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3,
    barres: [{ fret: 3, from: 6, to: 1 }]
  },
  A: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  Am: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
  Am7: { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },
  A7: { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], baseFret: 1 },
  B: {
    frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2,
    barres: [{ fret: 2, from: 5, to: 1 }]
  },
  Bm: {
    frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2,
    barres: [{ fret: 2, from: 5, to: 1 }]
  },
  B7: { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 },
  Bb: {
    frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1,
    barres: [{ fret: 1, from: 5, to: 1 }]
  },
  'C#m': {
    frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4,
    barres: [{ fret: 4, from: 5, to: 1 }]
  },
};

export function getShape(chord: string): Shape | null {
  if (!chord) return null;
  // Try direct match
  if (CHORD_SHAPES[chord]) return CHORD_SHAPES[chord];

  // Try removing slash chord bass e.g. C/G -> C
  if (chord.includes('/')) {
    const root = chord.split('/')[0];
    if (CHORD_SHAPES[root]) return CHORD_SHAPES[root];
  }

  return null;
}