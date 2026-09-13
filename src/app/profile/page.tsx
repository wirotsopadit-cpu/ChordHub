'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon,
  Heart,
  MessageSquare,
  Settings,
  LogOut,
  Music,
  ExternalLink,
  Edit3,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  ListMusic,
  Plus,
  Trash2,
  FolderPlus,
  X,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import {
  getUserFavorites,
  getUserComments,
  updateUserProfile,
  type UserFavoriteItem,
  type UserCommentItem,
} from '@/actions/user.actions';
import {
  getUserPlaylists,
  createPlaylistAction,
  removeSongFromPlaylistAction,
  deletePlaylistAction,
} from '@/actions/playlist.actions';
import {
  getUserUploadedSongs,
  deleteSongAction as deleteUploadedSongAction,
} from '@/actions/song.actions';
import type { UserPlaylist } from '@/types/playlist';
import type { Song } from '@/types/song';

interface MemberState {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  instrument?: string;
  skillLevel?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberState | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Tab State: 'my-songs' | 'playlists' | 'favorites' | 'comments' | 'settings'
  const [activeTab, setActiveTab] = useState<'my-songs' | 'playlists' | 'favorites' | 'comments' | 'settings'>('my-songs');

  // Songs, Playlists, Favorites & Comments Data
  const [userSongs, setUserSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [favorites, setFavorites] = useState<UserFavoriteItem[]>([]);
  const [comments, setComments] = useState<UserCommentItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Selected Playlist to view inside
  const [selectedPlaylist, setSelectedPlaylist] = useState<UserPlaylist | null>(null);

  // Create Playlist Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // Profile Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [instrument, setInstrument] = useState('กีตาร์โปร่ง (Acoustic Guitar)');
  const [skillLevel, setSkillLevel] = useState('ปานกลาง (Intermediate)');
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  // 1. Subscribe to Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user && user.email) {
        const m: MemberState = {
          uid: user.uid,
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL || undefined,
        };
        setMember(m);
        setEditName(m.displayName);
        loadUserData(m.uid);
      } else {
        const saved = localStorage.getItem('chordhub_gmail_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setMember(parsed);
            setEditName(parsed.displayName);
            loadUserData(parsed.uid);
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

  const loadUserData = async (uid: string) => {
    setIsLoadingData(true);
    try {
      const [plistData, favData, comData, songData] = await Promise.all([
        getUserPlaylists(uid),
        getUserFavorites(uid),
        getUserComments(uid),
        getUserUploadedSongs(uid),
      ]);
      setPlaylists(plistData);
      setFavorites(favData);
      setComments(comData);
      setUserSongs(songData);

      // Load saved preferences if any from localStorage
      const savedPref = localStorage.getItem(`chordhub_pref_${uid}`);
      if (savedPref) {
        try {
          const p = JSON.parse(savedPref);
          if (p.instrument) setInstrument(p.instrument);
          if (p.skillLevel) setSkillLevel(p.skillLevel);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDeleteUserSong = async (slug: string) => {
    if (!member) return;
    if (!confirm('คุณต้องการลบเพลงนี้ออกจากระบบใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    try {
      const res = await deleteUploadedSongAction(slug, member.uid);
      if (res.ok) {
        setUserSongs(prev => prev.filter(s => s.slug !== slug && s.id !== slug));
      } else {
        alert(res.error || 'ลบเพลงไม่สำเร็จ');
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบเพลง');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem('chordhub_gmail_user');
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  const handleSaveName = async () => {
    if (!editName.trim() || !member) return;
    const updated = { ...member, displayName: editName.trim() };
    setMember(updated);
    localStorage.setItem('chordhub_gmail_user', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setIsEditingName(false);

    try {
      await updateUserProfile(member.uid, { displayName: editName.trim() });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setIsSavingPref(true);
    setPrefSaveSuccess(false);

    localStorage.setItem(
      `chordhub_pref_${member.uid}`,
      JSON.stringify({ instrument, skillLevel })
    );

    try {
      await updateUserProfile(member.uid, { instrument, skillLevel });
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPref(false);
    }
  };

  // Create Playlist Action
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !newTitle.trim()) return;

    setIsCreatingPlaylist(true);
    try {
      const res = await createPlaylistAction(member.uid, newTitle.trim(), newDesc.trim());
      if (res.ok && res.playlist) {
        setPlaylists(prev => [res.playlist!, ...prev]);
        setNewTitle('');
        setNewDesc('');
        setIsCreateModalOpen(false);
      } else {
        alert(res.error || 'สร้างเพลย์ลิสต์ไม่สำเร็จ');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  // Delete Playlist
  const handleDeletePlaylist = async (playlistId: string) => {
    if (!member) return;
    if (!confirm('คุณต้องการลบเพลย์ลิสต์นี้ใช่หรือไม่?')) return;

    try {
      const res = await deletePlaylistAction(member.uid, playlistId);
      if (res.ok) {
        setPlaylists(prev => prev.filter(p => p.id !== playlistId));
        if (selectedPlaylist?.id === playlistId) {
          setSelectedPlaylist(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Remove Song from Playlist
  const handleRemoveSong = async (playlistId: string, songId: string) => {
    if (!member) return;
    try {
      const res = await removeSongFromPlaylistAction(member.uid, playlistId, songId);
      if (res.ok) {
        const updater = (list: UserPlaylist[]) =>
          list.map(p => {
            if (p.id === playlistId) {
              const updatedSongs = p.songs.filter(s => s.songId !== songId && s.slug !== songId);
              return {
                ...p,
                songsCount: updatedSongs.length,
                songs: updatedSongs,
              };
            }
            return p;
          });

        setPlaylists(updater);
        if (selectedPlaylist && selectedPlaylist.id === playlistId) {
          setSelectedPlaylist(prev =>
            prev
              ? {
                  ...prev,
                  songsCount: prev.songs.filter(s => s.songId !== songId && s.slug !== songId).length,
                  songs: prev.songs.filter(s => s.songId !== songId && s.slug !== songId),
                }
              : null
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isAuthChecking) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-emerald-400" size={24} />
      </main>
    );
  }

  // Not logged in: Show Prompt
  if (!member) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-zinc-800 text-zinc-400 border border-zinc-700">
            <UserIcon size={26} />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">กรุณาเข้าสู่ระบบ</h1>
          <p className="text-xs text-zinc-400 mt-2 mb-6">
            เข้าสู่ระบบด้วยบัญชี Google หรือ Gmail เพื่อดูหน้าโปรไฟล์ สร้างเพลย์ลิสต์ และดูเพลงโปรดของคุณ
          </p>
          <Link
            href="/login?next=/profile"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 font-bold text-sm text-zinc-950 hover:bg-emerald-400 transition"
          >
            <span>เข้าสู่ระบบตอนนี้</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* User Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 sm:p-8 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            {/* Avatar & Basic Info */}
            <div className="flex items-center gap-4">
              {member.photoURL ? (
                <img
                  src={member.photoURL}
                  alt={member.displayName}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-lg shrink-0"
                />
              ) : (
                <div className="grid h-16 w-16 sm:h-20 sm:w-20 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-2xl sm:text-3xl font-bold text-zinc-950 shadow-lg shrink-0">
                  {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div>
                {/* Name */}
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="rounded-lg border border-emerald-500 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveName}
                        className="p-1 rounded bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                        title="บันทึกชื่อ"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
                        {member.displayName}
                      </h1>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="text-zinc-500 hover:text-emerald-400 transition"
                        title="แก้ไขชื่อแสดงผล"
                      >
                        <Edit3 size={15} />
                      </button>
                    </>
                  )}
                </div>

                {/* Email */}
                <p className="text-xs text-zinc-400 mt-1">{member.email}</p>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <Sparkles size={11} /> สมาชิก ChordHub
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-300 font-medium">
                    {instrument.split(' ')[0]}
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400 font-medium">
                    ระดับ{skillLevel.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition active:scale-95 shrink-0"
            >
              <LogOut size={14} />
              <span>ออกจากระบบ</span>
            </button>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-6 overflow-x-auto">
          {/* TAB 0: MY SONGS */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('my-songs');
              setSelectedPlaylist(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
              activeTab === 'my-songs'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Music size={15} />
            <span>เพลงของฉัน</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === 'my-songs' ? 'bg-zinc-950 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {userSongs.length}
            </span>
          </button>

          {/* TAB 1: PLAYLISTS */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('playlists');
              setSelectedPlaylist(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
              activeTab === 'playlists'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <ListMusic size={15} />
            <span>เพลย์ลิสต์ของฉัน</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === 'playlists' ? 'bg-zinc-950 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {playlists.length}
            </span>
          </button>

          {/* TAB 2: FAVORITES */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('favorites');
              setSelectedPlaylist(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
              activeTab === 'favorites'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Heart size={14} className={activeTab === 'favorites' ? 'fill-zinc-950' : ''} />
            <span>เพลงโปรด</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === 'favorites' ? 'bg-zinc-950 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {favorites.length}
            </span>
          </button>

          {/* TAB 3: COMMENTS */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('comments');
              setSelectedPlaylist(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
              activeTab === 'comments'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <MessageSquare size={14} />
            <span>ความคิดเห็น</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === 'comments' ? 'bg-zinc-950 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {comments.length}
            </span>
          </button>

          {/* TAB 4: SETTINGS */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setSelectedPlaylist(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Settings size={14} />
            <span>ตั้งค่าข้อมูล</span>
          </button>
        </div>

        {/* TAB 0: MY SONGS CONTENT */}
        {activeTab === 'my-songs' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-zinc-100">เพลงที่คุณเพิ่มเข้าระบบ</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  คุณสามารถแก้ไขคอร์ด เนื้อเพลง หรือลบเพลงที่คุณเป็นผู้เพิ่มได้ตลอดเวลา
                </p>
              </div>

              <Link
                href="/admin/add-song"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition shadow"
              >
                <Plus size={15} />
                <span>+ เพิ่มเพลงใหม่</span>
              </Link>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
                <Loader2 size={20} className="animate-spin text-emerald-400" />
                <span className="text-xs">กำลังโหลดเพลงของคุณ...</span>
              </div>
            ) : userSongs.length === 0 ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 py-16 text-center">
                <Music size={40} className="mx-auto text-zinc-600 mb-3 opacity-60" />
                <h3 className="text-base font-bold text-zinc-200">คุณยังไม่ได้เพิ่มเพลงในระบบ</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-6">
                  ร่วมเป็นส่วนหนึ่งของคอมมูนิตี้ดนตรี เพิ่มคอร์ดเพลงโปรดของคุณเพื่อให้เพื่อนๆ ได้ฝึกเล่น
                </p>
                <Link
                  href="/admin/add-song"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition shadow"
                >
                  <Plus size={15} />
                  <span>เพิ่มเพลงแรกของคุณทันที</span>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {userSongs.map(song => (
                  <div
                    key={song.slug || song.id}
                    className="group flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700 hover:bg-zinc-900/80 transition shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/song/${song.slug || song.id}`}
                            className="text-sm font-bold text-zinc-100 hover:text-emerald-400 transition truncate block"
                          >
                            {song.title}
                          </Link>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                          คีย์ {song.originalKey}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-zinc-500">
                        {song.defaultCapo > 0 && (
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                            คาโป {song.defaultCapo}
                          </span>
                        )}
                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 capitalize">
                          {song.difficulty}
                        </span>
                        <span>เข้าชม {song.viewCount.toLocaleString()} ครั้ง</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-4">
                      <Link
                        href={`/song/${song.slug || song.id}`}
                        className="flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition"
                      >
                        <Play size={12} className="fill-zinc-300" />
                        <span>เล่นคอร์ด</span>
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/add-song?edit=${song.slug || song.id}`}
                          className="flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 transition"
                          title="แก้ไขเพลงนี้"
                        >
                          <Edit3 size={12} />
                          <span>แก้ไข</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteUserSong(song.slug || song.id)}
                          className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                          title="ลบเพลงนี้"
                        >
                          <Trash2 size={12} />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: PLAYLISTS CONTENT */}
        {activeTab === 'playlists' && (
          <div>
            {/* View inside a selected playlist */}
            {selectedPlaylist ? (
              <div>
                {/* Back button & Playlist Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800 mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPlaylist(null)}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <span>{selectedPlaylist.title}</span>
                        <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {selectedPlaylist.songsCount || selectedPlaylist.songs.length} เพลง
                        </span>
                      </h2>
                      {selectedPlaylist.description && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {selectedPlaylist.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                  >
                    <Trash2 size={13} />
                    <span>ลบเพลย์ลิสต์นี้</span>
                  </button>
                </div>

                {/* Songs list in this playlist */}
                {selectedPlaylist.songs.length === 0 ? (
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 py-16 text-center">
                    <ListMusic size={36} className="mx-auto text-zinc-600 mb-3 opacity-60" />
                    <h3 className="text-base font-bold text-zinc-200">ยังไม่มีเพลงในเพลย์ลิสต์นี้</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-6">
                      เปิดหน้าคอร์ดเพลงใดก็ได้ แล้วกดปุ่มไอคอนเพลย์ลิสต์เพื่อเพิ่มเพลงเข้ามาในหมวดนี้
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition"
                    >
                      <Music size={14} />
                      <span>ค้นหาเพลงเพื่อเพิ่ม</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedPlaylist.songs.map((song, idx) => (
                      <div
                        key={idx}
                        className="group flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700 hover:bg-zinc-900/80 transition shadow-sm"
                      >
                        <div className="min-w-0 flex-1 pr-3 flex items-center gap-3">
                          <span className="font-mono text-xs text-zinc-500 w-5 text-right">
                            {idx + 1}.
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/song/${song.slug || song.songId}?playlist=${selectedPlaylist.id}&uid=${member.uid}`}
                              className="text-sm font-bold text-zinc-100 hover:text-emerald-400 transition truncate block"
                            >
                              {song.title}
                            </Link>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            คีย์ {song.originalKey || 'C'}
                          </span>

                          <Link
                            href={`/song/${song.slug || song.songId}?playlist=${selectedPlaylist.id}&uid=${member.uid}`}
                            className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition"
                            title="เปิดเล่นคอร์ด"
                          >
                            <Play size={12} className="fill-zinc-950" />
                            <span>เล่นคอร์ด</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleRemoveSong(selectedPlaylist.id, song.songId)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 transition rounded-lg hover:bg-zinc-800"
                            title="ลบออกจากเพลย์ลิสต์"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* All Playlists Grid */
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">เพลย์ลิสต์เพลงที่คุณจัดหมวดหมู่</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      รวมเพลงตามแนวที่ชอบ เช่น เพลงลูกทุ่ง, เพลงรัก, เพลงเล่นงานเลี้ยง
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition shadow"
                  >
                    <Plus size={15} />
                    <span>+ สร้างเพลย์ลิสต์ใหม่</span>
                  </button>
                </div>

                {isLoadingData ? (
                  <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
                    <Loader2 size={20} className="animate-spin text-emerald-400" />
                    <span className="text-xs">กำลังโหลดเพลย์ลิสต์...</span>
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 py-16 text-center">
                    <FolderPlus size={40} className="mx-auto text-zinc-600 mb-3 opacity-60" />
                    <h3 className="text-base font-bold text-zinc-200">ยังไม่มีเพลย์ลิสต์</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-6">
                      สร้างเพลย์ลิสต์เพื่อจัดหมวดหมู่เพลงตามใจ เช่น 1. เพลงลูกทุ่ง 2. เพลงรัก 3. เพลงร็อค
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition shadow"
                    >
                      <Plus size={15} />
                      <span>สร้างเพลย์ลิสต์แรกของคุณ</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {playlists.map(p => (
                      <div
                        key={p.id}
                        className="group flex flex-col justify-between rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-zinc-950 p-5 hover:border-emerald-500/50 transition shadow-sm"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ListMusic size={20} />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeletePlaylist(p.id)}
                              className="text-zinc-600 hover:text-rose-400 transition p-1"
                              title="ลบเพลย์ลิสต์"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <h4 className="text-base font-bold text-zinc-100 mt-3 group-hover:text-emerald-400 transition truncate">
                            {p.title}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 h-8">
                            {p.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-4">
                          <span className="text-xs text-zinc-400 font-medium">
                            {p.songsCount || p.songs?.length || 0} เพลง
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedPlaylist(p)}
                            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
                          >
                            <span>เปิดดูเพลง</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FAVORITES */}
        {activeTab === 'favorites' && (
          <div>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
                <Loader2 size={20} className="animate-spin text-emerald-400" />
                <span className="text-xs">กำลังโหลดเพลงโปรด...</span>
              </div>
            ) : favorites.length === 0 ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 py-16 text-center">
                <Heart size={36} className="mx-auto text-zinc-600 mb-3 opacity-60" />
                <h3 className="text-base font-bold text-zinc-200">ยังไม่มีเพลงในรายการโปรด</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-6">
                  กดที่ไอคอนหัวใจ ❤️ ในหน้ารายละเอียดเพลง เพื่อบันทึกเพลงโปรดไว้ฝึกซ้อมในหน้านี้
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition shadow"
                >
                  <Music size={14} />
                  <span>ค้นหาเพลงเพื่อฝึกซ้อม</span>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {favorites.map((fav, idx) => {
                  const song = fav.song;
                  const songSlug = song?.slug || fav.songId;
                  return (
                    <Link
                      key={idx}
                      href={`/song/${songSlug}`}
                      className="group flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-emerald-500/50 hover:bg-zinc-900 shadow-sm"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <h4 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 truncate transition">
                          {song?.title || fav.songId}
                        </h4>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {song?.artist || 'ศิลปิน'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-mono text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            คีย์ {fav.savedKey}
                          </span>
                          {fav.savedCapo > 0 && (
                            <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-mono">
                              คาโป {fav.savedCapo}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-800/80 text-zinc-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition shrink-0">
                        <ArrowRight size={16} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMMENTS */}
        {activeTab === 'comments' && (
          <div>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
                <Loader2 size={20} className="animate-spin text-emerald-400" />
                <span className="text-xs">กำลังโหลดความคิดเห็น...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 py-16 text-center">
                <MessageSquare size={36} className="mx-auto text-zinc-600 mb-3 opacity-60" />
                <h3 className="text-base font-bold text-zinc-200">ยังไม่มีประวัติความคิดเห็น</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-6">
                  คุณสามารถร่วมคอมเมนต์ แชร์คอร์ด หรือเทคนิคการเล่นในหน้ารายละเอียดเพลงได้
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition"
                >
                  <Music size={14} />
                  <span>สำรวจเพลงทั้งหมด</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Link
                        href={`/song/${c.songSlug || c.songId}`}
                        className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1.5"
                      >
                        <Music size={13} />
                        <span>เพลง: {c.songTitle || c.songId}</span>
                        <ExternalLink size={12} />
                      </Link>
                      <span className="text-[11px] text-zinc-500">
                        {new Date(c.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                      {c.content}
                    </p>

                    <div className="mt-3 flex items-center gap-1 text-xs text-rose-400">
                      <Heart size={13} className="fill-rose-400" />
                      <span>{c.likesCount} ถูกใจ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <form
            onSubmit={handleSavePreferences}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 max-w-xl space-y-6"
          >
            <div>
              <h3 className="text-base font-bold text-zinc-100 mb-1">ความชอบและระดับการเล่น</h3>
              <p className="text-xs text-zinc-400">
                ตั้งค่าเครื่องดนตรีและระดับความชำนาญของคุณเพื่อปรับปรุงการแนะนำเพลง
              </p>
            </div>

            {prefSaveSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <Check size={16} />
                <span>บันทึกข้อมูลเรียบร้อยแล้ว</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                เครื่องดนตรีหลักที่เล่น
              </label>
              <select
                value={instrument}
                onChange={e => setInstrument(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition"
              >
                <option value="กีตาร์โปร่ง (Acoustic Guitar)">กีตาร์โปร่ง (Acoustic Guitar)</option>
                <option value="กีตาร์ไฟฟ้า (Electric Guitar)">กีตาร์ไฟฟ้า (Electric Guitar)</option>
                <option value="อูคูเลเล่ (Ukulele)">อูคูเลเล่ (Ukulele)</option>
                <option value="เบส (Bass Guitar)">เบส (Bass Guitar)</option>
                <option value="เปียโน/คีย์บอร์ด (Keyboard)">เปียโน/คีย์บอร์ด (Keyboard)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                ระดับความชำนาญ
              </label>
              <select
                value={skillLevel}
                onChange={e => setSkillLevel(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition"
              >
                <option value="มือใหม่ (Beginner)">มือใหม่ (Beginner) - เล่นคอร์ดพื้นฐาน คอร์ดง่าย</option>
                <option value="ปานกลาง (Intermediate)">ปานกลาง (Intermediate) - เล่นคอร์ดทาบ และสตรัมมิ่งหลากหลาย</option>
                <option value="ขั้นสูง (Advanced)">ขั้นสูง (Advanced) - เล่น Fingerstyle โซโล่ และคอร์ดแจ๊ส</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSavingPref}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition active:scale-95 disabled:opacity-50"
            >
              {isSavingPref ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>บันทึกการตั้งค่า</span>
            </button>
          </form>
        )}
      </div>

      {/* CREATE PLAYLIST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-base">
                <FolderPlus size={20} className="text-emerald-400" />
                <span>สร้างเพลย์ลิสต์ใหม่</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ชื่อเพลย์ลิสต์ *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="เช่น เพลงลูกทุ่ง, เพลงรัก, เพลงเล่นงานเลี้ยง..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  คำอธิบายเพลย์ลิสต์ (ไม่บังคับ)
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="เช่น รวมเพลงลูกทุ่งเพราะๆ คอร์ดง่ายสำหรับฝึกซ้อม..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPlaylist || !newTitle.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  {isCreatingPlaylist ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>สร้างเพลย์ลิสต์</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
