// Smart chord text converter: converts standard guitar chord tabs into ChordPro format

import { isChord } from './chords';

/**
 * Check if a line is likely a chord line
 * (mostly chord symbols, whitespace, slashes, and dashes)
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // If it's a section header like [Intro], [Verse], don't treat as chord line
  if (/^\[(intro|verse|chorus|hook|bridge|outro|solo|ท่อน)\]$/i.test(trimmed)) {
    return false;
  }

  // Tokenize by whitespace
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    // Strip surrounding parentheses or brackets: (Am) -> Am, [Am] -> Am
    const clean = token.replace(/^[(\[]+|[)\]]+$/g, '');
    if (isChord(clean) || clean === '-' || clean === '/' || clean === '|') {
      chordCount++;
    }
  }

  return chordCount / tokens.length >= 0.7;
}

interface ChordPosition {
  chord: string;
  index: number;
}

/**
 * Extract all chords and their character indices in a chord line
 */
function extractChordPositions(line: string): ChordPosition[] {
  const positions: ChordPosition[] = [];
  // Regex to match potential chord tokens
  const regex = /([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13)*\d*(?:\/[A-G][#b]?)?)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const chord = match[1];
    if (isChord(chord)) {
      positions.push({
        chord,
        index: match.index,
      });
    }
  }

  return positions;
}

/**
 * Merge a chord line with a lyric line based on character positions
 */
function mergeChordsWithLyrics(chordLine: string, lyricLine: string): string {
  const chords = extractChordPositions(chordLine);
  if (chords.length === 0) return lyricLine;

  let result = '';
  let lastLyricIdx = 0;

  for (const { chord, index } of chords) {
    // Clamp index to lyric length
    const insertIdx = Math.min(index, lyricLine.length);

    // Append lyrics up to this chord insertion point
    if (insertIdx > lastLyricIdx) {
      result += lyricLine.substring(lastLyricIdx, insertIdx);
      lastLyricIdx = insertIdx;
    }

    result += `[${chord}]`;
  }

  // Append remaining lyrics
  if (lastLyricIdx < lyricLine.length) {
    result += lyricLine.substring(lastLyricIdx);
  }

  return result;
}

/**
 * Format a chord-only line (e.g. Intro or Solo)
 */
function formatChordOnlyLine(line: string): string {
  const chords = extractChordPositions(line);
  if (chords.length === 0) return line.trim();
  return chords.map(c => `[${c.chord}]`).join(' ');
}

/**
 * Convert plain text tab (chords above lyrics) into ChordPro format
 */
export function convertPlainTextToChordPro(input: string): string {
  if (!input || !input.trim()) return '';

  const lines = input.split(/\r?\n/);
  const outputLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const trimmed = currentLine.trim();

    // 1. Empty lines
    if (!trimmed) {
      outputLines.push('');
      continue;
    }

    // 2. Section headers
    const sectionMatch = trimmed.match(/^(?:\[|\{)?(intro|verse|chorus|hook|bridge|outro|solo|ท่อนฮุค|ท่อนแยก|ท่อนร้อง|อินโทร|โซโล่)(?:\s*\d*)?(?:\]|\}|:)?$/i);
    if (sectionMatch) {
      const name = sectionMatch[1].toLowerCase();
      if (name.includes('chorus') || name.includes('hook') || name.includes('ฮุค')) {
        outputLines.push('{soc: Chorus}');
      } else if (name.includes('verse') || name.includes('ร้อง')) {
        outputLines.push('{sov: Verse}');
      } else if (name.includes('intro') || name.includes('อินโทร')) {
        outputLines.push('{c: Intro}');
      } else if (name.includes('outro')) {
        outputLines.push('{c: Outro}');
      } else if (name.includes('solo') || name.includes('โซโล่')) {
        outputLines.push('{c: Solo}');
      } else {
        outputLines.push(`{c: ${trimmed}}`);
      }
      continue;
    }

    // 3. Already in ChordPro bracket format (e.g. [G]ฉันรักเธอ)
    if (/\[[A-G][#b]?.*?\]/.test(currentLine)) {
      outputLines.push(currentLine);
      continue;
    }

    // 4. Check if current line is a chord line
    if (isChordLine(currentLine)) {
      const nextLine = lines[i + 1];
      const nextTrimmed = nextLine ? nextLine.trim() : '';

      // If next line exists and is NOT a chord line and NOT empty, merge them!
      if (nextLine !== undefined && nextTrimmed && !isChordLine(nextLine)) {
        outputLines.push(mergeChordsWithLyrics(currentLine, nextLine));
        i++; // skip the consumed lyric line
      } else {
        // Chord-only line (e.g. Intro bar)
        outputLines.push(formatChordOnlyLine(currentLine));
      }
      continue;
    }

    // 5. Normal lyric line without chords above it
    outputLines.push(currentLine);
  }

  return outputLines.join('\n');
}
