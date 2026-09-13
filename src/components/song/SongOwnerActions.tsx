'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit3, Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { deleteSongAction } from '@/actions/song.actions';
import type { Song } from '@/types/song';

interface MemberState {
  uid: string;
  displayName: string;
  email: string;
}

export default function SongOwnerActions({ song }: { song: Song }) {
  const router = useRouter();
  const [member, setMember] = useState<MemberState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    });

    const handleStorage = () => {
      const saved = localStorage.getItem('chordhub_gmail_user');
      if (saved) {
        try {
          setMember(JSON.parse(saved));
        } catch {
          setMember(null);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Check if current user is owner
  const isOwner = Boolean(
    member && (member.uid === song.createdBy || song.createdBy === 'admin')
  );

  // If not owner, do not render any edit/delete buttons
  if (!isOwner || !member) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteSongAction(song.slug, member.uid);
      if (res.ok) {
        setShowConfirmModal(false);
        router.push('/profile');
      } else {
        setDeleteError(res.error || 'ลบเพลงไม่สำเร็จ');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'เกิดข้อผิดพลาดในการลบเพลง');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Edit Button */}
        <Link
          href={`/admin/add-song?edit=${song.slug}`}
          className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/50 transition shadow-sm active:scale-95"
          title="แก้ไขข้อมูลและเนื้อเพลงนี้"
        >
          <Edit3 size={13} />
          <span>แก้ไข</span>
        </Link>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition shadow-sm active:scale-95"
          title="ลบเพลงนี้ออกจากระบบ"
        >
          <Trash2 size={13} />
          <span>ลบ</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <AlertTriangle size={20} />
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="text-base font-bold text-zinc-100">ยืนยันการลบเพลง?</h3>
            <p className="text-xs text-zinc-400 mt-1">
              คุณต้องการลบเพลง <span className="font-semibold text-zinc-200">"{song.title}"</span> ออกจากระบบอย่างถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>

            {deleteError && (
              <p className="text-xs text-rose-400 mt-2 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 transition disabled:opacity-50 shadow-md shadow-rose-500/20"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันลบเพลง'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
