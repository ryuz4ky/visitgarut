import type { Metadata } from 'next'
import MarketplaceVertical from '@/components/MarketplaceVertical'

export const metadata: Metadata = {
  title: 'Event Garut: Agenda, Festival & Aktivitas',
  description: 'Cari agenda, festival, acara komunitas, workshop, dan aktivitas menarik di Garut.',
  alternates: { canonical: '/events' },
}

type EventsPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { q = '' } = await searchParams

  return (
    <MarketplaceVertical
      eyebrow="WHAT'S ON"
      title="Cari alasan baru untuk datang ke Garut."
      description="Jelajahi festival, agenda budaya, acara komunitas, workshop, dan aktivitas akhir pekan. Kalender event akan menjadi salah satu discovery layer utama VisitGarut."
      categorySlug="event"
      action="/events"
      q={q}
      searchPlaceholder="Cari festival, komunitas, workshop, atau aktivitas..."
      suggestions={[
        { label: 'Festival & Budaya', description: 'Agenda budaya, tradisi, dan festival lokal.', href: '/events?q=festival' },
        { label: 'Komunitas', description: 'Meetup, workshop, gathering, dan aktivitas komunitas.', href: '/events?q=komunitas' },
        { label: 'Weekend Activity', description: 'Aktivitas singkat untuk akhir pekan dan short escape.', href: '/events?q=weekend' },
      ]}
      emptyTitle="Kalender event sedang kami susun."
      emptyDescription="Penyelenggara event nantinya dapat mengajukan agenda dengan tanggal, venue, tiket/registrasi, dan kategori. Untuk sekarang, struktur discovery dan pencariannya sudah disiapkan."
    />
  )
}
