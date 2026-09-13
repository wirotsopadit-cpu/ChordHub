'use client';
import { useEffect } from 'react';

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined') return;
    if (!('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const l = await (navigator as any).wakeLock.request('screen');
        if (cancelled) { l.release(); return; }
        sentinel = l;
      } catch { /* ผู้ใช้ปฏิเสธ หรือแบตต่ำ */ }
    };

    // ขอใหม่เมื่อกลับมาที่แท็บ (browser จะ release อัตโนมัติตอนสลับแท็บ)
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      sentinel?.release().catch(() => { });
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active]);
}