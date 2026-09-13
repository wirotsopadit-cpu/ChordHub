import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchClient from '@/components/search/SearchClient';
import SearchSkeleton from '@/components/search/SearchSkeleton';

export const metadata: Metadata = {
    title: 'ค้นหาคอร์ดเพลง — ค้นตามชื่อเพลง ศิลปิน คีย์ หรือคอร์ดที่เล่นเป็น',
    description:
        'ค้นหาคอร์ดกีตาร์กว่าหลายพันเพลง กรองตามคีย์ ระดับความยาก ' +
        'หรือเลือกเฉพาะเพลงที่เล่นได้ด้วยคอร์ดที่คุณรู้ พร้อมปรับคีย์ขึ้นลงได้ทันที',
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/search` },
    openGraph: { type: 'website', locale: 'th_TH' },
};

export default function SearchPage() {
    return (
        <main className="min-h-dvh bg-zinc-950 text-zinc-100">
            <Suspense fallback={<SearchSkeleton />}>
                <SearchClient />
            </Suspense>
        </main>
    );
}