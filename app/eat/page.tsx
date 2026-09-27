import type { Metadata } from 'next'
import SimpleLanding from '@/components/SimpleLanding'

export const metadata: Metadata = {
  title: 'Kuliner Garut: Cafe, Restoran & Oleh-Oleh',
  description: 'Temukan kuliner Garut, cafe, restoran, makanan khas, dan pusat oleh-oleh lokal.',
  alternates: { canonical: '/eat' },
}

export default function EatPage() {
  return (
    <SimpleLanding
      eyebrow="EAT IN GARUT"
      title="Makan enak, lebih lokal."
      description="Direktori kuliner VisitGarut sedang disiapkan untuk membantu kamu menemukan cafe, restoran, street food, dan oleh-oleh di seluruh Garut."
      cards={[
        { eyebrow: 'CAFE', title: 'Cafe & Coffee', description: 'Temukan tempat ngopi dari pusat kota sampai area pegunungan.' },
        { eyebrow: 'LOCAL FOOD', title: 'Kuliner Khas', description: 'Jelajahi makanan khas Garut dan tempat terbaik untuk mencobanya.' },
        { eyebrow: 'SHOP', title: 'Oleh-Oleh', description: 'Cari dodol, produk lokal, dan pusat oleh-oleh terpercaya.' },
      ]}
    />
  )
}
