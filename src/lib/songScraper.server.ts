import 'server-only';
import { convertPlainTextToChordPro } from './chordConverter';

export interface ScrapedSongResult {
  title: string;
  artist: string;
  originalKey: string;
  defaultCapo: number;
  tempo?: number;
  strumming?: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  chordpro: string;
  sourceUrl?: string;
  isLiveWeb?: boolean;
  domain?: string;
}

// ── ฐานข้อมูลเพลงฮิตออนไลน์ยอดนิยม (Pre-indexed Online Song Catalog) ──
const ONLINE_CATALOG: ScrapedSongResult[] = [
  {
    title: 'วาฬเกยตื้น',
    artist: 'GUNGUN',
    originalKey: 'G',
    defaultCapo: 0,
    tempo: 84,
    strumming: 'ลง - ลง - ขึ้น - ขึ้น - ลง - ขึ้น',
    tags: ['เพลงอินดี้', 'อะคูสติก', 'เพลงฮิต', 'รัก'],
    difficulty: 'easy',
    chordpro: `{c: Intro}
[G] [Bm] [C] [D] (2 times)

{sov: Verse 1}
[G]มีวาฬตัวหนึ่งเกยตื้นน้ำตาย [Bm]
[C]หัวใจสลายเพราะรักคนใจร้าย [D]
[G]ว่ายน้ำมาไกลหวังเพียงได้พบ [Bm]
[C]คนที่เธอรัก แต่เขากลับไม่สนใจ [D]
{eov}

{soc: Chorus}
[C]ก็รักไปแล้ว [D]ให้ทำยังไง
[Bm]หัวใจดวงนี้ [Em]มันมอบให้ไป
[Am]เหมือนวาฬเกยตื้น [D]ที่รอความตาย
[C]อยู่ริมหาดทราย [D]เดียวดายคนเดียว [G]
{eoc}

{sov: Verse 2}
[G]คลื่นซัดมาพาให้ใจลอยไป [Bm]
[C]คิดถึงเรื่องราวที่เคยได้รักใคร [D]
[G]แม้รู้ว่าสายแต่ยังเฝ้ารอ [Bm]
[C]รอเธอกลับมา [D]กอดฉันอีกครั้ง [G]
{eov}`
  },
  {
    title: 'โต๊ะริม',
    artist: 'NONT TANONT',
    originalKey: 'F',
    defaultCapo: 1,
    tempo: 96,
    strumming: 'ลง - ลง - ขึ้น - ลง - ขึ้น',
    tags: ['เพลงป็อป', 'นนท์ ธนนท์', 'รักหวานซึ้ง', 'เพลงฮิต'],
    difficulty: 'easy',
    chordpro: `{c: Intro}
[F] [Am] [Bb] [C]

{sov: Verse 1}
[F]เธอมานั่งตรงโต๊ะริม [Am]
[Bb]รอยยิ้มเธอนั้นทำฉันใจละลาย [C]
[F]แอบมองเธออยู่นาน [Am]
[Bb]ไม่กล้าสบตา กลัวเธอจะรู้ความในใจ [C]
{eov}

{soc: Chorus}
[Bb]เชือดฉันให้ตาย [C]ด้วยสายตาคู่นั้น
[Am]ตกหลุมรักเธอ [Dm]เข้าแล้วทุกวัน
[Gm]อยากเดินเข้าไปทัก [C]อยากรู้จักเธอ
[F]อยากชวนเธอไปนั่งคุยกันที่โต๊ะริม
{eoc}`
  },
  {
    title: 'ถ้าเราเจอกันอีก',
    artist: 'Tilly Birds',
    originalKey: 'D',
    defaultCapo: 0,
    tempo: 105,
    strumming: 'ลง - ลง - ขึ้น - ขึ้น - ลง',
    tags: ['อินดี้ร็อค', 'เพลงเศร้า', 'คิดถึง'],
    difficulty: 'medium',
    chordpro: `{c: Intro}
[D] [F#m] [G] [A]

{sov: Verse 1}
[D]จากกันวันนั้น [F#m]ยังจำได้ดี
[G]ภาพความทรงจำ [A]ไม่เคยจางหายไป
[D]เธออยู่ที่ไหน [F#m]สบายดีไหม
[G]ฉันยังเหมือนเดิม [A]ไม่เคยเปลี่ยนใจ
{eov}

{soc: Chorus}
[G]ถ้าเราเจอกันอีก [A]ในสักวันหนึ่ง
[F#m]อยากถามเธอสักคำ [Bm]ว่าเธอยังคิดถึงกันไหม
[Em]เวลาที่ผ่านไป [A]ไม่ทำให้ฉันลืมเธอ
[D]ยังรอเสมอตรงที่เดิม
{eoc}`
  },
  {
    title: 'เสแสร้ง',
    artist: 'Paper Planes',
    originalKey: 'Am',
    defaultCapo: 0,
    tempo: 135,
    strumming: 'ลง - ลง - ลง - ขึ้น - ลง - ขึ้น',
    tags: ['ร็อค', 'พังก์', 'วัยรุ่น'],
    difficulty: 'medium',
    chordpro: `{c: Intro}
[Am] [F] [C] [G]

{sov: Verse 1}
[Am] แกล้งทำเป็นยิ้ม [F] แกล้งทำเป็นไม่แคร์
[C] ทั้งที่ข้างใน [G] มันแทบขาดใจ
[Am] คนที่เธอรัก [F] ไม่ใช่ฉันใช่ไหม
[C] บอกมาตรงๆ [G] อย่าเสแสร้งเลย
{eov}

{soc: Chorus}
[F]เสแสร้งทำเป็นรัก [G]ทั้งที่ไม่รู้สึก
[Em]หลอกให้คิดไปไกล [Am]แล้วก็ทิ้งกันไป
[Dm]เจ็บปวดเจียนตาย [G]กับคำว่ารักปลอมๆ [C]
{eoc}`
  },
  {
    title: 'นะหน้าทอง',
    artist: 'โจอี้ ภูวศิษฐ์',
    originalKey: 'C',
    defaultCapo: 0,
    tempo: 92,
    strumming: 'ลง - ลง - ขึ้น - ขึ้น - ลง - ขึ้น',
    tags: ['เพลงเพื่อชีวิต', 'เพลงฮิต', 'รัก'],
    difficulty: 'easy',
    chordpro: `{c: Intro}
[C] [Em] [Am] [F] [G]

{sov: Verse 1}
[C]ฉันมองเธอทีไร [Em]ใจมันสั่นไหว
[Am]เหมือนโดนสะกดไว้ [F]ด้วยมนต์คาถา [G]
[C]ดวงตากลมโต [Em]ยิ้มหวานจับใจ
[Am]อยากได้เธอมา [F]เป็นคู่ครอง [G]
{eov}

{soc: Chorus}
[F]ต้องลงคาถา [G]นะหน้าทอง
[Em]ให้เธอหันมอง [Am]มาสบตาฉัน
[Dm]อยากให้ความรัก [G]ของเราผูกพัน
[C]อยู่เคียงข้างกันตราบชั่วชีวา
{eoc}`
  },
  {
    title: 'ซ่อนกลิ่น',
    artist: 'Palmy',
    originalKey: 'F',
    defaultCapo: 0,
    tempo: 82,
    strumming: 'ลง - ลง - ขึ้น - ลง - ขึ้น',
    tags: ['เพลงป็อป', 'ปาล์มมี่', 'ซึ้งกินใจ'],
    difficulty: 'medium',
    chordpro: `{c: Intro}
[F] [Am] [Bb] [C]

{sov: Verse 1}
[F]กลิ่นหอมยังคงติดตรึง [Am]
[Bb]คอยย้ำเตือนเรื่องราว [C]วันวาน
[F]ดอกซ่อนกลิ่นที่เคย [Am]ร่วมปลูกข้างรั้ว
[Bb]ยังบานสดใส [C]ในความทรงจำ
{eov}

{soc: Chorus}
[Bb]ซ่อนความรู้สึกไว้ [C]ลึกสุดหัวใจ
[Am]ไม่ให้ใครรู้ [Dm]ว่ายังคิดถึงเธอ
[Gm]กลิ่นหอมที่ลอยมา [C]ชวนให้นึกถึง
[F]วันเวลาที่เธออยู่ข้างกัน
{eoc}`
  }
];

