import type { Metadata } from 'next'
import SimpleLanding from '@/components/SimpleLanding'

export const metadata: Metadata = {
  title: 'Event Garut: Agenda, Festival & Aktivitas',
  description: 'Temukan agenda, festival, acara komunitas, dan aktivitas menarik di Garut.',
  alternates: { canonical: '/events' },
}

export default function EventsPage() {
  return (
    <SimpleLanding
      eyebrow="WHAT'S ON"
      title="Lihat apa yang sedang terjadi di Garut."
      description="VisitGarut sedang menyiapkan kalender event lokal untuk festival, aktivitas komunitas, konser, pameran, dan agenda wisata."
      cards={[
        { eyebrow: 'FESTIVAL', title: 'Festival & Budaya', description: 'Agenda budaya, tradisi, dan festival lokal yang layak dikunjungi.' },
        { eyebrow: 'COMMUNITY', title: 'Komunitas', description: 'Temukan acara komunitas, workshop, meetup, dan kegiatan lokal.' },
        { eyebrow: 'ACTIVITY', title: 'Weekend Activity', description: 'Ide aktivitas untuk akhir pekan dan perjalanan singkat di Garut.' },
      ]}
    />
  )
}
