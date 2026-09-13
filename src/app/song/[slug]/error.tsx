'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <AlertTriangle size={48} className="mx-auto text-amber-500" />
        <h1 className="mt-4 text-xl font-bold">เกิดข้อผิดพลาด</h1>
        <p className="mt-2 text-sm text-zinc-500">
          ไม่สามารถโหลดข้อมูลเพลงได้ในขณะนี้
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm hover:bg-zinc-700"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    </div>
  );
}