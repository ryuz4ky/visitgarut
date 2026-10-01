import type { Metadata } from 'next'
import AvailabilitySearchPanel from '@/components/AvailabilitySearchPanel'
import MarketplaceVertical from '@/components/MarketplaceVertical'

export const metadata: Metadata = {
  title: 'Hotel, Villa & Penginapan di Garut',
  description: 'Cari hotel, villa, resort, homestay, dan penginapan di Garut berdasarkan area dan kebutuhan perjalanan.',
  alternates: { canonical: '/stay' },
}

type StayPageProps = {
  searchParams: Promise<{ q?: string; subtype?: string; district?: string; verified?: string; amenity?: string; price?: string; sort?: string; page?: string; checkin?: string; checkout?: string; guests?: string }>
}

export default async function StayPage({ searchParams }: StayPageProps) {
  const { q = '', subtype = '', district = '', verified = '', amenity = '', price = '', sort = '', page = '', checkin = '', checkout = '', guests = '1' } = await searchParams
  const guestCount = Math.max(1, Math.min(Number.parseInt(guests, 10) || 1, 20))

  return (
    <MarketplaceVertical
      eyebrow="STAY IN GARUT"
      title="Cari tempat menginap yang cocok dengan trip kamu."
      description="Jelajahi hotel, villa, resort, dan homestay lokal berdasarkan area. VisitGarut menghubungkan discovery dengan inventory, direct inquiry, atau partner booking."
      categorySlug="penginapan"
      action="/stay"
      q={q}
      filters={{ subtype, district, verified, amenity, price, sort, page }}
      preResults={
        <AvailabilitySearchPanel
          action="/stay"
          categorySlug="penginapan"
          mode="range"
          startDate={checkin}
          endDate={checkout}
          guests={guestCount}
          query={q}
          district={district}
          subtype={subtype}
          preserve={{ q, subtype, district, verified, amenity, price, sort }}
        />
      }
      searchPlaceholder="Cari area, hotel, villa, resort, atau homestay..."
      suggestions={[
        { label: 'Cipanas & Tarogong', description: 'Cocok untuk hot spring, keluarga, dan akses dekat kota.', href: '/stay?district=Tarogong%20Kaler' },
        { label: 'Hotel', description: 'Bandingkan hotel berdasarkan lokasi, inventory, dan fasilitas.', href: '/stay?subtype=hotel' },
        { label: 'Source Verified', description: 'Listing yang sudah punya sumber data yang dapat dilacak.', href: '/stay?verified=1' },
      ]}
      emptyTitle="Belum ada penginapan yang cocok."
      emptyDescription="Hotel, villa, resort, dan homestay akan terus ditambahkan sebagai listing dengan sumber data, fasilitas, inventory, dan jalur booking yang jelas."
    />
  )
}
