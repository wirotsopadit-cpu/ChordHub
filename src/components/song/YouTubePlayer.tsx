'use client';

import { useState } from 'react';
import {
  Play,
  X,
  Minimize2,
  Maximize2,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import YoutubeIcon from '@/components/icons/YoutubeIcon';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/youtube';

interface YouTubePlayerProps {
  youtubeId: string;
  songTitle: string;
  artist: string;
  coverImage?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function YouTubePlayer({
  youtubeId,
  songTitle,
  artist,
  coverImage,
  isOpen,
  onClose,
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMini, setIsMini] = useState(false);

  if (!isOpen || !youtubeId) return null;

  const thumbnail = coverImage || getYouTubeThumbnail(youtubeId, 'hq');
  const embedUrl = getYouTubeEmbedUrl(youtubeId, true);

  // Floating Mini Player (Picture-in-Picture style)
  if (isMini) {
    return (
      <aside aria-label="เครื่องเล่นเพลง YouTube ขนาดย่อ" className="fixed bottom-20 right-4 z-40 w-72 sm:w-80 overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900/95 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-2 bg-zinc-950/60">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600/20 text-red-400">
              <YoutubeIcon size={12} />
            </span>
            <span className="truncate text-xs font-medium text-zinc-300">
              {songTitle}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMini(false)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              title="ขยายขนาดเต็ม"
            >
              <Maximize2 size={13} />
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              title="ปิดวิดีโอ"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="relative aspect-video w-full bg-black">
          {isPlaying ? (
            <iframe
              src={embedUrl}
              title={`${songTitle} - ${artist}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <button
              onClick={() => setIsPlaying(true)}
              className="group relative h-full w-full"
            >
              <img
                src={thumbnail}
                alt={songTitle}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg group-hover:scale-110 transition">
                  <Play size={16} className="ml-0.5 fill-current" />
                </span>
              </div>
            </button>
          )}
        </div>
      </aside>
    );
  }

  // Normal In-page Player
  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-xl ring-1 ring-white/5 transition-all">
      {/* Player Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 bg-zinc-950/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600/20 text-red-500">
            <YoutubeIcon size={14} />
          </span>
          <div className="truncate">
            <span className="text-xs font-semibold text-zinc-200">
              MV / วิดีโอเพลง: {songTitle}
            </span>
            <span className="ml-2 text-[11px] text-zinc-500">
              {artist}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={`https://www.youtube.com/watch?v=${youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
            title="เปิดดูบน YouTube"
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">YouTube</span>
          </a>

          <button
            onClick={() => setIsMini(true)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
            title="ย่อขนาดลอยไว้ที่มุมจอ (Mini Player)"
          >
            <Minimize2 size={12} />
            <span className="hidden sm:inline">ย่อขนาด</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition ml-1"
            title="ปิดวิดีโอ"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Video Content Container */}
      <div className="relative aspect-video w-full bg-black/95">
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={`${songTitle} - ${artist}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <div className="relative h-full w-full">
            <img
              src={thumbnail}
              alt={songTitle}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center justify-center p-6 text-center">
              <button
                onClick={() => setIsPlaying(true)}
                className="group flex items-center gap-3 rounded-full bg-red-600 hover:bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-2xl hover:scale-105 transition active:scale-95"
              >
                <Play size={18} className="fill-current" />
                <span>เล่นวิดีโอ / เปิดฟังเพลง</span>
              </button>
              <p className="mt-3 text-xs text-zinc-400 flex items-center gap-1.5">
                <Volume2 size={13} className="text-emerald-400" />
                คลิกเพื่อเล่นวิดีโอ YouTube ควบคู่ไปกับการซ้อมคอร์ด
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
