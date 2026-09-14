/**
 * ตัวช่วยจัดการ YouTube Video ID, Thumbnail และ Embed URL
 */

/**
 * สกัด YouTube Video ID (11 ตัวอักษร) จาก URL รูปแบบต่างๆ
 * รองรับ:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - VIDEO_ID ล้วนๆ (11 ตัวอักษร)
 */
export function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // หากส่งมาเป็น 11-char ID โดยตรง
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex ดึง ID จากหลากหลายรูปแบบ URL
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);

  return match ? match[1] : null;
}

/**
 * ดึง URL ภาพหน้าปก Thumbnail จาก YouTube
 * @param youtubeId รหัส 11 หลัก
 * @param quality คุณภาพรูป ('hq' = 480x360, 'mq' = 320x180, 'maxres' = 1280x720)
 */
export function getYouTubeThumbnail(
  youtubeId: string,
  quality: 'default' | 'mq' | 'hq' | 'maxres' = 'hq'
): string {
  if (!youtubeId) return '';
  switch (quality) {
    case 'maxres':
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    case 'mq':
      return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
    case 'default':
      return `https://img.youtube.com/vi/${youtubeId}/default.jpg`;
    case 'hq':
    default:
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }
}

/**
 * สร้าง Embed URL สำหรับ iframe อย่างปลอดภัย
 */
export function getYouTubeEmbedUrl(youtubeId: string, autoplay = true): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
}
