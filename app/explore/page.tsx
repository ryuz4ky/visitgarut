import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart, MapPin, Menu, Search, Star } from 'lucide-react'
import { getPublishedPlaces } from '@/lib/data/places'

export const metadata: Metadata = {
  title: 'Explore Garut: Tempat Wisata & Destinasi Pilihan',
  description: 'Jelajahi tempat wisata dan destinasi pilihan di Garut. Temukan kawasan pegunungan, pemandian air panas, danau, dan pengalaman lokal.',
  alternates: {
    canonical: '/explore',
  },
}

type ExplorePageProps = {
  searchParams: Promise<{ q?: string }>
}

function formatReviews(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return String(value)
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q = '' } = await searchParams
  const allPlaces = await getPublishedPlaces()
  const query = q.trim().toLowerCase()
  const places = query
    ? allPlaces.filter((place) =>
        [place.name, place.district, place.category?.name, place.short_description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      )
    : allPlaces

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
          <Link href="/#local">Local Business</Link>
        </nav>
        <div className="header-actions">
          <Link className="icon-button" href="/explore" aria-label="Search"><Search size={19} /></Link>
          <button className="icon-button desktop-only" aria-label="Saved"><Heart size={19} /></button>
          <button className="login-button desktop-only">Masuk / Daftar</button>
          <button className="icon-button mobile-only" aria-label="Menu"><Menu size={21} /></button>
        </div>
      </header>

      <section className="directory-hero">
        <div>
          <span className="kicker">EXPLORE GARUT</span>
          <h1>Temukan tempat terbaik di Garut.</h1>
          <p>Dari kawah vulkanik sampai pemandian air panas dan wisata keluarga, mulai perjalananmu dari sini.</p>
          <form className="directory-search" action="/explore">
            <Search size={20} />
            <input name="q" defaultValue={q} placeholder="Cari destinasi atau kecamatan..." aria-label="Cari destinasi" />
            <button type="submit">Cari</button>
          </form>
        </div>
      </section>

      <section className="directory-shell">
        <div className="directory-toolbar">
          <div>
            <strong>{places.length} destinasi</strong>
            <span>{query ? `Hasil pencarian “${q}”` : 'Pilihan untuk mulai menjelajah Garut'}</span>
          </div>
          {query ? <Link href="/explore">Hapus pencarian</Link> : null}
        </div>

        {places.length ? (
          <div className="directory-grid">
            {places.map((place) => (
              <article className="destination-card" key={place.slug}>
                <Link href={`/explore/${place.slug}`}>
                  <div className="destination-image" style={{ backgroundImage: place.cover_image_url ? `url(${place.cover_image_url})` : undefined }}>
                    <span className="destination-badge">{place.category?.name ?? 'Explore'}</span>
                  </div>
                  <div className="destination-body">
                    <h2>{place.name}</h2>
                    <p><MapPin size={14} /> {place.district ? `Kec. ${place.district}` : 'Kabupaten Garut'}</p>
                    {place.short_description ? <p className="card-description">{place.short_description}</p> : null}
                    <div className="rating"><Star size={14} fill="currentColor" /> {place.rating?.toFixed(1) ?? '—'} <span>({formatReviews(place.review_count)})</span></div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Belum ada hasil.</h2>
            <p>Coba nama destinasi atau kecamatan lain.</p>
            <Link className="primary-button" href="/explore">Lihat semua destinasi</Link>
          </div>
        )}
      </section>
    </main>
  )
}
