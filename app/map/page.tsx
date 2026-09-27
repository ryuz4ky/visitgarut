import type { Metadata } from 'next'
import Link from 'next/link'
import { BedDouble, Car, Coffee, Heart, MapPin, Menu, Mountain, Search, Store, Utensils } from 'lucide-react'
import NearbyPlaces from '@/components/NearbyPlaces'

export const metadata: Metadata = {
  title: 'VisitGarut Map: Peta Wisata & Bisnis Lokal Garut',
  description: 'Jelajahi wisata, kuliner, penginapan, transportasi, event, dan bisnis lokal Garut melalui satu peta interaktif.',
  alternates: { canonical: '/map' },
}

export default function MapPage() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="VisitGarut home">
          <span className="brand-mark">⌃</span>
          <span>Visit<span>Garut</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/explore">Explore</Link>
          <Link href="/stay">Stay</Link>
          <Link href="/eat">Eat</Link>
          <Link href="/transport">Transport</Link>
          <Link href="/events">Events</Link>
          <Link href="/map">Map</Link>
        </nav>
        <div className="header-actions">
          <Link className="icon-button" href="/explore" aria-label="Search"><Search size={19} /></Link>
          <button className="icon-button desktop-only" aria-label="Saved"><Heart size={19} /></button>
          <button className="login-button desktop-only">Masuk / Daftar</button>
          <button className="icon-button mobile-only" aria-label="Menu"><Menu size={21} /></button>
        </div>
      </header>

      <section className="map-page-hero">
        <div className="map-page-copy">
          <span className="kicker">VISITGARUT MAP</span>
          <h1>Satu peta untuk menjelajahi Garut.</h1>
          <p>Temukan tempat wisata, kuliner, penginapan, transportasi, event, dan bisnis lokal berdasarkan lokasi serta jarak.</p>
          <div className="map-filter-chips" aria-label="Map categories">
            <span><Mountain size={15} /> Wisata</span>
            <span><Coffee size={15} /> Cafe</span>
            <span><BedDouble size={15} /> Stay</span>
            <span><Car size={15} /> Transport</span>
            <span><Utensils size={15} /> Kuliner</span>
            <span><Store size={15} /> Bisnis</span>
          </div>
        </div>

        <div className="map-page-canvas" aria-label="Preview VisitGarut Map">
          <div className="map-grid" />
          <div className="map-road road-one" />
          <div className="map-road road-two" />
          <span className="pin pin-1"><Mountain size={16} /></span>
          <span className="pin pin-2"><Coffee size={16} /></span>
          <span className="pin pin-3"><BedDouble size={16} /></span>
          <span className="pin pin-4"><Utensils size={16} /></span>
          <span className="pin pin-5"><Store size={16} /></span>
          <div className="map-label label-papandayan">Papandayan</div>
          <div className="map-label label-garut"><MapPin size={14} /> Garut Kota</div>
        </div>
      </section>

      <NearbyPlaces />
    </main>
  )
}
