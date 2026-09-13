import { getAllSongs } from '@/lib/songs.server';
import { Sparkles } from 'lucide-react';
import HomeSearch from '@/components/home/HomeSearch';
import PopularChordsSection from '@/components/home/PopularChordsSection';

export default async function HomePage() {
  const songs = await getAllSongs();

  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800/60 bg-radial-[at_50%_0%] from-emerald-950/30 via-zinc-950 to-zinc-950 px-4 pt-16 pb-14 text-center sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-6">
            <Sparkles size={14} />
            <span>ปรับคีย์ได้ · คาโป · เลื่อนหน้าจออัตโนมัติ</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            คอร์ดเพลงไทย <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">เล่นง่าย ถูกต้อง</span> ทุกคีย์
          </h1>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            ศูนย์รวมคอร์ดกีตาร์ คอร์ดอูคูเลเล่ เพลงใหม่ เพลงฮิต พร้อมระบบเปลี่ยนคีย์และตารางจับคอร์ดฟรี
          </p>

          <div className="mt-8">
            <HomeSearch initialSongs={songs} />
          </div>
        </div>
      </section>

      {/* Interactive Popular Chords & Features Section */}
      <PopularChordsSection />
    </main>
  );
}
