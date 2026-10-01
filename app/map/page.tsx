import type { Metadata } from 'next'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import NearbyPlaces from '@/components/NearbyPlaces'
import InventoryMap from '@/components/InventoryMap'
import { getMapPlaces } from '@/lib/data/places'

export const metadata: Metadata = {
  title: 'VisitGarut Map: Peta Wisata & Bisnis Lokal Garut',
  description: 'Jelajahi wisata, kuliner, penginapan, transportasi, event, dan bisnis lokal Garut melalui peta interaktif berbasis inventory VisitGarut.',
  alternates: { canonical: '/map' },
}

export default async function MapPage() {
  const places = await getMapPlaces()
  const mapPlaces = places.map((place) => ({
    id: String(place.id),
    name: place.name,
    slug: place.slug,
    district: place.district,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    category_name: place.category?.name ?? null,
    category_slug: place.category?.slug ?? null,
    subtype: place.subtype ?? null,
    is_verified: Boolean(place.is_verified),
    price_label: place.price_label ?? null,
  }))

  return (
    <main className="marketplace-page map-inventory-page">
      <AppHeader />
      <section className="map-inventory-hero">
        <div>
          <span className="marketplace-eyebrow">VISITGARUT MAP</span>
          <h1>Lihat Garut sebagai satu travel marketplace.</h1>
          <p>Bandingkan lokasi wisata, stay, kuliner, transportasi, dan bisnis lokal di satu peta. Filter listing, pilih titik, lalu lanjut ke detail atau gunakan Near Me.</p>
        </div>
      </section>
      <div className="marketplace-shell map-inventory-content">
        <InventoryMap places={mapPlaces} />
        <NearbyPlaces />
      </div>
      <MobileBottomNav />
    </main>
  )
}
