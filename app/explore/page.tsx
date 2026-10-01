import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, ChevronLeft, ChevronRight, MapPin, Search, Star } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import { getPublishedPlaces, searchPlaces, type SearchPlacesOptions } from '@/lib/data/places'

export const metadata: Metadata = {
  title: 'Explore Garut: Wisata, Stay, Kuliner & Bisnis Lokal',
  description: 'Jelajahi destinasi, penginapan, kuliner, transportasi, dan bisnis lokal di Garut dengan pencarian dan filter area.',
  alternates: { canonical: '/explore' },
}

type ExplorePageProps = {
  searchParams: Promise<{ q?: string; category?: string; district?: string; subtype?: string; verified?: string; sort?: string; page?: string }>
}

const PAGE_SIZE = 18
const allowedSorts = new Set(['recommended', 'rating_desc', 'name_asc', 'newest'])

function formatReviews(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return String(value)
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function buildPageHref(params: { q: string; category: string; district: string; subtype: string; verified: string; sort: string }, page: number) {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.category) query.set('category', params.category)
  if (params.district) query.set('district', params.district)
  if (params.subtype) query.set('subtype', params.subtype)
  if (params.verified === '1') query.set('verified', '1')
  if (params.sort && params.sort !== 'recommended') query.set('sort', params.sort)
  if (page > 1) query.set('page', String(page))
  const qs = query.toString()
  return qs ? `/explore?${qs}` : '/explore'
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q = '', category = '', district = '', subtype = '', verified = '', sort: rawSort = '', page: rawPage = '' } = await searchParams
  const allPlaces = await getPublishedPlaces()
  const categories = [...new Map(allPlaces.filter((place) => place.category).map((place) => [place.category!.slug, place.category!.name])).entries()]
  const districts = [...new Set(allPlaces.map((place) => place.district).filter(Boolean) as string[])].sort()
  const subtypes = [...new Set(allPlaces.map((place) => place.subtype).filter(Boolean) as string[])].sort()

  const page = Math.max(Number.parseInt(rawPage || '1', 10) || 1, 1)
  const sort = allowedSorts.has(rawSort) ? rawSort : 'recommended'
  const options: SearchPlacesOptions = {
    categorySlug: category || undefined,
    query: q,
    district: district || undefined,
    subtype: subtype || undefined,
    verified: verified === '1',
    sort: sort as SearchPlacesOptions['sort'],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }
  const { places, total } = await searchPlaces(options)
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const safePage = Math.min(page, totalPages)
  const hasFilters = Boolean(q.trim() || category || district || subtype || verified || (sort && sort !== 'recommended'))
  const paginationParams = { q, category, district, subtype, verified, sort }

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
          <label><span>Urutkan</span><select name="sort" defaultValue={sort}><option value="recommended">Rekomendasi</option><option value="rating_desc">Rating VisitGarut</option><option value="name_asc">Nama A–Z</option><option value="newest">Listing terbaru</option></select></label>
          <label className="catalog-filter-check"><input type="checkbox" name="verified" value="1" defaultChecked={verified === '1'} /><span><BadgeCheck size={15} /> Verified only</span></label>
          <button type="submit">Terapkan filter</button>
          {hasFilters ? <Link href="/explore">Reset</Link> : null}
        </form>
      </section>

      <section className="directory-shell">
        <div className="directory-toolbar">
          <div><strong>{total} listing</strong><span>{hasFilters ? 'Hasil sesuai pencarian dan filter' : 'Semua inventory publik VisitGarut'}</span></div>
          <Link href="/map">Lihat di map</Link>
        </div>

        {places.length ? (
          <>
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
                      <div className="catalog-card-meta">
                        {place.inventory_count ? <span>{place.inventory_count} pilihan</span> : <span>{place.category?.name ?? 'Listing lokal'}</span>}
                      </div>
                      <div className="rating"><Star size={14} fill="currentColor" /> {place.rating?.toFixed(1) ?? '—'} <span>({formatReviews(place.review_count)})</span></div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
            {totalPages > 1 ? (
              <nav className="catalog-pagination" aria-label="Pagination Explore">
                {safePage > 1 ? <Link href={buildPageHref(paginationParams, safePage - 1)}><ChevronLeft size={16} /> Sebelumnya</Link> : <span />}
                <strong>Halaman {safePage} dari {totalPages}</strong>
                {safePage < totalPages ? <Link href={buildPageHref(paginationParams, safePage + 1)}>Berikutnya <ChevronRight size={16} /></Link> : <span />}
              </nav>
            ) : null}
          </>
        ) : (
          <div className="empty-state"><h2>Belum ada hasil.</h2><p>Coba longgarkan kategori, area, tipe, atau verified filter.</p><Link className="primary-button" href="/explore">Lihat semua listing</Link></div>
        )}
      </section>
      <MobileBottomNav />
    </main>
  )
}
