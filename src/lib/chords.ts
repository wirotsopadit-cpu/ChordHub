// Chord transposition and music theory utilities

export const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_SCALE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const NOTE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11,
};

// Keys that traditionally prefer flats (b)
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);

/**
 * Get the semitone index (0..11) for a given root note
 */
function getNoteIndex(note: string): number {
  return NOTE_INDEX[note] ?? -1;
}

/**
 * Transpose a single pitch (e.g. "C", "F#", "Bb")
 */
function transposeNote(note: string, semitones: number, preferFlats = false): string {
  const index = getNoteIndex(note);
  if (index === -1) return note;

  const newIndex = ((index + semitones) % 12 + 12) % 12;
  return preferFlats ? FLAT_SCALE[newIndex] : SHARP_SCALE[newIndex];
}

/**
 * Transpose a musical key name (e.g., "C" + 2 -> "D", "Am" + 3 -> "Cm")
 */
export function transposeKey(key: string, semitones: number): string {
  if (!key || semitones === 0) return key;

  const match = key.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return key;

  const [, root, suffix] = match;
  const tempIdx = ((getNoteIndex(root) + semitones) % 12 + 12) % 12;
  const tempSharp = SHARP_SCALE[tempIdx] + suffix;
  const preferFlats = FLAT_KEYS.has(tempSharp) || FLAT_KEYS.has(FLAT_SCALE[tempIdx] + suffix);

  const newRoot = transposeNote(root, semitones, preferFlats);
  return `${newRoot}${suffix}`;
}

/**
 * Transpose a chord by a number of semitones, preserving suffix and slash bass note
 */
export function transposeChord(chord: string, semitones: number, targetKey?: string): string {
  if (!chord || semitones === 0) return chord;

  const preferFlats = targetKey ? FLAT_KEYS.has(targetKey) : false;

  // Handle slash chords like C/G or D/F#
  if (chord.includes('/')) {
    const [main, bass] = chord.split('/');
    return `${transposeChord(main, semitones, targetKey)}/${transposeNote(bass, semitones, preferFlats)}`;
  }

  return chord.replace(/^[A-G][#b]?/, (root) => {
    return transposeNote(root, semitones, preferFlats);
  });
}

/**
 * Check if a string looks like a valid chord
 */
export function isChord(text: string): boolean {
  if (!text) return false;
  return /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|7|9|11|13)*\d*(\/[A-G](#|b)?)?$/.test(text.trim());
}

/**
 * Parse a chord into root, suffix, and optional bass
 */
export function parseChord(raw: string): { root: string; suffix: string; bass?: string } | null {
  if (!raw) return null;
  const match = raw.trim().match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
  if (!match) return null;
  return {
    root: match[1],
    suffix: match[2] || '',
    bass: match[3],
  };
}

/** แปลงคอร์ดให้อยู่ในรูปมาตรฐาน (Db → C#) เพื่อเทียบกันได้ */
export function canonicalChord(raw: string): string {
  const p = parseChord(raw);
  if (!p) return raw;
  const root = SHARP_SCALE[NOTE_INDEX[p.root] ?? 0];
  return root + p.suffix;
}

/** ตัดส่วนขยาย: Am7 → Am, Csus4 → C, F#m7b5 → F#m */
export function simplifyChord(raw: string): string {
  const p = parseChord(raw);
  if (!p) return raw;
  const root = SHARP_SCALE[NOTE_INDEX[p.root] ?? 0];
  const isMinor = /^m(?!aj)/.test(p.suffix);
  return root + (isMinor ? 'm' : '');
}