import type { Metadata } from 'next'
import MarketplaceVertical from '@/components/MarketplaceVertical'

export const metadata: Metadata = {
  title: 'Event Garut: Agenda, Festival & Aktivitas',
  description: 'Cari agenda, festival, acara komunitas, workshop, dan aktivitas menarik di Garut.',
  alternates: { canonical: '/events' },
}

type EventsPageProps = {
  searchParams: Promise<{ q?: string; subtype?: string; district?: string; verified?: string; amenity?: string; price?: string }>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { q = '', subtype = '', district = '', verified = '', amenity = '', price = '' } = await searchParams

  return (
    <MarketplaceVertical
      eyebrow="WHAT'S ON"
      title="Cari alasan baru untuk datang ke Garut."
      description="Jelajahi festival, agenda budaya, acara komunitas, workshop, dan aktivitas akhir pekan dengan filter lokasi serta tipe agenda."
      categorySlug="event"
      action="/events"
      q={q}
      filters={{ subtype, district, verified, amenity, price }}
      searchPlaceholder="Cari festival, komunitas, workshop, atau aktivitas..."
      suggestions={[
        { label: 'Festival & Budaya', description: 'Agenda budaya, tradisi, dan festival lokal.', href: '/events?q=festival' },
        { label: 'Komunitas', description: 'Meetup, workshop, gathering, dan aktivitas komunitas.', href: '/events?q=komunitas' },
        { label: 'Verified Agenda', description: 'Prioritaskan agenda dengan sumber informasi yang dapat dilacak.', href: '/events?verified=1' },
      ]}
      emptyTitle="Belum ada event yang cocok."
      emptyDescription="Penyelenggara dapat mengajukan agenda dengan tanggal, venue, tiket/registrasi, kategori, dan sumber informasi yang jelas."
    />
  )
}
