// ChordPro format parser for ChordSheet component

export type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'other';

export interface ChordToken {
  chord?: string;
  lyric?: string;
}

export type ParsedLine =
  | { type: 'empty' }
  | { type: 'comment'; text: string }
  | { type: 'lyric'; tokens: ChordToken[] };

export interface ParsedSection {
  name?: string;
  type: SectionType;
  lines: ParsedLine[];
}

export interface ParsedChordPro {
  sections: ParsedSection[];
  metadata: Record<string, string>;
}

function detectSectionType(name: string): SectionType {
  const lower = name.toLowerCase().trim();
  if (lower.includes('intro')) return 'intro';
  if (lower.includes('chorus') || lower.includes('hook') || lower.includes('ฮุค')) return 'chorus';
  if (lower.includes('verse') || lower.includes('ท่อน')) return 'verse';
  if (lower.includes('bridge') || lower.includes('บริดจ์')) return 'bridge';
  return 'other';
}

/**
 * Tokenize a line containing embedded chords like "[Am]hello [G]world"
 */
function tokenizeChordLine(line: string): ChordToken[] {
  const tokens: ChordToken[] = [];
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let match: RegExpExecArray | null;

  // Check if there is leading lyric before any chord
  const firstBracket = line.indexOf('[');
  if (firstBracket > 0) {
    const leadingLyric = line.substring(0, firstBracket);
    tokens.push({ lyric: leadingLyric });
  } else if (firstBracket === -1) {
    // Plain line without chords
    return [{ lyric: line }];
  }

  while ((match = regex.exec(line)) !== null) {
    const chord = match[1].trim();
    const lyric = match[2];
    tokens.push({ chord, lyric });
  }

  return tokens.length > 0 ? tokens : [{ lyric: line }];
}

/**
 * Parse ChordPro text into structured sections and lines compatible with ChordSheet
 */
export function parseChordPro(input: string): ParsedChordPro {
  if (!input || !input.trim()) {
    return { sections: [], metadata: {} };
  }

  const lines = input.split('\n');
  const metadata: Record<string, string> = {};
  const sections: ParsedSection[] = [];

  let currentSection: ParsedSection = {
    type: 'verse',
    lines: [],
  };

  const finalizeSection = () => {
    if (currentSection.lines.length > 0 || currentSection.name) {
      sections.push(currentSection);
    }
  };

  for (let rawLine of lines) {
    const line = rawLine.trimEnd();

    // 1. Empty line
    if (line.trim() === '') {
      currentSection.lines.push({ type: 'empty' });
      continue;
    }

    // 2. Directives like {title: ...}, {soc}, {eoc}
    const directiveMatch = line.match(/^\{([a-zA-Z0-9_\-]+)(?::\s*(.*))?\}$/);
    if (directiveMatch) {
      const key = directiveMatch[1].toLowerCase();
      const val = (directiveMatch[2] || '').trim();

      if (key === 'start_of_chorus' || key === 'soc') {
        finalizeSection();
        currentSection = { name: val || 'Chorus', type: 'chorus', lines: [] };
        continue;
      }

      if (key === 'end_of_chorus' || key === 'eoc') {
        finalizeSection();
        currentSection = { type: 'verse', lines: [] };
        continue;
      }

      if (key === 'start_of_verse' || key === 'sov') {
        finalizeSection();
        currentSection = { name: val || 'Verse', type: 'verse', lines: [] };
        continue;
      }

      if (key === 'end_of_verse' || key === 'eov') {
        finalizeSection();
        currentSection = { type: 'verse', lines: [] };
        continue;
      }

      if (key === 'start_of_bridge' || key === 'sob') {
        finalizeSection();
        currentSection = { name: val || 'Bridge', type: 'bridge', lines: [] };
        continue;
      }

      if (key === 'end_of_bridge' || key === 'eob') {
        finalizeSection();
        currentSection = { type: 'verse', lines: [] };
        continue;
      }

      if (key === 'comment' || key === 'c') {
        // Check if comment is actually a section heading like {c: Intro} or {c: Solo}
        const sectionType = detectSectionType(val);
        if (
          val.toLowerCase().includes('intro') ||
          val.toLowerCase().includes('outro') ||
          val.toLowerCase().includes('solo') ||
          val.toLowerCase().includes('verse') ||
          val.toLowerCase().includes('chorus') ||
          val.toLowerCase().includes('bridge')
        ) {
          finalizeSection();
          currentSection = { name: val, type: sectionType, lines: [] };
        } else {
          currentSection.lines.push({ type: 'comment', text: val });
        }
        continue;
      }

      metadata[key] = val;
      continue;
    }

    // 3. Section header in brackets on its own line: e.g. [Intro], [Verse 1], [Chorus]
    const headerMatch = line.match(/^\[([a-zA-Zก-๙0-9\s\-]+)\]$/);
    if (headerMatch && !line.includes(' ')) {
      const name = headerMatch[1];
      finalizeSection();
      currentSection = { name, type: detectSectionType(name), lines: [] };
      continue;
    }

    // 4. Comments starting with #
    if (line.startsWith('#')) {
      currentSection.lines.push({ type: 'comment', text: line.substring(1).trim() });
      continue;
    }

    // 5. Lyric line with or without chords
    const tokens = tokenizeChordLine(line);
    currentSection.lines.push({ type: 'lyric', tokens });
  }

  finalizeSection();

  return { sections, metadata };
}
