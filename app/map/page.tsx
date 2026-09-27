import type { Metadata } from 'next'
import SimpleLanding from '@/components/SimpleLanding'

export const metadata: Metadata = {
  title: 'VisitGarut Map: Peta Wisata & Bisnis Lokal Garut',
  description: 'Jelajahi wisata, kuliner, penginapan, transportasi, event, dan bisnis lokal Garut melalui satu peta interaktif.',
  alternates: { canonical: '/map' },
}

export default function MapPage() {
  return (
    <SimpleLanding
      eyebrow="VISITGARUT MAP"
      title="Satu peta untuk menjelajahi Garut."
      description="Versi interaktif akan menggabungkan destinasi, kuliner, penginapan, transportasi, event, dan bisnis lokal berdasarkan lokasi dan jarak."
      cards={[
        { eyebrow: 'NEARBY', title: 'Near Me', description: 'Temukan tempat terdekat berdasarkan posisi pengguna.' },
        { eyebrow: 'FILTER', title: 'Filter by Category', description: 'Saring wisata, cafe, hotel, rental, event, dan bisnis lokal.' },
        { eyebrow: 'DISCOVERY', title: 'Local Discovery', description: 'Temukan tempat yang relevan berdasarkan area, kategori, dan kebutuhan perjalanan.' },
      ]}
    />
  )
}
