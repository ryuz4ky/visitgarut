import type { Metadata } from 'next'
import AvailabilitySearchPanel from '@/components/AvailabilitySearchPanel'
import MarketplaceVertical from '@/components/MarketplaceVertical'
import { searchAvailableInventory } from '@/lib/data/availability'

export const metadata: Metadata = {
  title: 'Transportasi Garut: Rental Motor, Mobil & Travel',
  description: 'Cari rental motor, rental mobil, mobil dengan driver, dan travel lokal di Garut berdasarkan area, inventory, dan live availability partner.',
  alternates: { canonical: '/transport' },
}

type TransportPageProps = {
  searchParams: Promise<{ q?: string; vehicle?: string; subtype?: string; district?: string; verified?: string; amenity?: string; price?: string; sort?: string; page?: string; date?: string; guests?: string }>
}

export default async function TransportPage({ searchParams }: TransportPageProps) {
  const { q = '', vehicle = '', subtype = '', district = '', verified = '', amenity = '', price = '', sort = '', page = '', date = '', guests = '1' } = await searchParams
  const initialQuery = q || (vehicle === 'motorbike' ? 'motor' : vehicle === 'car' ? 'mobil' : '')
  const guestCount = Math.max(1, Math.min(Number.parseInt(guests, 10) || 1, 20))
  const hasAvailabilitySearch = Boolean(date)
  const availabilityResults = hasAvailabilitySearch
    ? await searchAvailableInventory({
        categorySlug: 'transportasi',
        startDate: date,
        query: initialQuery,
        district,
        subtype,
        guests: guestCount,
      })
    : []

  return (
    <MarketplaceVertical
      eyebrow="MOVE AROUND GARUT"
      title="Rental dan transport lokal, lebih mudah dibandingkan."
      description="Cari rental motor, rental mobil, opsi dengan driver, dan travel lokal berdasarkan area layanan, tipe provider, inventory, live availability, serta sumber verifikasi."
      categorySlug="transportasi"
      action="/transport"
      q={initialQuery}
      filters={{ subtype, district, verified, amenity, price, sort, page }}
      preResults={
        <AvailabilitySearchPanel
          action="/transport"
          mode="day"
          startDate={date}
          guests={guestCount}
          preserve={{ q: initialQuery, subtype, district, verified, amenity, price, sort }}
          hasSearch={hasAvailabilitySearch}
          invalidRange={false}
          results={availabilityResults}
        />
      }
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
