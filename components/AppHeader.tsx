import Link from 'next/link'
import { Heart, Menu, Search } from 'lucide-react'

export default function AppHeader() {
  return (
    <header className="vg-header">
      <Link className="vg-brand" href="/" aria-label="VisitGarut home">
        <span className="vg-brand-mark">⌃</span>
        <span>Visit<span>Garut</span></span>
      </Link>

      <nav className="vg-desktop-nav" aria-label="Navigasi utama">
        <Link href="/explore">Wisata</Link>
        <Link href="/stay">Stay</Link>
        <Link href="/transport">Transport</Link>
        <Link href="/eat">Kuliner</Link>
        <Link href="/events">Event</Link>
        <Link href="/map">Map</Link>
      </nav>

      <div className="vg-header-actions">
        <Link className="vg-icon-button" href="/explore" aria-label="Cari"><Search size={19} /></Link>
        <Link className="vg-icon-button vg-desktop-only" href="/trip" aria-label="Rencana perjalanan"><Heart size={19} /></Link>
        <Link className="vg-login-button vg-desktop-only" href="/trip">Rencanakan Trip</Link>
        <Link className="vg-icon-button vg-mobile-only" href="/explore" aria-label="Buka eksplorasi"><Menu size={21} /></Link>
      </div>
    </header>
  )
}
