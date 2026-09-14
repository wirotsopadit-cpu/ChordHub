import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSongBySlug, getRelatedSongs, getPopularSlugs } from '@/lib/songs.server';
import SongView from '@/components/song/SongView';
import CommentSection from '@/components/song/CommentSection';

// ISR: re-generate ทุก 1 ชั่วโมง
export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

/* ── Pre-render เพลงยอดนิยม 200 เพลงตอน build ── */
export async function generateStaticParams() {
  const slugs = await getPopularSlugs(200);
  return slugs.map(slug => ({ slug }));
}

/* ── SEO Metadata ── */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const song = (await getSongBySlug(decoded)) || (await getSongBySlug(slug));

  if (!song) {
    return { title: 'ไม่พบเพลงที่ค้นหา', robots: { index: false } };
  }

  const title = `คอร์ดเพลง ${song.title} - ${song.artist}`;
  const description =
    `คอร์ดกีตาร์เพลง ${song.title} ของ ${song.artist} ` +
    `คีย์ ${song.originalKey}${song.defaultCapo ? ` (คาโป ${song.defaultCapo})` : ''} ` +
    `คอร์ด: ${song.chordsUsed.slice(0, 6).join(' ')} พร้อมปรับคีย์ขึ้น-ลงได้ทันที`;

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/song/${song.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      `คอร์ด${song.title}`, `คอร์ดเพลง ${song.title}`,
      song.artist, ...song.tags,
    ],
    openGraph: {
      title, description, url,
      type: 'article',
      siteName: 'ChordHub',
      locale: 'th_TH',
      images: [{ url: `/api/og?slug=${song.slug}`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/* ── Page ── */
export default async function SongPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const song = (await getSongBySlug(decoded)) || (await getSongBySlug(slug));
  if (!song) notFound();

  const related = await getRelatedSongs(song.artistId, song.id);

  /* JSON-LD สำหรับ Google Rich Result */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    name: song.title,
    composer: { '@type': 'MusicGroup', name: song.artist },
    musicalKey: song.originalKey,
    inLanguage: 'th',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/song/${song.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-dvh bg-zinc-950 text-zinc-100">
        {/* Breadcrumb */}
        <nav
          aria-label="breadcrumb"
          className="mx-auto max-w-4xl px-4 pt-4 text-xs text-zinc-500"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-emerald-400">หน้าแรก</Link></li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/artist/${song.artistId}`} className="hover:text-emerald-400">
                {song.artist}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="truncate text-zinc-300">{song.title}</li>
          </ol>
        </nav>

        {/* ส่วน interactive ทั้งหมด */}
        <SongView song={song} />

        {/* ระบบแสดงความคิดเห็น ตอบกลับ และกดถูกใจ (Streamed Progressive Hydration) */}
        <Suspense
          fallback={
            <div className="mx-auto max-w-4xl px-4 py-8">
              <div className="h-36 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 animate-pulse" />
            </div>
          }
        >
          <CommentSection songId={song.id} songSlug={song.slug} songTitle={song.title} />
        </Suspense>

        {/* เพลงอื่นของศิลปิน */}
        {related.length > 0 && (
          <section className="mx-auto max-w-4xl px-4 pb-32 pt-8">
            <h2 className="mb-4 text-lg font-bold">เพลงอื่นของ {song.artist}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {related.map(s => (
                <li key={s.id}>
                  <Link
                    href={`/song/${s.slug}`}
                    className="flex items-center justify-between rounded-xl border
                               border-zinc-800 bg-zinc-900/50 px-4 py-3
                               transition hover:border-emerald-500/50 hover:bg-zinc-900"
                  >
                    <span className="truncate text-sm">{s.title}</span>
                    <span className="ml-3 shrink-0 rounded-md bg-zinc-800 px-2 py-0.5
                                     font-mono text-xs text-emerald-400">
                      {s.originalKey}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}