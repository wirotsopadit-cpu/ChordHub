import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';

const sa = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

const SONGS = [
  {
    id: 'jai-nak-leng',
    slug: 'jai-nak-leng',
    title: 'ใจนักเลง',
    artist: 'อ๊อฟ พงษ์พัฒน์',
    artistId: 'pongpat',
    album: 'พงษ์พัฒน์ ภาค 2',
    originalKey: 'G',
    defaultCapo: 0,
    tempo: 78,
    timeSignature: '4/4',
    strumming: 'ลง - ลง - ขึ้น - ขึ้น - ลง - ขึ้น',
    chordsUsed: ['G', 'Em', 'C', 'D', 'Bm', 'Am'],
    tags: ['เพลงเพื่อชีวิต', 'เพลงยุค 90', 'อกหัก', 'ร็อค'],
    difficulty: 'easy',
    viewCount: 14520,
    status: 'published',
    createdBy: 'system',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    chordpro: `{c: Intro}
[G] [Em] [C] [D] (2 times)

{sov: Verse 1}
[G]เมื่อเธอเลือกอยู่กับเขา [Em]ตัวฉันคุกเข่าสั่นไหว
[C]ใจนักเลงถึงคราวปราชัย [D]ยอมให้เธอไปดี
[G]เมื่อเขานั้นดีกว่าฉัน [Em]จะรั้งเธอนั้นทำไม
[C]ปล่อยเธอไปตามทางหัวใจ [D]ไม่ขอขัดขวาง
{eov}

{soc: Chorus}
[C]ให้เธอได้ไปดี [D]กับคนที่เธอหวัง
[Bm]ส่วนฉันคนนี้ยังคง [Em]มีความหวังดีให้เธอ
[Am]เจ็บปวดเพียงใดใจนักเลง [D]ไม่เคยคิดแค้นเธอ
[C]ขอเพียงเธอ [D]ได้พบเจอ [G]สิ่งที่ดี
{eoc}

{sov: Verse 2}
[G]จะจำเรื่องราวดีๆ [Em]ที่มีให้กันเรื่อยไป
[C]ถึงแม้ตัวฉันต้องเสียใจ [D]แต่ใจยังยอมรับฟัง
[G]ความรักไม่ใช่การแย่งชิง [Em]หากรักจริงต้องปล่อยวาง
[C]ขอให้ความรักนำทาง [D]สู่ฝันที่เธอรอ
{eov}

{c: Outro}
[C] [D] [G]`
  },
  {
    id: 'ru-doo-ron',
    slug: 'ru-doo-ron',
    title: 'ฤดูร้อน',
    artist: 'Paradox',
    artistId: 'paradox',
    album: 'Summer',
    originalKey: 'A',
    defaultCapo: 0,
    tempo: 125,
    timeSignature: '4/4',
    strumming: 'ลง - ลง - ขึ้น - ลง - ขึ้น',
    chordsUsed: ['A', 'C#m', 'D', 'E', 'F#m', 'Bm'],
    tags: ['ร็อค', 'อินดี้', 'เพลงหน้าร้อน', 'เพลงฮิต'],
    difficulty: 'medium',
    viewCount: 28940,
    status: 'published',
    createdBy: 'system',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    chordpro: `{c: Intro}
[A] [C#m] [D] [E] (2 times)

{sov: Verse 1}
[A] บาดแผลคราวนี้ช่างลึกเกินทน [C#m]
จะทนรับมันได้นานสักเท่าไร [D]
เมื่อความรักพังทลาย [E] จากไป
{eov}

{soc: Chorus}
[A]ยืนมองท้องฟ้าไม่เป็นเช่นเคย [C#m]
ฤดูร้อนไม่มีเธอเหมือนก่อน [D]
วันที่เคยรักกัน [E] กลับกลายเป็นความช้ำ
[F#m]ปล่อยให้น้ำตา [C#m] ไหลรินร่วงโรย
[D] ลืมเรื่องราวในอดีต [E] ที่เคยมี
{eoc}

{sov: Verse 2}
[A] สายลมพัดผ่านพาความหลังกลับมา [C#m]
แววตาคู่นั้นยังคงชัดเจน [D]
และยังคิดถึงเธอเสมอ [E] ไม่เคยลืม
{eov}`
  },
  {
    id: 'wat-jai',
    slug: 'wat-jai',
    title: 'วัดใจ',
    artist: 'Silly Fools',
    artistId: 'silly-fools',
    album: 'Juicy',
    originalKey: 'Em',
    defaultCapo: 0,
    tempo: 138,
    timeSignature: '4/4',
    strumming: 'ลง - ลง - ลง - ขึ้น - ลง - ขึ้น',
    chordsUsed: ['Em', 'C', 'D', 'G', 'Bm', 'Am'],
    tags: ['ร็อค', 'ปลุกพลัง', 'เพลงฮิตยุค 2000'],
    difficulty: 'medium',
    viewCount: 39500,
    status: 'published',
    createdBy: 'system',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    chordpro: `{c: Intro}
[Em] [C] [D] [G] [Bm]

{sov: Verse 1}
[Em] มีจริงไหมใครสักคน [C] ที่เข้าใจ
[D] พร้อมจะยืนเคียงข้างกัน [G] ไม่เปลี่ยนไป
[Em] ทางข้างหน้าจะมืดมน [C] สักเท่าใด
[D] ไม่เคยหวั่นไหว [Em] ก้าวไปด้วยกัน
{eov}

{soc: Chorus}
[C] มีเพียงใจเท่านั้น [D] ที่พร้อมจะวัดดู
[Bm] สู้จนหยดสุดท้าย [Em] ไม่ยอมแพ้ใคร
[Am] หากว่าใจดวงนี้ [D] ยังคงเต้นอยู่
[C] จะพิสูจน์ให้รู้ [D] ว่าใครคือตัวจริง [Em]
{eoc}`
  },
  {
    id: 'dept-17',
    slug: '17',
    title: '17',
    artist: 'Dept',
    artistId: 'dept',
    album: 'Single',
    originalKey: 'C',
    defaultCapo: 0,
    tempo: 110,
    timeSignature: '4/4',
    strumming: 'ลง - ลง - ขึ้น - ขึ้น - ลง',
    chordsUsed: ['C', 'Em', 'F', 'G', 'Dm', 'Am'],
    tags: ['อินดี้ป็อป', 'วัยรุ่น', 'รักสดใส'],
    difficulty: 'easy',
    viewCount: 18200,
    status: 'published',
    createdBy: 'system',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    chordpro: `{c: Intro}
[C] [Em] [F] [G]

{sov: Verse 1}
[C] ย้อนเวลากลับไปตอนอายุ 17 [Em]
ตอนที่ความรักยังเป็นแค่เรื่องง่ายๆ [F]
ไม่ต้องคิดอะไรให้มากมาย [G]
แค่อยากเจอเธอทุกวัน
{eov}

{soc: Chorus}
[F]ถ้าหากวันนั้นฉันบอกรัก [G]
[Em]เธอจะยังอยู่ข้างฉันไหม [Am]
[Dm]คำถามที่ค้างคาในใจ [G]
[C]ตั้งแต่ตอนอายุสิบเจ็ด [C7]
{eoc}`
  }
];

async function seed() {
  console.log('🌱 Starting Firestore seed for project:', sa.project_id);
  const batch = db.batch();

  for (const song of SONGS) {
    const ref = db.collection('songs').doc(song.id);
    batch.set(ref, song, { merge: true });
    console.log(`  + Prepared: ${song.title} (${song.id})`);
  }

  await batch.commit();
  console.log('✅ Seed completed successfully! All 4 songs written to Firestore.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
