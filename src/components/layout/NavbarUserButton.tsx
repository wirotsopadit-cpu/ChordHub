'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { User as UserIcon, LogIn } from 'lucide-react';

interface MemberState {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export default function NavbarUserButton() {
  const [member, setMember] = useState<MemberState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Check Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user && user.email) {
        setMember({
          uid: user.uid,
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL || undefined,
        });
      } else {
        // Fallback: check local storage Gmail user
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
      setIsReady(true);
    });

    // Listen to local storage changes
    const handleStorageChange = () => {
      const saved = localStorage.getItem('chordhub_gmail_user');
      if (saved) {
        try {
          setMember(JSON.parse(saved));
        } catch {}
      } else if (!auth.currentUser) {
        setMember(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!isReady) {
    return <div className="h-8 w-20 rounded-xl bg-zinc-800/40 animate-pulse" />;
  }

  if (member) {
    return (
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:border-emerald-500/50 hover:bg-zinc-800 transition active:scale-95 group shadow-sm"
        title="เปิดหน้าโปรไฟล์ของคุณ"
      >
        {member.photoURL ? (
          <img
            src={member.photoURL}
            alt={member.displayName}
            className="h-6 w-6 rounded-full object-cover border border-emerald-500/40"
          />
        ) : (
          <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 font-bold text-[11px] text-zinc-950 shadow">
            {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
        <span className="max-w-[80px] sm:max-w-[110px] truncate group-hover:text-emerald-400">
          {member.displayName}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-emerald-500 hover:text-emerald-400 hover:bg-zinc-800/80 transition active:scale-95 shadow-sm"
    >
      <LogIn size={13} />
      <span>เข้าสู่ระบบ</span>
    </Link>
  );
}
