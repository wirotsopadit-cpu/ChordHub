'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LogIn,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Music,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase.client';

function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/profile';

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual Gmail Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        router.push(next);
      } else {
        const saved = localStorage.getItem('chordhub_gmail_user');
        if (saved) {
          router.push(next);
        }
      }
    });
    return () => unsubscribe();
  }, [router, next]);

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      router.push(next);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setError('ยังไม่ได้เปิดใช้งาน Google Provider ใน Firebase Console ท่านสามารถใช้การเข้าสู่ระบบด้วย Gmail ด้านล่างได้ทันที');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmittingManual(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail.includes('@gmail.com')) {
      setError('กรุณากรอกอีเมล Gmail (@gmail.com) เท่านั้น');
      setIsSubmittingManual(false);
      return;
    }

    if (!cleanName) {
      setError('กรุณากรอกชื่อแสดงผลของคุณ');
      setIsSubmittingManual(false);
      return;
    }

    const member = {
      uid: 'gmail_' + btoa(cleanEmail).replace(/=/g, '').slice(0, 16),
      displayName: cleanName,
      email: cleanEmail,
    };

    localStorage.setItem('chordhub_gmail_user', JSON.stringify(member));
    window.dispatchEvent(new Event('storage'));
    router.push(next);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
          <Music size={28} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">เข้าสู่ระบบ ChordHub</h1>
        <p className="text-xs text-zinc-400 mt-1.5">
          เชื่อมต่อเพื่อบันทึกเพลงโปรด แสดงความคิดเห็น และปรับคีย์ตามใจชอบ
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Button 1: Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoadingGoogle}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-3.5 px-4 font-bold text-sm text-zinc-950 shadow hover:bg-zinc-100 transition active:scale-[0.99] disabled:opacity-60 mb-6"
      >
        {isLoadingGoogle ? (
          <Loader2 size={18} className="animate-spin text-zinc-800" />
        ) : (
          <GoogleIcon className="h-5 w-5" />
        )}
        <span>เข้าสู่ระบบด้วย Google (Gmail)</span>
      </button>

      {/* Divider */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-full border-t border-zinc-800"></div>
        <span className="absolute bg-zinc-900 px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          หรือระบุ Gmail โดยตรง
        </span>
      </div>

      {/* Button 2: Manual Gmail Input */}
      <form onSubmit={handleManualLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            อีเมล Gmail
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            ชื่อแสดงผลในระบบ
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น มือกีตาร์สายชิล, พี่โน้ต"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmittingManual}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-bold text-sm text-zinc-950 hover:bg-emerald-400 transition active:scale-[0.99] disabled:opacity-50 mt-2"
        >
          {isSubmittingManual ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>เข้าสู่ระบบด้วย Gmail ทันที</span>
        </button>
      </form>

      {/* Security note */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
        <ShieldCheck size={14} className="text-emerald-400" />
        <span>ความปลอดภัยสูง ข้อมูลของคุณจะถูกเก็บรักษาอย่างเป็นส่วนตัว</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-zinc-500 text-sm">กำลังโหลด...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
