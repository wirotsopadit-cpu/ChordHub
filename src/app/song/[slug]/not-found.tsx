import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <SearchX size={56} className="mx-auto text-zinc-700" />
        <h1 className="mt-5 text-2xl font-bold">ไม่พบเพลงที่คุณค้นหา</h1>
        <p className="mt-2 text-sm text-zinc-500">
          เพลงนี้อาจถูกลบ หรือ URL ไม่ถูกต้อง
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold
                           text-zinc-950 hover:bg-emerald-400">
            กลับหน้าแรก
          </Link>
          <Link href="/search"
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm
                           hover:bg-zinc-900">
            ค้นหาเพลง
          </Link>
        </div>
      </div>
    </div>
  );
}