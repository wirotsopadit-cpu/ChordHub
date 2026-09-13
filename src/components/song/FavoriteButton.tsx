'use client';

import { useEffect, useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';

export default function FavoriteButton({
  songId, savedKey, savedCapo,
}: { songId: string; savedKey: string; savedCapo: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [fav, setFav] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      if (u) {
        setUser(u);
      } else {
        const saved = localStorage.getItem('chordhub_gmail_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setUser({ uid: parsed.uid } as any);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setFav(false); setReady(true); return; }
    (async () => {
      try {
        const ref = doc(db, 'users', user.uid, 'favorites', songId);
        const snap = await getDoc(ref);
        setFav(snap.exists());
      } catch (e) {
        console.error(e);
      }
      setReady(true);
    })();
  }, [user, songId]);

  const toggle = () => {
    if (!user) { window.location.href = `/login?next=/song/${songId}`; return; }

    start(async () => {
      try {
        const ref = doc(db, 'users', user.uid, 'favorites', songId);
        if (fav) {
          await deleteDoc(ref);
          setFav(false);
        } else {
          await setDoc(ref, { songId, savedKey, savedCapo, addedAt: serverTimestamp() });
          setFav(true);
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!ready || pending}
      aria-pressed={fav}
      aria-label={fav ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
      className={`no-print grid h-11 w-11 shrink-0 place-items-center rounded-xl
                  border transition active:scale-90 disabled:opacity-50
                  ${fav
          ? 'border-rose-500/40 bg-rose-500/15 text-rose-400'
          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-rose-400'}`}
    >
      <Heart size={19} fill={fav ? 'currentColor' : 'none'} />
    </button>
  );
}