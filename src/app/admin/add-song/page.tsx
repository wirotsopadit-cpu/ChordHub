'use client';

import { useState, useTransition, useRef, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ShieldAlert,
  LogIn,
  Save,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import YoutubeIcon from '@/components/icons/YoutubeIcon';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import ChordSheet from '@/components/song/ChordSheet';
import { transposeKey } from '@/lib/chords';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';
import {
  createSong,
  updateSongAction,
  getSongForEditAction,
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

interface MemberState {
  uid: string;
  displayName: string;
  email: string;
}

/** Extract unique chords from ChordPro text */
function extractChordsFromText(text: string): string[] {
  const matches = text.match(/\[([A-G][#b]?[^\]]*)\]/g);
  if (!matches) return [];
  const unique = new Set(matches.map(m => m.slice(1, -1).trim()));
  return Array.from(unique);
}

function AddSongForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get('edit');
  const isEditMode = Boolean(editSlug);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Member Auth State
  const [member, setMember] = useState<MemberState | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [isLoadingSongData, setIsLoadingSongData] = useState(isEditMode);

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
    youtubeUrl: '',
    coverImage: '',
  });

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user && user.email) {
        setMember({
          uid: user.uid,
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email,
        });
      } else {
        const saved = localStorage.getItem('chordhub_gmail_user');
        if (saved) {
          try {
            setMember(JSON.parse(saved));
          } catch {
            setMember(null);
          }
        } else {
          setMember(null);
        }
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch song data if in edit mode
  useEffect(() => {
    if (!editSlug || !member) return;

    async function loadSongForEdit() {
      setIsLoadingSongData(true);
      try {
        const res = await getSongForEditAction(editSlug!, member!.uid);
        if (res.ok && res.song) {
          if (!res.isOwner) {
            setIsPermissionDenied(true);
            setError('คุณไม่มีสิทธิ์แก้ไขเพลงนี้ เนื่องจากไม่ใช่เจ้าของเพลง');
          } else {
            const s = res.song;
            setForm({
              title: s.title,
              artist: s.artist,
              originalKey: s.originalKey,
              defaultCapo: s.defaultCapo || 0,
              tempo: s.tempo?.toString() || '',
              strumming: s.strumming || 'ลง - ลง - ขึ้น - ขึ้น - ลง - ขึ้น',
              difficulty: s.difficulty || 'easy',
              tags: Array.isArray(s.tags) ? s.tags.join(', ') : 'เพลงฮิต',
              slug: s.slug,
              chordpro: s.chordpro,
              youtubeUrl: s.youtubeId ? `https://www.youtube.com/watch?v=${s.youtubeId}` : '',
              coverImage: s.coverImage || '',
            });
          }
        } else {
          setError(res.error || 'ไม่พบเพลงที่ต้องการแก้ไข');
        }
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลเพลง');
      } finally {
        setIsLoadingSongData(false);
      }
    }

    loadSongForEdit();
  }, [editSlug, member]);

  // Derived: detected chords
  const detectedChords = useMemo(() => extractChordsFromText(form.chordpro), [form.chordpro]);

  // Derived: detected YouTube ID and effective cover thumbnail
  const detectedYtId = useMemo(() => extractYouTubeId(form.youtubeUrl), [form.youtubeUrl]);
  const activeCoverPreview = form.coverImage?.trim() || (detectedYtId ? getYouTubeThumbnail(detectedYtId, 'hq') : null);

  // Current transposed key in preview
  const currentPreviewKey = useMemo(() => {
    return transposeKey(form.originalKey || 'C', previewSemitones);
  }, [form.originalKey, previewSemitones]);

  // Auto-scroll logic inside the preview container
  useEffect(() => {
    if (isAutoScrolling && previewContainerRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (previewContainerRef.current) {
          previewContainerRef.current.scrollTop += scrollSpeed * 0.8;
          const { scrollTop, scrollHeight, clientHeight } = previewContainerRef.current;
          if (scrollTop + clientHeight >= scrollHeight - 2) {
            setIsAutoScrolling(false);
          }
        }
      }, 50);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isAutoScrolling, scrollSpeed]);

  // AI Gemini Generate
  const handleAiGenerate = async () => {
    if (!aiQuery.trim()) return;
    setIsAiGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await aiGenerateChordsAction(aiQuery.trim());
      if (res.ok && res.content) {
        setForm(prev => ({
          ...prev,
          title: res.title || prev.title,
          artist: res.artist || prev.artist,
          originalKey: res.key || prev.originalKey,
          chordpro: res.content!,
        }));
        setPreviewSemitones(0);
        setNotice(`สร้างโครงสร้างคอร์ดด้วย AI สำเร็จ: ${res.title} (${res.key})`);
      } else {
        setError(res.error || 'ไม่สามารถดึงข้อมูลคอร์ดด้วย AI ได้');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // AI Harmonize lyrics
  const handleAiHarmonize = async () => {
    if (!form.chordpro.trim()) return;
    setIsHarmonizing(true);
    setError(null);
    setNotice(null);
    try {
      const hint = `${form.title || 'เพลง'} โดย ${form.artist || 'ศิลปิน'}`;
      const res = await aiHarmonizeLyricsAction(form.chordpro, hint);
      if (res.ok && res.content) {
        setForm(prev => ({ ...prev, chordpro: res.content! }));
        setNotice('จับคู่คอร์ดลงบนเนื้อร้องด้วย AI เรียบร้อยแล้ว');
      } else {
        setError(res.error || 'ไม่สามารถจับคู่คอร์ดได้');
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
      const res = await fetchSongFromUrlAction(scrapeUrl.trim());
      if (res.ok && res.data) {
        setForm(prev => ({
          ...prev,
          title: res.data!.title || prev.title,
          artist: res.data!.artist || prev.artist,
          originalKey: res.data!.originalKey || prev.originalKey,
          defaultCapo: res.data!.defaultCapo ?? prev.defaultCapo,
          tags: Array.isArray(res.data!.tags) ? res.data!.tags.join(', ') : prev.tags,
          chordpro: res.data!.chordpro || prev.chordpro,
        }));
        setPreviewSemitones(0);
        setNotice(`ดึงข้อมูลเพลง "${res.data!.title}" สำเร็จ!`);
        setScrapeUrl('');
      } else {
        setError(res.error || 'ไม่สามารถดึงข้อมูลจาก URL นี้ได้');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
    } finally {
      setIsScraping(false);
    }
  };

  // Convert Tab to ChordPro
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

  // Submit Form (Create or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) {
      setError('กรุณาเข้าสู่ระบบก่อนดำเนินการ');
      return;
    }
    setError(null);

    startTransition(async () => {
      if (isEditMode && editSlug) {
        // Update Song
        const res = await updateSongAction(
          editSlug,
          {
            title: form.title,
            artist: form.artist,
            originalKey: form.originalKey,
            defaultCapo: Number(form.defaultCapo),
            tempo: form.tempo ? Number(form.tempo) : undefined,
            strumming: form.strumming,
            difficulty: form.difficulty,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            chordpro: form.chordpro,
            youtubeUrl: form.youtubeUrl,
            coverImage: form.coverImage,
          },
          member.uid
        );

        if (!res.ok) {
          setError(res.error || 'เกิดข้อผิดพลาดในการแก้ไข');
        } else {
          setSuccessSlug(editSlug);
          setTimeout(() => { router.push(`/song/${editSlug}`); }, 1000);
        }
      } else {
        // Create Song
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
          youtubeUrl: form.youtubeUrl,
          coverImage: form.coverImage,
          createdBy: member.uid,
          createdByName: member.displayName,
        });

        if (!res.ok) {
          setError(res.error || 'เกิดข้อผิดพลาดในการบันทึก');
        } else {
          setSuccessSlug(res.slug || null);
          setTimeout(() => { router.push(`/song/${res.slug}`); }, 1200);
        }
      }
    });
  };

  const insertTag = (snippet: string) => {
    setForm(prev => ({ ...prev, chordpro: prev.chordpro + snippet }));
  };

  // 1. Loading Auth State
  if (isAuthChecking || isLoadingSongData) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-emerald-400" size={26} />
      </main>
    );
  }

  // 2. Member Only Guard
  if (!member) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">เฉพาะสมาชิกเท่านั้น</h1>
          <p className="text-xs text-zinc-400 mt-2 mb-6 leading-relaxed">
            ระบบเพิ่มและแก้ไขคอร์ดเพลงเปิดให้ใช้งานสำหรับสมาชิก ChordHub เท่านั้น
            กรุณาเข้าสู่ระบบด้วย Google หรือ Gmail เพื่อดำเนินการ
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(isEditMode ? `/admin/add-song?edit=${editSlug}` : '/admin/add-song')}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 font-bold text-sm text-zinc-950 hover:bg-emerald-400 transition active:scale-95 shadow"
          >
            <LogIn size={16} />
            <span>เข้าสู่ระบบเพื่อเพิ่มเพลง</span>
          </Link>
        </div>
      </main>
    );
  }

  // 3. Permission Denied (Not Owner in Edit Mode)
  if (isPermissionDenied) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">ไม่มีสิทธิ์แก้ไขเพลงนี้</h1>
          <p className="text-xs text-zinc-400 mt-2 mb-6">
            คุณสามารถดูคอร์ดเพลงได้ตามปกติ แต่เฉพาะผู้ที่เพิ่มเพลงนี้เข้ามาเท่านั้นที่มีสิทธิ์แก้ไขหรือลบเพลง
          </p>
          <Link
            href={`/song/${editSlug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
          >
            <ArrowLeft size={14} />
            <span>กลับไปหน้ารายละเอียดเพลง</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
      {/* ═══ TOP HEADER BAR ═══ */}
      <header className="no-print border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/20"
              title="กลับไปหน้าโปรไฟล์"
            >
              <Music size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {isEditMode ? `แก้ไขเพลง: ${form.title || editSlug}` : 'Chord & Lyrics Studio'}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {isEditMode ? 'Edit Mode' : 'AI Pro'}
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                {isEditMode ? 'แก้ไขคอร์ดและข้อมูลเพลงของคุณ' : 'ระบบสร้าง แปลงคีย์ และจัดการคอร์ดเพลงสำหรับสมาชิก'}
              </p>
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
      {!isEditMode && (
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
              onClick={handleAiGenerate}
              disabled={isAiGenerating || !aiQuery.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {isAiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>{isAiGenerating ? 'AI กำลังค้นหา...' : 'ดึงโครงสร้างคอร์ดด้วย AI'}</span>
            </button>
          </div>
        </section>
      )}

      {/* ═══ STUDIO QUICK CONTROL BAR ═══ */}
      <section className="no-print bg-zinc-900/80 border-b border-zinc-800 px-4 lg:px-8 py-2.5 sticky top-[69px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Key & Transpose Controls */}
          <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
            <span className="text-zinc-400">คีย์ต้นฉบับ: <b className="text-emerald-400 font-mono">{form.originalKey}</b></span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">คีย์ปัจจุบัน: <b className="text-indigo-400 font-mono text-sm">{currentPreviewKey}</b></span>
            <button
              type="button"
              onClick={() => setPreviewSemitones(prev => prev - 1)}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-300"
              title="ลดคีย์ (-1)"
            >
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              onClick={() => setPreviewSemitones(0)}
              className="px-1.5 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-[10px] text-zinc-300 font-mono"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setPreviewSemitones(prev => prev + 1)}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-300"
              title="เพิ่มคีย์ (+1)"
            >
              <ChevronUp size={14} />
            </button>
          </div>

          {/* Capo recommendation */}
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
            <Guitar size={13} className="text-amber-400" />
            <span className="text-zinc-400">Capo แนะนำ:</span>
            <span className="font-mono text-amber-400 font-semibold">
              {form.defaultCapo > 0 ? `ช่อง ${form.defaultCapo}` : 'ไม่ใช้'}
            </span>
          </div>

          {/* Font size */}
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
            <Type size={13} className="text-zinc-400" />
            <button type="button" onClick={() => setPreviewFontSize(p => Math.max(12, p - 1))} className="p-0.5 hover:text-white">
              <Minus size={11} />
            </button>
            <span className="font-mono text-zinc-300 px-1">{previewFontSize}px</span>
            <button type="button" onClick={() => setPreviewFontSize(p => Math.min(24, p + 1))} className="p-0.5 hover:text-white">
              <Plus size={11} />
            </button>
          </div>

          {/* Auto scroll */}
          <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
            <button
              type="button"
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`flex items-center gap-1 text-xs font-semibold ${isAutoScrolling ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
            >
              {isAutoScrolling ? <Pause size={13} /> : <Play size={13} />}
              <span>เลื่อนอัตโนมัติ</span>
            </button>
            <input
              type="range"
              min="1"
              max="5"
              value={scrollSpeed}
              onChange={e => setScrollSpeed(Number(e.target.value))}
              className="w-16 accent-emerald-500 h-1 cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* ═══ NOTICES / ALERTS ═══ */}
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 mt-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* ═══ MAIN STUDIO WORKSPACE (SPLIT 2 COLUMNS) ═══ */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ LEFT COLUMN: INPUT / SEARCH / FORM ═══ */}
        <div className="flex flex-col gap-6">
          {!isEditMode && (
            <>
              {/* Online Web Search Accordion/Card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={16} className="text-emerald-400" />
                  <h3 className="font-bold text-sm text-zinc-100">ค้นหาเพลงสดจากอินเทอร์เน็ต (Live Web Search)</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3">พิมพ์ชื่อเพลงหรือศิลปินใดก็ได้ เพื่อค้นหาและดึงคอร์ดจากอินเทอร์เน็ตสด</p>
                <form onSubmit={handleSearchOnline} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="พิมพ์ชื่อเพลง หรือ ศิลปิน..."
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingOnline || !searchQuery.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition disabled:opacity-50 shadow"
                  >
                    {isSearchingOnline ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>ค้นหาในเน็ต</span>
                  </button>
                </form>

                {/* Online search results */}
                {onlineResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {onlineResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-zinc-950 p-2.5 border border-zinc-800 hover:border-zinc-700 text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-zinc-200 truncate">{r.title}</p>
                          <p className="text-zinc-500 text-[11px] truncate">{r.artist} {r.originalKey ? `• คีย์ ${r.originalKey}` : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectOnlineSong(r)}
                          disabled={loadingItemUrl === r.sourceUrl}
                          className="flex items-center gap-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold hover:bg-emerald-500 hover:text-zinc-950 transition shrink-0"
                        >
                          {loadingItemUrl === r.sourceUrl ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                          <span>เลือกเพลงนี้</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrape from URL Card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon size={16} className="text-sky-400" />
                  <h3 className="font-bold text-sm text-zinc-100">ดึงคอร์ดจากลิงก์เว็บโดยตรง (Web URL)</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3">วางลิงก์หน้าคอร์ดเพลงจากเว็บใดก็ได้ ระบบจะสกัดเนื้อร้องและคอร์ดให้อัตโนมัติ</p>
                <form onSubmit={handleScrapeFromUrl} className="flex gap-2">
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={e => setScrapeUrl(e.target.value)}
                    placeholder="https://www.musicatm.com/chord/..."
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isScraping || !scrapeUrl.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-sky-400 transition disabled:opacity-50 shadow"
                  >
                    {isScraping ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                    <span>ดึงข้อมูล</span>
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Core Song Meta & ChordPro Editor Form */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ชื่อเพลง *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="เช่น ใจนักเลง, วาฬเกยตื้น..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ชื่อศิลปิน *</label>
                <input
                  type="text"
                  required
                  value={form.artist}
                  onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                  placeholder="เช่น ใหม่ไทย หัวใจศิลป์..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">คีย์ต้นฉบับ</label>
                <select
                  value={form.originalKey}
                  onChange={e => setForm(f => ({ ...f, originalKey: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
                >
                  {['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B','Am','Bm','Cm','Dm','Em','Fm','Gm'].map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">คาโปเริ่มต้น</label>
                <select
                  value={form.defaultCapo}
                  onChange={e => setForm(f => ({ ...f, defaultCapo: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
                >
                  <option value={0}>ไม่ใช้</option>
                  {[1,2,3,4,5,6,7].map(c => (
                    <option key={c} value={c}>ช่อง {c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ความยาก</label>
                <select
                  value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as any }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
                >
                  <option value="easy">ง่าย</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="hard">ยาก</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">จังหวะตี (Strumming)</label>
                <input
                  type="text"
                  value={form.strumming}
                  onChange={e => setForm(f => ({ ...f, strumming: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">แท็กหมวดหมู่ (คั่นด้วยจุลภาค)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* ═══ YOUTUBE & COVER IMAGE SECTION ═══ */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-600/20 text-red-400">
                    <YoutubeIcon size={14} />
                  </span>
                  <h4 className="text-xs font-bold text-zinc-200">วิดีโอ YouTube & รูปภาพประกอบหน้าปก</h4>
                </div>
                {detectedYtId && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <Check size={10} /> พบรหัสวิดีโอ: {detectedYtId}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* YouTube Link */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>ลิงก์ YouTube (MV / คลิปเพลง)</span>
                    <span className="text-[10px] text-zinc-500 font-normal">แชร์ / URL / Shorts</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.youtubeUrl}
                      onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=... หรือ youtu.be/..."
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-red-500 placeholder-zinc-500 pr-8"
                    />
                    {form.youtubeUrl && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, youtubeUrl: '' }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    เมื่อใส่ลิงก์ YouTube ระบบจะดึงรูปหน้าปก Thumbnail มาใช้เป็นภาพประกอบเพลงให้อัตโนมัติ
                  </p>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>รูปภาพหน้าปกเพลง (Cover Image URL)</span>
                    <span className="text-[10px] text-zinc-500 font-normal">ใส่ URL เองหรือใช้จาก YouTube</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={form.coverImage}
                      onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                      placeholder={detectedYtId ? "ใช้รูปจาก YouTube Thumbnail อัตโนมัติ" : "https://... (รูปภาพหน้าปก)"}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500 placeholder-zinc-500 pr-8"
                    />
                    {form.coverImage && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, coverImage: '' }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  {detectedYtId && (
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, coverImage: getYouTubeThumbnail(detectedYtId, 'hq') }))}
                        className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        <ImageIcon size={10} /> คัดลอกรูปจาก YouTube มาใส่ช่องนี้
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Box if Thumbnail Available */}
              {activeCoverPreview && (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/90 p-2.5">
                  <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-black">
                    <img
                      src={activeCoverPreview}
                      alt="Cover Preview"
                      className="h-full w-full object-cover"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-zinc-300 truncate">
                      ตัวอย่างภาพหน้าปกและวิดีโอที่จะแสดงในระบบ
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {form.coverImage ? 'ใช้รูปกำหนดเอง' : 'ใช้ภาพ Thumbnail อัตโนมัติจาก YouTube'}
                    </p>
                    {detectedYtId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${detectedYtId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 hover:underline"
                      >
                        <ExternalLink size={10} /> ทดสอบเปิดดูคลิปบน YouTube
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ChordPro Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  เนื้อเพลงรูปแบบ ChordPro *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAiHarmonize}
                    disabled={isHarmonizing || !form.chordpro.trim()}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition disabled:opacity-50"
                  >
                    {isHarmonizing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    <span>จับคู่คอร์ด (AI)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConvertModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <Wand2 size={11} />
                    <span>แปลงจากเนื้อเพลงธรรมดา</span>
                  </button>
                </div>
              </div>

              {/* Tag Insertion Quick Chips */}
              <div className="flex flex-wrap gap-1 mb-2">
                {[
                  { label: '+ [Intro]', val: '\n{c: Intro}\n[C] [Em] [F] [G]\n' },
                  { label: '+ {soc: Chorus}', val: '\n{soc: Chorus}\n' },
                  { label: '+ {eoc}', val: '{eoc}\n' },
                  { label: '+ {sov: Verse}', val: '\n{sov: Verse 1}\n' },
                  { label: '+ {eov}', val: '{eov}\n' },
                  { label: '+ [C]', val: '[C]' },
                  { label: '+ [G]', val: '[G]' },
                  { label: '+ [Am]', val: '[Am]' },
                  { label: '+ [F]', val: '[F]' },
                  { label: '+ [D]', val: '[D]' },
                  { label: '+ [Em]', val: '[Em]' },
                  { label: '+ [Dm]', val: '[Dm]' },
                ].map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => insertTag(t.val)}
                    className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 hover:bg-zinc-700 hover:text-white transition"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={16}
                required
                value={form.chordpro}
                onChange={e => setForm(f => ({ ...f, chordpro: e.target.value }))}
                className="w-full font-mono text-xs leading-relaxed rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-zinc-100 outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                {isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isEditMode ? (
                  <Save size={18} />
                ) : (
                  <Plus size={18} />
                )}
                <span>
                  {isPending
                    ? 'กำลังบันทึก...'
                    : isEditMode
                    ? 'บันทึกการแก้ไขเพลง'
                    : 'บันทึกเพลงเข้าสู่ระบบ'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* ═══ RIGHT COLUMN: LIVE PREVIEW ═══ */}
        <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm overflow-hidden h-[850px]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-indigo-400" />
              <h3 className="font-bold text-sm text-zinc-100">Live Preview</h3>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {currentPreviewKey}
            </span>
          </div>

          {/* Preview Header */}
          <div className="mb-4 shrink-0">
            <h2 className="text-xl font-bold text-zinc-100">{form.title || 'ชื่อเพลง'}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{form.artist || 'ศิลปิน'}</p>

            {/* Detected Chords Display */}
            {detectedChords.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">คอร์ดที่ใช้:</span>
                {detectedChords.map((c, i) => (
                  <span
                    key={i}
                    className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400 border border-zinc-700/60"
                  >
                    {transposeKey(c, previewSemitones)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable ChordSheet Output */}
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-y-auto pr-2 rounded-xl bg-zinc-950/70 p-4 border border-zinc-800/80 shadow-inner"
          >
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

export default function AddSongPage() {
  return (
    <Suspense fallback={
      <main className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-emerald-400" size={26} />
      </main>
    }>
      <AddSongForm />
    </Suspense>
  );
}