/**
 * ค้นหาผ่าน Search Engine แบบสดบนอินเทอร์เน็ต
 */
async function searchWebForChords(query: string): Promise<ScrapedSongResult[]> {
  try {
    const params = new URLSearchParams();
    params.append('q', `คอร์ด ${query}`);

    const res = await fetch('https://lite.duckduckgo.com/lite/', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const tdLinks = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*class='result-link'[^>]*>([\s\S]*?)<\/a>/gi)];

    const results: ScrapedSongResult[] = [];

    for (const item of tdLinks) {
      let rawUrl = item[1];
      if (rawUrl.includes('uddg=')) {
        const match = rawUrl.match(/uddg=([^&]+)/);
        if (match) rawUrl = decodeURIComponent(match[1]);
      }
      const rawTitle = item[2].replace(/<[^>]+>/g, '').trim();

      // ข้ามลิงก์ที่ไม่เกี่ยวข้องกับหน้าคอร์ด
      if (
        rawUrl.includes('youtube.com') ||
        rawUrl.includes('facebook.com') ||
        rawUrl.includes('tiktok.com') ||
        rawUrl.includes('twitter.com') ||
        rawUrl.includes('instagram.com')
      ) {
        continue;
      }

      // ทำความสะอาดชื่อเพลงและชื่อศิลปิน
      let clean = rawTitle
        .replace(/คอร์ดเพลง|คอร์ดกีต้าร์|คอร์ดกีตาร์|คอร์ด|เนื้อเพลง|แท็บ|แทป|สอนเล่น/g, '')
        .replace(/\|.*$/g, '')
        .replace(/- Chordzaa\.com.*$/gi, '')
        .replace(/- dochord\.com.*$/gi, '')
        .replace(/- MusicATM.*$/gi, '')
        .replace(/- Guitarthai.*$/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      let title = clean;
      let artist = 'ศิลปิน';

      if (clean.includes('-')) {
        const parts = clean.split('-');
        title = parts[0].trim();
        artist = parts.slice(1).join('-').trim();
      } else if (clean.includes('โดย')) {
        const parts = clean.split('โดย');
        title = parts[0].trim();
        artist = parts[1].trim();
      }

      let domain = '';
      try {
        domain = new URL(rawUrl).hostname.replace('www.', '');
      } catch {}

      results.push({
        title: title || query,
        artist: artist || 'ไม่ระบุ',
        originalKey: 'C',
        defaultCapo: 0,
        strumming: 'ลง - ลง - ขึ้น - ขึ้น - ลง - ขึ้น',
        tags: ['ดึงจากอินเทอร์เน็ต'],
        difficulty: 'medium',
        chordpro: '', // จะถูกดึงและแปลงสดเมื่อผู้ใช้กดเลือก
        sourceUrl: rawUrl,
        isLiveWeb: true,
        domain,
      });

      if (results.length >= 8) break;
    }

    // จัดลำดับ: เอาเว็บที่มีแนวโน้มเป็น Text Chord ขึ้นก่อน (เช่น musicatm, guitarthai, chordsong, dochord)
    results.sort((a, b) => {
      const isPriorityA = (a.domain?.includes('musicatm') || a.domain?.includes('guitarthai') || a.domain?.includes('chordsong')) ? 1 : 0;
      const isPriorityB = (b.domain?.includes('musicatm') || b.domain?.includes('guitarthai') || b.domain?.includes('chordsong')) ? 1 : 0;
      return isPriorityB - isPriorityA;
    });

    return results;
  } catch (err) {
    console.error('[searchWebForChords] error:', err);
    return [];
  }
}

