/** วรรณยุกต์ + ไม้ไต่คู้ + ทัณฑฆาต (U+0E47–U+0E4E) */
const TONE_MARKS = /[\u0E47-\u0E4E]/g;

/** สระที่คนมักสะกดสลับ */
const VOWEL_FOLD: [RegExp, string][] = [
    [/[ํ]/g, ''],           // นิคหิต
    [/ๆ/g, ''],             // ไม้ยมก
    [/ฯ/g, ''],             // ไปยาลน้อย
    [/[ัิีึืุู]/g, ''],        // สระบน-ล่าง (ตัดออกเพื่อ fold)
];

/** พยัญชนะเสียงเดียวกันที่คนสับสน */
const CONSONANT_FOLD: [RegExp, string][] = [
    [/[ฤ]/g, 'ริ'],
    [/[ทธฑฒถฐ]/g, 'ท'],
    [/[ษศส]/g, 'ส'],
    [/[ณน]/g, 'น'],
    [/[ลฬ]/g, 'ล'],
    [/[ฎด]/g, 'ด'],
    [/[ฏต]/g, 'ต'],
    [/[คฅฆขฃ]/g, 'ค'],
    [/[ชฌฉ]/g, 'ช'],
    [/[บป]/g, 'บ'],
    [/[ผพภ]/g, 'พ'],
    [/[ฝฟ]/g, 'ฟ'],
    [/[ยญ]/g, 'ย'],
    [/[รร]/g, 'ร'],
    [/[ห]/g, ''],           // ห นำ
];

/** ระดับ 1: แค่ lowercase + ตัดช่องว่าง — ใช้กับการแสดงผล */
export function normalizeBasic(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFC')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** ระดับ 2: fold เสียงพ้อง — ใช้เป็น key ค้นหาหลัก */
export function normalizeThai(s: string): string {
    let out = normalizeBasic(s).replace(TONE_MARKS, '');
    for (const [re, to] of VOWEL_FOLD) out = out.replace(re, to);
    for (const [re, to] of CONSONANT_FOLD) out = out.replace(re, to);
    return out.replace(/\s+/g, '');
}

/* ─────────────────────────────────────────────
   โบนัส: แก้ปัญหา "ลืมเปลี่ยนภาษาแป้นพิมพ์"
   พิมพ์ "]bg;yo" ทั้งที่อยากได้ "ลมเปลี่ยน"
   ───────────────────────────────────────────── */
const EN_TO_TH: Record<string, string> = {
    q: 'ๆ', w: 'ไ', e: 'ำ', r: 'พ', t: 'ะ', y: 'ั', u: 'ี', i: 'ร', o: 'น', p: 'ย',
    '[': 'บ', ']': 'ล', a: 'ฟ', s: 'ห', d: 'ก', f: 'ด', g: 'เ', h: '้', j: '่', k: 'า',
    l: 'ส', ';': 'ว', "'": 'ง', z: 'ผ', x: 'ป', c: 'แ', v: 'อ', b: 'ิ', n: 'ื', m: 'ท',
    ',': 'ม', '.': 'ใ', '/': 'ฝ',
};

export function swapKeyboardLayout(s: string): string {
    return [...s.toLowerCase()].map(ch => EN_TO_TH[ch] ?? ch).join('');
}

/** ตรวจว่าเป็น "ข้อความไทยที่พิมพ์ผิดแป้น" หรือไม่ */
export function looksLikeMistypedThai(s: string): boolean {
    return /^[a-z;'\[\],./]+$/i.test(s) && s.length >= 3;
}