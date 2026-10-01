import type { Metadata } from 'next'
import MarketplaceVertical from '@/components/MarketplaceVertical'

export const metadata: Metadata = {
  title: 'Transportasi Garut: Rental Motor, Mobil & Travel',
  description: 'Cari rental motor, rental mobil, mobil dengan driver, dan travel lokal di Garut.',
  alternates: { canonical: '/transport' },
}

type TransportPageProps = {
  searchParams: Promise<{ q?: string; vehicle?: string; subtype?: string; district?: string; verified?: string; amenity?: string; price?: string; sort?: string; page?: string }>
}

export default async function TransportPage({ searchParams }: TransportPageProps) {
  const { q = '', vehicle = '', subtype = '', district = '', verified = '', amenity = '', price = '', sort = '', page = '' } = await searchParams
  const initialQuery = q || (vehicle === 'motorbike' ? 'motor' : vehicle === 'car' ? 'mobil' : '')

  return (
    <MarketplaceVertical
      eyebrow="MOVE AROUND GARUT"
      title="Rental dan transport lokal, lebih mudah dibandingkan."
      description="Cari rental motor, rental mobil, opsi dengan driver, dan travel lokal berdasarkan area layanan, tipe provider, inventory, serta sumber verifikasi."
      categorySlug="transportasi"
      action="/transport"
      q={initialQuery}
      filters={{ subtype, district, verified, amenity, price, sort, page }}
      searchPlaceholder="Cari rental mobil, motor, driver, travel, atau area..."
      suggestions={[
        { label: 'Rental Mobil', description: 'Bandingkan provider dan inventory mobil yang tersedia.', href: '/transport?subtype=car_rental' },
        { label: 'Rental Motor', description: 'Fleksibel untuk solo traveler dan eksplorasi jarak dekat.', href: '/transport?q=motor' },
        { label: 'Source Verified', description: 'Provider dengan sumber data publik yang dapat dilacak.', href: '/transport?verified=1' },
      ]}
      emptyTitle="Belum ada provider transport yang cocok."
      emptyDescription="Rental motor, rental mobil, driver, dan travel akan terus ditambahkan dengan area layanan, armada, kontak, dan direct lead."
    />
  )
}
