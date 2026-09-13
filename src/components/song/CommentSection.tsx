'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Heart,
  Reply,
  Send,
  Loader2,
  Lock,
  LogOut,
  AlertCircle,
  ExternalLink,
  Mail,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import type { Comment } from '@/types/comment';
import {
  getSongComments,
  addCommentAction,
  toggleLikeCommentAction,
} from '@/actions/comment.actions';

interface CommentSectionProps {
  songId: string;
  songSlug: string;
  songTitle: string;
}

interface MemberUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

/**
 * ฟังก์ชันแปลง timestamp เป็นข้อความเวลาแบบไทย
 */
function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'เมื่อสักครู่';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return new Date(timestamp).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Google SVG Logo Component
function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
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

export default function CommentSection({ songId, songSlug, songTitle }: CommentSectionProps) {
  // Auth State
  const [currentUser, setCurrentUser] = useState<MemberUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; isConfigError?: boolean } | null>(null);

  // Manual Gmail Modal
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [gmailModalError, setGmailModalError] = useState<string | null>(null);

  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Comment Input
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingRoot, setIsSubmittingRoot] = useState(false);

  // Reply Input State
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // 1. Subscribe to Firebase Auth & Local Storage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user && user.email) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL || undefined,
        });
      } else {
        // Check local storage fallback
        const saved = localStorage.getItem('chordhub_gmail_user');
        if (saved) {
          try {
            setCurrentUser(JSON.parse(saved));
          } catch {}
        } else {
          setCurrentUser(null);
        }
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Comments
  useEffect(() => {
    loadComments();
  }, [songId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await getSongComments(songId);
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setAuthError({
          message: 'ยังไม่ได้เปิดใช้งาน Google Sign-in Provider ใน Firebase Console ของโปรเจกต์ my-guitar-chords-2f675',
          isConfigError: true,
        });
        // เปิด Modal กรอก Gmail ทันที เพื่อไม่ให้ผู้ใช้ถูกบล็อก
        setIsGmailModalOpen(true);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError({
          message: 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้: ' + (err.message || 'เกิดข้อผิดพลาด'),
          isConfigError: false,
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Manual Gmail Sign-In Handler (Instant verification without blocking)
  const handleManualGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGmailModalError(null);

    const email = manualEmail.trim().toLowerCase();
    const name = manualName.trim();

    if (!email.includes('@gmail.com')) {
      setGmailModalError('กรุณากรอกอีเมลที่ลงท้ายด้วย @gmail.com เท่านั้น');
      return;
    }

    if (!name) {
      setGmailModalError('กรุณากรอกชื่อแสดงผล');
      return;
    }

    const member: MemberUser = {
      uid: 'gmail_' + btoa(email).replace(/=/g, '').slice(0, 16),
      displayName: name,
      email,
    };

    localStorage.setItem('chordhub_gmail_user', JSON.stringify(member));
    setCurrentUser(member);
    setIsGmailModalOpen(false);
    setAuthError(null);
    setManualEmail('');
    setManualName('');
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem('chordhub_gmail_user');
    setCurrentUser(null);
  };

  // Submit Root Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      handleGoogleLogin();
      return;
    }
    if (!newCommentText.trim() || isSubmittingRoot) return;

    setIsSubmittingRoot(true);
    try {
      const res = await addCommentAction({
        songId,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userEmail: currentUser.email,
        userAvatar: currentUser.photoURL,
        content: newCommentText.trim(),
      });

      if (res.ok && res.comment) {
        setComments(prev => [res.comment!, ...prev]);
        setNewCommentText('');
      } else {
        alert(res.error || 'ไม่สามารถโพสต์ความคิดเห็นได้');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmittingRoot(false);
    }
  };

  // Submit Reply Comment
  const handlePostReply = async (parentId: string) => {
    if (!currentUser) {
      handleGoogleLogin();
      return;
    }
    if (!replyText.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      const res = await addCommentAction({
        songId,
        parentId,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userEmail: currentUser.email,
        userAvatar: currentUser.photoURL,
        content: replyText.trim(),
      });

      if (res.ok && res.comment) {
        setComments(prev =>
          prev.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), res.comment!],
              };
            }
            return c;
          })
        );
        setReplyText('');
        setReplyingToId(null);
      } else {
        alert(res.error || 'ไม่สามารถตอบกลับได้');
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Toggle Like (Requires Gmail Login)
  const handleToggleLike = async (commentId: string) => {
    if (!currentUser) {
      handleGoogleLogin();
      return;
    }

    const currentUserId = currentUser.uid;

    // 1. Optimistic update
    setComments(prev => {
      const updateList = (list: Comment[]): Comment[] =>
        list.map(c => {
          if (c.id === commentId) {
            const hasLiked = c.likedBy.includes(currentUserId);
            const newLikedBy = hasLiked
              ? c.likedBy.filter(id => id !== currentUserId)
              : [...c.likedBy, currentUserId];
            const newCount = hasLiked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1;
            return {
              ...c,
              likedBy: newLikedBy,
              likesCount: newCount,
            };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateList(c.replies) };
          }
          return c;
        });
      return updateList(prev);
    });

    // 2. Server Action
    try {
      await toggleLikeCommentAction(commentId, currentUserId);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const totalCommentCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 border-t border-zinc-800/80">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              ความคิดเห็นและเทคนิคการเล่น
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                {totalCommentCount}
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              ร่วมแลกเปลี่ยนข้อสงสัย หรือแชร์เคล็ดลับการเล่นเพลง {songTitle}
            </p>
          </div>
        </div>

        {/* Member Status Chip / Google Sign In */}
        {!isAuthChecking && (
          <div>
            {currentUser ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 shadow">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="h-6 w-6 rounded-full object-cover border border-emerald-500/40"
                  />
                ) : (
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-[11px] font-bold text-zinc-950">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <div className="text-left leading-none">
                  <div className="text-xs font-bold text-zinc-200">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 max-w-[140px] truncate">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 text-zinc-500 hover:text-rose-400 transition"
                  title="ออกจากระบบ"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition active:scale-95 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <Loader2 size={14} className="animate-spin text-emerald-400" />
                  ) : (
                    <GoogleIcon className="h-3.5 w-3.5" />
                  )}
                  <span>เข้าสู่ระบบด้วย Google</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auth Error / Firebase Console Setup Notification Banner */}
      {authError && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-300">{authError.message}</p>
              {authError.isConfigError ? (
                <div className="mt-2 space-y-2 text-zinc-300">
                  <p>
                    <strong>วิธีเปิดใช้งาน Google Sign-in:</strong> เข้าไปที่ Firebase Console &gt; เมนู{' '}
                    <span className="text-white font-semibold">Authentication</span> &gt; แท็บ{' '}
                    <span className="text-white font-semibold">Sign-in method</span> &gt; เลือก{' '}
                    <span className="text-emerald-400 font-semibold">Google</span> &gt; กด{' '}
                    <span className="text-emerald-400 font-semibold">Enable (เปิดใช้งาน)</span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href="https://console.firebase.google.com/project/my-guitar-chords-2f675/authentication/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition"
                    >
                      <ExternalLink size={13} /> ไปยังหน้าตั้งค่า Firebase Console
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsGmailModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition"
                    >
                      <Mail size={13} /> หรือเข้าสู่ระบบด้วย Gmail ทันที
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Main Comment Box / Locked State */}
      {currentUser ? (
        /* Logged In: Unlocked Comment Form */
        <form onSubmit={handlePostComment} className="mb-8 rounded-2xl border border-emerald-500/20 bg-zinc-900/40 p-4 shadow-lg">
          <div className="flex items-start gap-3">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="h-9 w-9 shrink-0 rounded-xl object-cover border border-emerald-500/40"
              />
            ) : (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-sm font-bold text-zinc-950 shadow">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'G'}
              </div>
            )}

            <div className="flex-1">
              <textarea
                rows={3}
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                placeholder={`แสดงความคิดเห็นในชื่อ "${currentUser.displayName}" (${currentUser.email})... (เช่น ท่อนฮุคเล่นคอร์ดทาบได้ง่ายกว่า)`}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 transition resize-none"
              />

              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[11px] text-zinc-500">
                  ล็อกอินแล้วด้วย Gmail: <span className="text-zinc-400">{currentUser.email}</span>
                </span>

                <button
                  type="submit"
                  disabled={isSubmittingRoot || !newCommentText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition active:scale-95 disabled:opacity-40"
                >
                  {isSubmittingRoot ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> โพสต์ความคิดเห็น
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Not Logged In: Locked State with Google Login Prompt */
        <div className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-6 text-center shadow-lg">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 shadow-inner">
            <Lock size={22} className="text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">
            เข้าสู่ระบบด้วย Google (Gmail) เพื่อร่วมแสดงความคิดเห็น
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-zinc-400">
            ระบบสงวนสิทธิ์การคอมเมนต์ ตอบกลับ และกดถูกใจ สำหรับสมาชิกที่เข้าสู่ระบบด้วยบัญชี Google เพื่อสร้างสังคมดนตรีที่ปลอดภัย
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2.5 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-md hover:bg-zinc-100 hover:shadow-lg transition active:scale-95 disabled:opacity-60"
            >
              {isLoggingIn ? (
                <Loader2 size={16} className="animate-spin text-zinc-800" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              <span>เข้าสู่ระบบด้วย Google (Gmail)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGmailModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <Mail size={14} className="text-emerald-400" />
              <span>หรือระบุ Gmail โดยตรง</span>
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
          <Loader2 size={18} className="animate-spin text-emerald-400" />
          <span className="text-xs">กำลังโหลดความคิดเห็น...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 py-12 text-center">
          <MessageSquare size={32} className="mx-auto text-zinc-600 mb-2 opacity-60" />
          <p className="text-sm font-medium text-zinc-300">ยังไม่มีความคิดเห็นในเพลงนี้</p>
          <p className="text-xs text-zinc-500 mt-1">
            เข้าสู่ระบบด้วย Google และเป็นคนแรกที่แชร์เทคนิคการจับคอร์ดได้เลย
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => {
            const hasLiked = currentUser ? comment.likedBy?.includes(currentUser.uid) : false;
            const isReplyingThis = replyingToId === comment.id;

            return (
              <div
                key={comment.id}
                className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-4 transition hover:border-zinc-800"
              >
                {/* Comment Header */}
                <div className="flex items-start gap-3">
                  {comment.userAvatar ? (
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className="h-8 w-8 shrink-0 rounded-xl object-cover border border-emerald-500/30"
                    />
                  ) : (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-xs font-bold text-white shadow">
                      {comment.userName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-200">{comment.userName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        สมาชิก Gmail
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        • {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="mt-1.5 text-sm text-zinc-200 leading-relaxed whitespace-pre-line break-words">
                      {comment.content}
                    </p>

                    {/* Actions: Like & Reply */}
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      {/* Like Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(comment.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition ${
                          hasLiked
                            ? 'text-rose-400 bg-rose-500/10 font-bold'
                            : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60'
                        }`}
                      >
                        <Heart
                          size={14}
                          className={`transition-transform duration-200 ${
                            hasLiked ? 'fill-rose-400 scale-110' : ''
                          }`}
                        />
                        <span>{comment.likesCount > 0 ? comment.likesCount : 'ถูกใจ'}</span>
                      </button>

                      {/* Reply Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentUser) {
                            handleGoogleLogin();
                            return;
                          }
                          if (isReplyingThis) {
                            setReplyingToId(null);
                          } else {
                            setReplyingToId(comment.id);
                            setReplyText('');
                          }
                        }}
                        className="flex items-center gap-1 text-zinc-400 hover:text-emerald-400 transition"
                      >
                        <Reply size={14} />
                        <span>ตอบกลับ</span>
                      </button>
                    </div>

                    {/* Inline Reply Form (Only accessible when logged in) */}
                    {isReplyingThis && currentUser && (
                      <div className="mt-3 rounded-xl border border-emerald-500/30 bg-zinc-950 p-3 animate-in fade-in">
                        <textarea
                          rows={2}
                          autoFocus
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder={`ตอบกลับความคิดเห็นของ ${comment.userName}...`}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 resize-none"
                        />
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingReply || !replyText.trim()}
                            onClick={() => handlePostReply(comment.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition disabled:opacity-50"
                          >
                            {isSubmittingReply ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Send size={12} />
                            )}
                            <span>ส่งคำตอบ</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Threaded Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 space-y-3 border-l-2 border-zinc-800 pl-3 sm:pl-4">
                        {comment.replies.map(reply => {
                          const hasLikedReply = currentUser
                            ? reply.likedBy?.includes(currentUser.uid)
                            : false;
                          return (
                            <div key={reply.id} className="flex items-start gap-2.5 pt-1">
                              {reply.userAvatar ? (
                                <img
                                  src={reply.userAvatar}
                                  alt={reply.userName}
                                  className="h-6 w-6 shrink-0 rounded-lg object-cover border border-emerald-500/30"
                                />
                              ) : (
                                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-emerald-600 text-[10px] font-bold text-white shadow">
                                  {reply.userName.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-zinc-200">
                                    {reply.userName}
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    • {formatTimeAgo(reply.createdAt)}
                                  </span>
                                </div>

                                <p className="mt-1 text-xs text-zinc-300 leading-relaxed whitespace-pre-line break-words">
                                  {reply.content}
                                </p>

                                <div className="mt-1.5 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLike(reply.id)}
                                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition ${
                                      hasLikedReply
                                        ? 'text-rose-400 font-bold bg-rose-500/10'
                                        : 'text-zinc-500 hover:text-rose-400'
                                    }`}
                                  >
                                    <Heart
                                      size={12}
                                      className={hasLikedReply ? 'fill-rose-400' : ''}
                                    />
                                    <span>{reply.likesCount > 0 ? reply.likesCount : 'ถูกใจ'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Manual Gmail Sign-In (Safe Fallback) */}
      {isGmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                <GoogleIcon className="h-4 w-4" />
                <span>เข้าสู่ระบบด้วย Gmail</span>
              </div>
              <button
                onClick={() => setIsGmailModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              ระบุอีเมล Gmail ของท่านเพื่อใช้แสดงความคิดเห็นและแลกเปลี่ยนเทคนิคคอร์ดเพลง
            </p>

            {gmailModalError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle size={15} />
                <span>{gmailModalError}</span>
              </div>
            )}

            <form onSubmit={handleManualGmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  อีเมล Gmail *
                </label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={e => setManualEmail(e.target.value)}
                  placeholder="เช่น yourname@gmail.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ชื่อที่จะให้แสดงในคอมเมนต์ *
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="เช่น มือกีตาร์สายชิล, พี่โน้ต..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGmailModalOpen(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition"
                >
                  <CheckCircle2 size={14} />
                  <span>ยืนยันเข้าสู่ระบบ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