/**
 * ค้นหาเพลงจากคลังออนไลน์อัตโนมัติ (รวมแคตตาล็อกด่วน + ค้นหาอินเทอร์เน็ตสด)
 */
export async function searchOnlineSongCatalog(query: string): Promise<ScrapedSongResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return ONLINE_CATALOG.slice(0, 6);

  // 1. ตรวจสอบในคลังแคตตาล็อกด่วนก่อน
  const localMatches = ONLINE_CATALOG.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  );

  // 2. ค้นหาบนอินเทอร์เน็ตสดเพิ่มเติมเสมอ เพื่อให้ได้ผลลัพธ์ทุกเพลงที่ต้องการ
  const webMatches = await searchWebForChords(query.trim());

  return [...localMatches, ...webMatches];
}

/**
 * ดึงเนื้อหาคอร์ดและแปลงจาก URL หน้าเว็บคอร์ดเพลง
 */
export async function fetchSongFromUrl(url: string): Promise<{ ok: boolean; data?: ScrapedSongResult; error?: string }> {
  try {
    const parsedUrl = new URL(url);
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
      },
    });

    if (!res.ok) {
      return { ok: false, error: `ไม่สามารถเข้าถึงหน้าเว็บได้ (HTTP ${res.status})` };
    }

    const html = await res.text();

    // 1. ดึง Title & Artist
    let title = '';
    let artist = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const rawTitle = titleMatch[1]
        .replace(/คอร์ดเพลง|คอร์ดกีต้าร์|คอร์ดกีตาร์|คอร์ด|เนื้อเพลง|แท็บ/g, '')
        .replace(/\|.*$/g, '')
        .replace(/- Chordzaa\.com.*$/gi, '')
        .replace(/- dochord\.com.*$/gi, '')
        .replace(/- MusicATM.*$/gi, '')
        .trim();
      const parts = rawTitle.split(/[-–—]/);
      if (parts.length >= 2) {
        title = parts[0].trim();
        artist = parts.slice(1).join('-').trim();
      } else {
        title = rawTitle;
      }
    }

    // 2. ดึง Text คอร์ดจาก <pre> หรือคอนเทนเนอร์คอร์ด
    let rawContent = '';
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (preMatch) {
      rawContent = preMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
    } else {
      // ค้นหาใน div ที่มักใช้เก็บคอร์ด
      const divMatch = html.match(/<div[^>]+class="[^"]*(?:chord|entry-content|song-content|post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (divMatch) {
        rawContent = divMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&');
      } else {
        // Fallback: ดึง text จากเนื้อหาหลัก
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '\n')
          .replace(/&nbsp;/g, ' ');
        rawContent = text;
      }
    }

    // ตรวจสอบว่ามีคอร์ดอยู่ในข้อความหรือไม่
    const hasChords = /[A-G][#b]?(?:m|maj|min|sus|dim|aug|add)?[0-9]*/.test(rawContent);
    if (!hasChords || rawContent.trim().length < 50) {
      return {
        ok: false,
        error: 'เว็บไซต์นี้ไม่ได้ใส่เนื้อหาคอร์ดในรูปแบบข้อความ (อาจเป็นรูปภาพหรือสคริปต์ป้องกันการคัดลอก) แนะนำให้เลือกเว็บอื่นจากผลการค้นหา หรือคัดลอกมาวางในเครื่องมือแปลงคอร์ดธรรมดา',
      };
    }

    // แปลง Text ให้เป็น ChordPro
    const chordpro = convertPlainTextToChordPro(rawContent);

    // ดึง Key ถ้ามีระบุ
    let originalKey = 'C';
    const keyMatch = html.match(/คีย์\s*([A-G][#b]?m?)/i) || html.match(/Key\s*:\s*([A-G][#b]?m?)/i);
    if (keyMatch) {
      originalKey = keyMatch[1];
    } else {
      // พยายามตรวจจับคอร์ดตัวแรก
      const firstChordMatch = chordpro.match(/\[([A-G][#b]?m?)\]/);
      if (firstChordMatch) {
        originalKey = firstChordMatch[1].replace('m', '');
      }
    }

    let domain = '';
    try {
      domain = parsedUrl.hostname.replace('www.', '');
    } catch {}

    return {
      ok: true,
      data: {
        title: title || 'ไม่ระบุชื่อเพลง',
        artist: artist || 'ไม่ระบุศิลปิน',
        originalKey,
        defaultCapo: 0,
        tags: ['นำเข้าจากเว็บ', domain].filter(Boolean),
        difficulty: 'medium',
        chordpro: chordpro.slice(0, 5000), // ป้องกันขนาดยาวเกินไป
        sourceUrl: url,
        domain,
      },
    };
  } catch (err: any) {
    return { ok: false, error: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก URL' };
  }
}
