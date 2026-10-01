import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, MapPin, Search, Star } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import { getPublishedPlaces } from '@/lib/data/places'

export const metadata: Metadata = {
  title: 'Explore Garut: Wisata, Stay, Kuliner & Bisnis Lokal',
  description: 'Jelajahi destinasi, penginapan, kuliner, transportasi, dan bisnis lokal di Garut dengan pencarian dan filter area.',
  alternates: { canonical: '/explore' },
}

type ExplorePageProps = {
  searchParams: Promise<{ q?: string; category?: string; district?: string; subtype?: string; verified?: string }>
}

function formatReviews(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return String(value)
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q = '', category = '', district = '', subtype = '', verified = '' } = await searchParams
  const allPlaces = await getPublishedPlaces()
  const query = q.trim().toLowerCase()

  const categories = [...new Map(allPlaces.filter((place) => place.category).map((place) => [place.category!.slug, place.category!.name])).entries()]
  const districts = [...new Set(allPlaces.map((place) => place.district).filter(Boolean) as string[])].sort()
  const subtypes = [...new Set(allPlaces.map((place) => place.subtype).filter(Boolean) as string[])].sort()

  const places = allPlaces.filter((place) => {
    if (query && ![place.name, place.district, place.category?.name, place.short_description, place.subtype, ...(place.tags ?? [])].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))) return false
    if (category && place.category?.slug !== category) return false
    if (district && place.district !== district) return false
    if (subtype && place.subtype !== subtype) return false
    if (verified === '1' && !(place.is_verified || place.data_quality === 'source_verified' || place.data_quality === 'owner_verified')) return false
    return true
  })

  const hasFilters = Boolean(query || category || district || subtype || verified)

  return (
    <main className="marketplace-page">
      <AppHeader />
      <section className="directory-hero">
        <div>
          <span className="kicker">EXPLORE GARUT</span>
          <h1>Temukan tempat terbaik di Garut.</h1>
          <p>Cari lintas wisata, stay, kuliner, transportasi, dan bisnis lokal dalam satu discovery layer.</p>
          <form className="directory-search" action="/explore">
            <Search size={20} />
            <input name="q" defaultValue={q} placeholder="Cari tempat, area, tipe, atau kebutuhan..." aria-label="Cari VisitGarut" />
            <button type="submit">Cari</button>
          </form>
        </div>
      </section>

      <section className="marketplace-shell catalog-filter-shell">
        <form className="catalog-filter-form explore-filter-form" action="/explore">
          {q ? <input type="hidden" name="q" value={q} /> : null}
          <label><span>Kategori</span><select name="category" defaultValue={category}><option value="">Semua kategori</option>{categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></label>
          <label><span>Area</span><select name="district" defaultValue={district}><option value="">Semua area</option>{districts.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label><span>Tipe</span><select name="subtype" defaultValue={subtype}><option value="">Semua tipe</option>{subtypes.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}</select></label>
          <label className="catalog-filter-check"><input type="checkbox" name="verified" value="1" defaultChecked={verified === '1'} /><span><BadgeCheck size={15} /> Verified only</span></label>
          <button type="submit">Terapkan filter</button>
          {hasFilters ? <Link href="/explore">Reset</Link> : null}
        </form>
      </section>

      <section className="directory-shell">
        <div className="directory-toolbar">
          <div><strong>{places.length} listing</strong><span>{hasFilters ? 'Hasil sesuai pencarian dan filter' : 'Semua inventory publik VisitGarut'}</span></div>
          <Link href="/map">Lihat di map</Link>
        </div>

        {places.length ? (
          <div className="directory-grid">
            {places.map((place) => (
              <article className="destination-card catalog-place-card" key={place.slug}>
                <Link href={`/explore/${place.slug}`}>
                  <div className="destination-image" style={{ backgroundImage: place.cover_image_url ? `url(${place.cover_image_url})` : undefined }}>
                    <span className="destination-badge">{place.subtype ? formatLabel(place.subtype) : place.category?.name ?? 'Explore'}</span>
                    {place.data_quality === 'source_verified' || place.data_quality === 'owner_verified' ? <span className="catalog-source-badge"><BadgeCheck size={14} /> Source verified</span> : null}
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
          <div className="empty-state"><h2>Belum ada hasil.</h2><p>Coba longgarkan kategori, area, tipe, atau verified filter.</p><Link className="primary-button" href="/explore">Lihat semua listing</Link></div>
        )}
      </section>
      <MobileBottomNav />
    </main>
  )
}
