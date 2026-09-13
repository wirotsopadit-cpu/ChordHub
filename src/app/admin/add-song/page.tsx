'use client';

import { useState, useTransition, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Music,
  Plus,
  Eye,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Globe,
  Link as LinkIcon,
  Wand2,
  X,
  ExternalLink,
  Download,
  ChevronUp,
  ChevronDown,
  Type,
  Minus,
  Play,
  Pause,
  Sparkles,
  Printer,
  Guitar,
} from 'lucide-react';
import Link from 'next/link';
import ChordSheet from '@/components/song/ChordSheet';
import { transposeKey } from '@/lib/chords';
import {
  createSong,
  searchSongOnlineAction,
  fetchSongFromUrlAction,
  convertTabToChordProAction,
  aiGenerateChordsAction,
  aiHarmonizeLyricsAction,
} from '@/actions/song.actions';

const SAMPLE_CHORDPRO = `{c: Intro}
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
[C]ตั้งแต่ตอนอายุสิบเจ็ด
{eoc}`;

/** Extract unique chords from ChordPro text */
function extractChordsFromText(text: string): string[] {
  const matches = text.match(/\[([A-G][#b]?[^\]]*)\]/g);
  if (!matches) return [];
  const unique = new Set(matches.map(m => m.slice(1, -1).trim()));
  return Array.from(unique);
}

export default function AddSongPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Search Online States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingItemUrl, setLoadingItemUrl] = useState<string | null>(null);

  // AI Gemini Generate
  const [aiQuery, setAiQuery] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // URL Scraper States
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  // Smart Converter Modal State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [rawTabInput, setRawTabInput] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // AI Harmonize
  const [isHarmonizing, setIsHarmonizing] = useState(false);

  // Live Preview Controls
  const [previewSemitones, setPreviewSemitones] = useState(0);
  const [previewFontSize, setPreviewFontSize] = useState(16);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(3);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    artist: '',
    originalKey: 'C',
    defaultCapo: 0,
    tempo: '',
    strumming: 'ลง - ลง - ขึ้น - ขึ้น - ลง - ขึ้น',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    tags: 'เพลงฮิต, ป็อป',
    slug: '',
    chordpro: SAMPLE_CHORDPRO,
  });

  // Derived: detected chords
  const detectedChords = useMemo(() => extractChordsFromText(form.chordpro), [form.chordpro]);

  // Derived: current preview key
  const currentPreviewKey = useMemo(
    () => transposeKey(form.originalKey, previewSemitones),
    [form.originalKey, previewSemitones]
  );

  // Derived: capo recommendation
  const capoRecommendation = useMemo(() => {
    if (previewSemitones === 0) return 'ไม่ใช้';
    if (previewSemitones > 0) return `Fret ${previewSemitones}`;
    return `Fret ${12 + previewSemitones}`;
  }, [previewSemitones]);

  // Auto-scroll
  useEffect(() => {
    if (isAutoScrolling && previewContainerRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (previewContainerRef.current) {
          previewContainerRef.current.scrollBy({ top: scrollSpeed * 0.8, behavior: 'smooth' });
          const el = previewContainerRef.current;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
            setIsAutoScrolling(false);
          }
        }
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }
    return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); };
  }, [isAutoScrolling, scrollSpeed]);

  // AI Gemini Generate
  const handleAiGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = aiQuery.trim();
    if (!query) return;
    setIsAiGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const result = await aiGenerateChordsAction(query);
      if (result.ok && result.content) {
        setForm(prev => ({
          ...prev,
          title: result.title || query,
          artist: result.artist || prev.artist,
          originalKey: result.key || prev.originalKey,
          chordpro: result.content || prev.chordpro,
        }));
        setPreviewSemitones(0);
        setNotice(`🎵 ดึงคอร์ดเพลง "${result.title}" ด้วย AI สำเร็จ!`);
      } else {
        setError(result.error || 'ไม่สามารถสร้างคอร์ดด้วย AI ได้');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาดในการสร้างคอร์ดด้วย AI: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // AI Harmonize
  const handleAiHarmonize = async () => {
    if (!form.chordpro.trim()) return;
    setIsHarmonizing(true);
    setError(null);
    try {
      const songHint = `${form.title} ${form.artist}`.trim();
      const result = await aiHarmonizeLyricsAction(form.chordpro, songHint);
      if (result.ok && result.content) {
        setForm(prev => ({ ...prev, chordpro: result.content! }));
        setNotice('✨ จัดวางคอร์ดลงบนเนื้อเพลงเรียบร้อยแล้ว');
      } else {
        setError(result.error || 'ไม่สามารถจับคู่คอร์ดได้');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsHarmonizing(false);
    }
  };

  // Search Online
  const handleSearchOnline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingOnline(true);
    setError(null);
    setNotice(null);
    try {
      const results = await searchSongOnlineAction(searchQuery.trim());
      setOnlineResults(results);
      setHasSearched(true);
      if (results.length === 0) setError(`ไม่พบผลการค้นหาสำหรับ "${searchQuery}"`);
    } catch (err: any) {
      setError('ค้นหาเพลงออนไลน์ไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Select online song
  const handleSelectOnlineSong = async (song: any) => {
    setError(null);
    setNotice(null);
    if (song.chordpro) {
      setForm(prev => ({
        ...prev,
        title: song.title || prev.title,
        artist: song.artist || prev.artist,
        originalKey: song.originalKey || prev.originalKey,
        defaultCapo: song.defaultCapo ?? prev.defaultCapo,
        tags: Array.isArray(song.tags) ? song.tags.join(', ') : prev.tags,
        strumming: song.strumming || prev.strumming,
        chordpro: song.chordpro,
      }));
      setPreviewSemitones(0);
      setNotice(`นำเข้าเพลง "${song.title}" เรียบร้อยแล้ว`);
      setOnlineResults([]);
      setHasSearched(false);
      return;
    }
    if (song.sourceUrl) {
      setLoadingItemUrl(song.sourceUrl);
      try {
        const res = await fetchSongFromUrlAction(song.sourceUrl);
        if (res.ok && res.data) {
          setForm(prev => ({
            ...prev,
            title: res.data!.title || song.title || prev.title,
            artist: res.data!.artist || song.artist || prev.artist,
            originalKey: res.data!.originalKey || prev.originalKey,
            defaultCapo: res.data!.defaultCapo ?? prev.defaultCapo,
            tags: Array.isArray(res.data!.tags) ? res.data!.tags.join(', ') : prev.tags,
            chordpro: res.data!.chordpro || prev.chordpro,
          }));
          setPreviewSemitones(0);
          setNotice(`ดึงข้อมูลเพลง "${res.data!.title}" สำเร็จ!`);
          setOnlineResults([]);
          setHasSearched(false);
        } else {
          setError(res.error || 'ไม่สามารถสกัดคอร์ดจากเว็บนี้ได้');
        }
      } catch (err: any) {
        setError('เกิดข้อผิดพลาด: ' + err.message);
      } finally {
        setLoadingItemUrl(null);
      }
    }
  };

  // Scrape from URL
  const handleScrapeFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    setError(null);
    setNotice(null);
    try {
      const result = await fetchSongFromUrlAction(scrapeUrl.trim());
      if (result.ok && result.data) {
        setForm(prev => ({
          ...prev,
          title: result.data!.title || prev.title,
          artist: result.data!.artist || prev.artist,
          originalKey: result.data!.originalKey || prev.originalKey,
          tags: Array.isArray(result.data!.tags) ? result.data!.tags.join(', ') : prev.tags,
          chordpro: result.data!.chordpro || prev.chordpro,
        }));
        setPreviewSemitones(0);
        setNotice(`ดึงข้อมูลเพลง "${result.data!.title}" จาก URL เรียบร้อยแล้ว`);
        setScrapeUrl('');
      } else {
        setError(result.error || 'ไม่สามารถดึงข้อมูลเพลงจาก URL นี้ได้');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsScraping(false);
    }
  };

  // Convert Raw Tab
  const handleConvertRawTab = async () => {
    if (!rawTabInput.trim()) return;
    setIsConverting(true);
    try {
      const converted = await convertTabToChordProAction(rawTabInput);
      setForm(prev => ({ ...prev, chordpro: converted }));
      setIsConvertModalOpen(false);
      setRawTabInput('');
      setNotice('แปลงคอร์ด 2 บรรทัด เป็น ChordPro เรียบร้อยแล้ว');
    } catch (err: any) {
      setError('เกิดข้อผิดพลาดในการแปลงคอร์ด: ' + err.message);
    } finally {
      setIsConverting(false);
    }
  };

  // Submit to Firestore
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createSong({
        title: form.title,
        artist: form.artist,
        originalKey: form.originalKey,
        defaultCapo: Number(form.defaultCapo),
        tempo: form.tempo ? Number(form.tempo) : undefined,
        strumming: form.strumming,
        difficulty: form.difficulty,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        slug: form.slug ? form.slug.trim() : undefined,
        chordpro: form.chordpro,
      });
      if (!res.ok) {
        setError(res.error || 'เกิดข้อผิดพลาดในการบันทึก');
      } else {
        setSuccessSlug(res.slug || null);
        setTimeout(() => { router.push(`/song/${res.slug}`); }, 1200);
      }
    });
  };

  const insertTag = (snippet: string) => {
    setForm(prev => ({ ...prev, chordpro: prev.chordpro + snippet }));
  };

  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
      {/* ═══ TOP HEADER BAR ═══ */}
      <header className="no-print border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/20"
            >
              <Music size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Chord & Lyrics Studio
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI Pro</span>
              </h1>
              <p className="text-xs text-zinc-400">ระบบสร้าง แปลงคีย์ และจัดการคอร์ดเพลงสำหรับนักดนตรี</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => setIsConvertModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition">
              <Wand2 size={16} />
              <span className="hidden sm:inline">แปลง Tab → ChordPro</span>
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition">
              <Printer size={16} />
              <span className="hidden sm:inline">พิมพ์ / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ AI SEARCH BAR (Gemini) ═══ */}
      <section className="no-print bg-gradient-to-r from-indigo-950/40 via-zinc-900/60 to-sky-950/40 border-b border-zinc-800 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input
              type="text"
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAiGenerate(); }}
              placeholder="ค้นหาเพลงด้วย AI (เช่น ลมซ่อนรัก - Sin, เพลงสากล/เพลงไทยทั่วไป)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => handleAiGenerate()}
            disabled={isAiGenerating || !aiQuery.trim()}
            className="flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 font-medium text-sm text-white shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
          >
            {isAiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>{isAiGenerating ? 'กำลังวิเคราะห์คอร์ด...' : 'ดึงโครงสร้างคอร์ดด้วย AI'}</span>
          </button>
        </div>
      </section>

      {/* ═══ CONTROL TOOLBAR ═══ */}
      <div className="no-print bg-zinc-900 border-b border-zinc-800 px-4 lg:px-8 py-3 sticky top-[69px] z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
          {/* Key & Transpose */}
          <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/80">
            <span className="text-xs text-zinc-400 font-medium">คีย์ต้นฉบับ:</span>
            <span className="font-bold text-sky-400 font-mono">{form.originalKey}</span>
            <div className="h-4 w-px bg-zinc-700 mx-1" />
            <span className="text-xs text-zinc-400 font-medium">คีย์ปัจจุบัน:</span>
            <span className="font-bold text-indigo-400 font-mono text-base">{currentPreviewKey}</span>
            <div className="flex items-center ml-2 gap-1">
              <button type="button" onClick={() => setPreviewSemitones(s => (s - 1) % 12)} className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white flex items-center justify-center transition" title="ลดคีย์">
                <ChevronDown size={14} />
              </button>
              <button type="button" onClick={() => setPreviewSemitones(0)} className="px-2 h-7 rounded-lg bg-zinc-700/60 hover:bg-zinc-600 text-xs text-zinc-300 transition">Reset</button>
              <button type="button" onClick={() => setPreviewSemitones(s => (s + 1) % 12)} className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white flex items-center justify-center transition" title="เพิ่มคีย์">
                <ChevronUp size={14} />
              </button>
            </div>
          </div>

          {/* Capo */}
          <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/80">
            <Guitar size={14} className="text-amber-400" />
            <span className="text-xs text-zinc-400">Capo แนะนำ:</span>
            <span className="font-semibold text-amber-400 font-mono">{capoRecommendation}</span>
          </div>

          {/* Font Size & Auto Scroll */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/80">
              <Type size={13} className="text-zinc-400" />
              <button type="button" onClick={() => setPreviewFontSize(s => Math.max(12, s - 2))} className="w-6 h-6 rounded bg-zinc-700 hover:bg-zinc-600 text-xs font-bold flex items-center justify-center"><Minus size={10} /></button>
              <span className="text-xs font-mono text-zinc-300 px-1 min-w-[35px] text-center">{previewFontSize}px</span>
              <button type="button" onClick={() => setPreviewFontSize(s => Math.min(32, s + 2))} className="w-6 h-6 rounded bg-zinc-700 hover:bg-zinc-600 text-xs font-bold flex items-center justify-center"><Plus size={10} /></button>
            </div>
            <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/80">
              <button type="button" onClick={() => setIsAutoScrolling(v => !v)} className={`flex items-center gap-1 text-xs font-medium transition ${isAutoScrolling ? 'text-amber-400' : 'text-emerald-400 hover:text-emerald-300'}`}>
                {isAutoScrolling ? <Pause size={13} /> : <Play size={13} />}
                <span>{isAutoScrolling ? 'หยุดเลื่อน' : 'เลื่อนอัตโนมัติ'}</span>
              </button>
              <input type="range" min={1} max={10} value={scrollSpeed} onChange={e => setScrollSpeed(Number(e.target.value))} className="w-16 accent-emerald-500 cursor-pointer" title="ความเร็วการเลื่อน" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Notifications */}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400 animate-in fade-in">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto shrink-0 text-rose-400 hover:text-white"><X size={14} /></button>
            </div>
          )}
          {notice && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400 animate-in fade-in">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{notice}</span>
              <button onClick={() => setNotice(null)} className="ml-auto shrink-0 text-emerald-400 hover:text-white"><X size={14} /></button>
            </div>
          )}
          {successSlug && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
              <CheckCircle2 size={18} />
              <span>บันทึกเพลงเรียบร้อยแล้ว! กำลังนำท่านไปยังหน้าเพลง...</span>
            </div>
          )}

          {/* Internet Tools */}
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {/* Live Internet Search */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-zinc-900/90 to-emerald-950/20 p-5 shadow-lg">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                <Globe size={18} />
                <span>ค้นหาเพลงสดจากอินเทอร์เน็ต (Live Web Search)</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">พิมพ์ชื่อเพลงหรือศิลปินใดก็ได้ เพื่อค้นหาและดึงคอร์ดจากอินเทอร์เน็ตสด</p>
              <form onSubmit={handleSearchOnline} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="พิมพ์ชื่อเพลง หรือ ศิลปิน..." className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500" />
                </div>
                <button type="submit" disabled={isSearchingOnline} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition disabled:opacity-50">
                  {isSearchingOnline ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  <span>ค้นหาในเน็ต</span>
                </button>
              </form>
              {onlineResults.length > 0 && (
                <div className="mt-3 divide-y divide-zinc-800 rounded-xl border border-emerald-500/40 bg-zinc-900 p-2 shadow-xl max-h-80 overflow-y-auto">
                  <div className="text-[11px] font-bold text-emerald-400 px-2 py-1 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                    <span>พบ {onlineResults.length} รายการ:</span>
                    <button onClick={() => setOnlineResults([])} className="text-zinc-400 hover:text-white"><X size={14} /></button>
                  </div>
                  {onlineResults.map((s, idx) => {
                    const isLoadingThis = loadingItemUrl === s.sourceUrl;
                    return (
                      <div key={idx} className="px-3 py-2 hover:bg-zinc-800/80 rounded-lg flex items-center justify-between group transition gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 truncate">{s.title}</div>
                          <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span>{s.artist}</span>
                            {s.domain && <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.2 rounded">{s.domain}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {s.sourceUrl && <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-zinc-500 hover:text-zinc-300"><ExternalLink size={13} /></a>}
                          <button type="button" disabled={isLoadingThis || isSearchingOnline} onClick={() => handleSelectOnlineSong(s)} className="flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-zinc-950 transition active:scale-95 disabled:opacity-50">
                            {isLoadingThis ? <><Loader2 size={12} className="animate-spin" /> กำลังดึง...</> : <><Download size={12} /> ดึงลงฟอร์ม</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Web URL Scraper */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm mb-2">
                <LinkIcon size={18} className="text-cyan-400" />
                <span>ดึงคอร์ดจากลิงก์เว็บโดยตรง (Web URL)</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">วางลิงก์หน้าคอร์ดเพลงจากเว็บใดก็ได้ ระบบจะสกัดเนื้อร้องและคอร์ดให้อัตโนมัติ</p>
              <form onSubmit={handleScrapeFromUrl} className="flex gap-2">
                <input type="url" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="https://www.musicatm.com/chord/..." className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 pl-3.5 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500" />
                <button type="submit" disabled={isScraping} className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition disabled:opacity-50">
                  {isScraping ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                  <span>ดึงข้อมูล</span>
                </button>
              </form>
            </div>
          </div>

          {/* 2-Column: Form & Live Preview */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* LEFT: FORM */}
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ชื่อเพลง *</label>
                  <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="เช่น ใจนักเลง, วาฬเกยตื้น..." className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ชื่อศิลปิน *</label>
                  <input type="text" required value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })} placeholder="เช่น ไหมไทย หัวใจศิลป์..." className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">คีย์ต้นฉบับ</label>
                  <select value={form.originalKey} onChange={e => setForm({ ...form, originalKey: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none focus:border-emerald-500">
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B', 'Am', 'Em', 'Dm', 'Bm', 'F#m'].map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">คาโปเริ่มต้น</label>
                  <select value={form.defaultCapo} onChange={e => setForm({ ...form, defaultCapo: Number(e.target.value) })} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none focus:border-emerald-500">
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i} value={i}>{i === 0 ? 'ไม่ใช้' : `ช่อง ${i}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ความยาก</label>
                  <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as any })} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500">
                    <option value="easy">ง่าย</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="hard">ยาก</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">จังหวะตี (Strumming)</label>
                  <input type="text" value={form.strumming} onChange={e => setForm({ ...form, strumming: e.target.value })} placeholder="เช่น ลง - ลง - ขึ้น - ขึ้น - ลง" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">แท็กหมวดหมู่ (คั่นด้วยจุลภาค)</label>
                  <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="เช่น ลูกทุ่ง, เพื่อชีวิต" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">เนื้อเพลงรูปแบบ ChordPro *</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={handleAiHarmonize} disabled={isHarmonizing || !form.chordpro.trim()} className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition disabled:opacity-50">
                      {isHarmonizing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      <span>✨ จับคู่คอร์ด (AI)</span>
                    </button>
                    <button type="button" onClick={() => setIsConvertModalOpen(true)} className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1">
                      <Wand2 size={12} /> แปลงจากเนื้อเพลงธรรมดา
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['[Intro]\n', '{soc: Chorus}\n', '{eoc}\n', '{sov: Verse}\n', '{eov}\n', '[C]', '[G]', '[Am]', '[F]', '[D]', '[Em]', '[Dm]'].map((snip, i) => (
                    <button key={i} type="button" onClick={() => insertTag(snip)} className="rounded-md border border-zinc-800 bg-zinc-800/80 px-2 py-1 font-mono text-[11px] text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition">
                      + {snip.trim()}
                    </button>
                  ))}
                </div>
                <textarea required rows={14} value={form.chordpro} onChange={e => setForm({ ...form, chordpro: e.target.value })} className="w-full font-mono text-sm leading-relaxed rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100 outline-none focus:border-emerald-500 shadow-inner" />
              </div>

              <button type="submit" disabled={isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-bold text-zinc-950 hover:bg-emerald-400 transition active:scale-[0.99] disabled:opacity-50">
                {isPending ? <><Loader2 size={18} className="animate-spin" /> กำลังบันทึก...</> : <><Plus size={18} /> บันทึกเพลงเข้าสู่ระบบ</>}
              </button>
            </form>

            {/* RIGHT: LIVE PREVIEW */}
            <div className="sticky top-[140px] rounded-2xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-2xl">
              {/* Preview Header */}
              <div className="bg-zinc-900/90 border-b border-zinc-800 px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-emerald-400" />
                    <h3 className="font-bold text-sm text-zinc-200">Live Preview</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">{form.originalKey}</span>
                    {previewSemitones !== 0 && (
                      <>
                        <span className="text-zinc-500">→</span>
                        <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{currentPreviewKey}</span>
                      </>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-zinc-100">{form.title || 'ชื่อเพลง'}</h2>
                <p className="text-xs text-zinc-400 mt-0.5">{form.artist || 'ศิลปิน'}</p>
              </div>

              {/* Detected Chords Bar */}
              {detectedChords.length > 0 && (
                <div className="px-6 py-3 border-b border-zinc-800/60 bg-zinc-950/40">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mr-1">คอร์ดที่ใช้:</span>
                    {detectedChords.map((chord, i) => (
                      <span key={i} className="font-mono text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">{chord}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ChordSheet Preview */}
              <div ref={previewContainerRef} className="max-h-[550px] overflow-y-auto px-6 py-4 print-area">
                <ChordSheet
                  source={form.chordpro}
                  originalKey={form.originalKey}
                  semitones={previewSemitones}
                  capo={form.defaultCapo}
                  fontSize={previewFontSize}
                  showChords={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Tab to ChordPro Converter */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Wand2 size={20} className="text-emerald-400" />
                <h3 className="font-bold text-base text-zinc-100">เครื่องมือแปลงคอร์ด 2 บรรทัด เป็น ChordPro</h3>
              </div>
              <button onClick={() => setIsConvertModalOpen(false)} className="text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              คัดลอกเนื้อเพลงและคอร์ดธรรมดาจากเว็บเพลงต่างๆ มาวางในช่องนี้
              ระบบจะแปลงเป็นรูปแบบ <code className="text-emerald-400">[Chord]เนื้อร้อง</code> ให้อัตโนมัติ
            </p>
            <textarea
              rows={12}
              value={rawTabInput}
              onChange={e => setRawTabInput(e.target.value)}
              placeholder={`ตัวอย่างเช่น:\nC             Em\nย้อนเวลากลับไปตอนอายุ 17\nF             G\nตอนที่ความรักยังเป็นแค่เรื่องง่ายๆ`}
              className="w-full font-mono text-xs leading-relaxed rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-zinc-200 outline-none focus:border-emerald-500 shadow-inner mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setIsConvertModalOpen(false)} className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition">ยกเลิก</button>
              <button type="button" onClick={handleConvertRawTab} disabled={isConverting || !rawTabInput.trim()} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition disabled:opacity-50">
                {isConverting ? <><Loader2 size={14} className="animate-spin" /> กำลังแปลง...</> : <><Wand2 size={14} /> แปลงและใส่ลงฟอร์ม</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
