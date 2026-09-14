import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Prompt, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import NavbarUserButton from '@/components/layout/NavbarUserButton';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-thai',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    template: '%s | ChordHub',
    default: 'ChordHub - ศูนย์รวมคอร์ดเพลงไทย คอร์ดกีตาร์ พร้อมคีย์และคาโป',
  },
  description: 'ค้นหาคอร์ดเพลงไทย คอร์ดกีตาร์ง่ายๆ ปรับคีย์ได้ เลื่อนหน้าจออัตโนมัติ ดูตารางจับคอร์ดฟรี',
  keywords: ['คอร์ดเพลง', 'คอร์ดกีตาร์', 'เนื้อเพลง', 'คอร์ดเพลงใหม่', 'ตารางคอร์ด', 'ChordHub'],
  authors: [{ name: 'ChordHub Team' }],
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable} ${jetbrainsMono.variable} dark scroll-smooth`}>
      <body className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60 no-print">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-mono font-bold text-zinc-950 transition group-hover:scale-105">
                🎸
              </span>
              <span className="font-bold tracking-tight text-lg sm:text-xl text-zinc-100">
                Chord<span className="text-emerald-400">Hub</span>
              </span>
            </Link>

            <nav className="flex items-center gap-3 sm:gap-4 text-sm font-medium text-zinc-400">
              <Link href="/" className="hover:text-emerald-400 transition">หน้าแรก</Link>
              <Link href="/search" className="hover:text-emerald-400 transition flex items-center gap-1">
                <span>ค้นหาเพลง</span>
              </Link>
              <Link href="/#popular" className="hover:text-emerald-400 transition hidden sm:inline">เพลงฮิต</Link>
              <Link href="/#chords" className="hover:text-emerald-400 transition hidden sm:inline">ตารางคอร์ด</Link>

              <NavbarUserButton />
            </nav>
          </div>
        </header>

        <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
          <div className="flex-1">{children}</div>

          <footer className="border-t border-zinc-900 bg-zinc-950/50 py-8 text-center text-xs text-zinc-600 no-print">
            <div className="mx-auto max-w-5xl px-4">
              <p>© {new Date().getFullYear()} ChordHub. All rights reserved. ศูนย์รวมคอร์ดเพลงไทยและสากล</p>
              <p className="mt-1 text-zinc-500">สร้างด้วย Next.js และ Tailwind CSS</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
