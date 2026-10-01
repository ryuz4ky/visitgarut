import type { Metadata } from 'next'
import MarketplaceVertical from '@/components/MarketplaceVertical'

export const metadata: Metadata = {
  title: 'Transportasi Garut: Rental Motor, Mobil & Travel',
  description: 'Cari rental motor, rental mobil, mobil dengan driver, dan travel lokal di Garut.',
  alternates: { canonical: '/transport' },
}

type TransportPageProps = {
  searchParams: Promise<{ q?: string; vehicle?: string }>
}

export default async function TransportPage({ searchParams }: TransportPageProps) {
  const { q = '', vehicle = '' } = await searchParams
  const initialQuery = q || (vehicle === 'motorbike' ? 'motor' : vehicle === 'car' ? 'mobil' : '')

  return (
    <MarketplaceVertical
      eyebrow="MOVE AROUND GARUT"
      title="Rental dan transport lokal, lebih mudah ditemukan."
      description="Cari rental motor, rental mobil, opsi dengan driver, dan travel lokal. VisitGarut akan memudahkan perbandingan berdasarkan area layanan dan kebutuhan perjalanan."
      categorySlug="transportasi"
      action="/transport"
      q={initialQuery}
      searchPlaceholder="Cari rental mobil, motor, driver, travel, atau area..."
      suggestions={[
        { label: 'Rental Motor', description: 'Fleksibel untuk solo traveler dan eksplorasi jarak dekat.', href: '/transport?q=motor' },
        { label: 'Rental Mobil', description: 'Lepas kunci atau dengan driver untuk keluarga dan grup.', href: '/transport?q=mobil' },
        { label: 'Travel & Shuttle', description: 'Transport antarkota dan titik keberangkatan menuju Garut.', href: '/transport?q=travel' },
      ]}
      emptyTitle="Provider transport sedang kami onboarding."
      emptyDescription="Rental motor, rental mobil, driver, dan travel nantinya dapat tampil dengan area layanan, armada, kontak, jam operasional, dan direct lead tanpa VisitGarut mengarang harga yang belum terverifikasi."
    />
  )
}
