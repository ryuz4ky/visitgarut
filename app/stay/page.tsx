import type { Metadata } from 'next'
import MarketplaceVertical from '@/components/MarketplaceVertical'

export const metadata: Metadata = {
  title: 'Hotel, Villa & Penginapan di Garut',
  description: 'Cari hotel, villa, resort, homestay, dan penginapan di Garut berdasarkan area dan kebutuhan perjalanan.',
  alternates: { canonical: '/stay' },
}

type StayPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function StayPage({ searchParams }: StayPageProps) {
  const { q = '' } = await searchParams

  return (
    <MarketplaceVertical
      eyebrow="STAY IN GARUT"
      title="Cari tempat menginap yang cocok dengan trip kamu."
      description="Jelajahi hotel, villa, resort, dan homestay lokal berdasarkan area. VisitGarut disiapkan untuk menghubungkan discovery dengan partner booking atau direct lead."
      categorySlug="penginapan"
      action="/stay"
      q={q}
      searchPlaceholder="Cari area, hotel, villa, resort, atau homestay..."
      suggestions={[
        { label: 'Cipanas & Tarogong', description: 'Cocok untuk hot spring, keluarga, dan akses dekat kota.', href: '/stay?q=Cipanas' },
        { label: 'Dekat Pegunungan', description: 'Untuk suasana alam, udara sejuk, dan aktivitas outdoor.', href: '/stay?q=Papandayan' },
        { label: 'Garut Kota', description: 'Praktis untuk bisnis, kuliner, transit, dan akses transportasi.', href: '/stay?q=Garut' },
      ]}
      emptyTitle="Listing penginapan sedang kami kurasi."
      emptyDescription="Struktur marketplace-nya sudah siap. Selanjutnya hotel, villa, resort, dan homestay lokal akan masuk sebagai listing terverifikasi dengan lokasi, fasilitas, kontak, dan opsi booking/lead."
    />
  )
}
