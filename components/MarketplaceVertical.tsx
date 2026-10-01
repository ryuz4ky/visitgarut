import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Car, ChevronLeft, ChevronRight, Gift, Hotel, MapPin, Search, ShoppingBag, Star, Store, TentTree } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import { getPublishedPlacesByCategory, searchPlaces, type SearchPlacesOptions } from '@/lib/data/places'

type Suggestion = { label: string; description: string; href: string }
type FilterParams = { subtype?: string; district?: string; verified?: string; amenity?: string; price?: string; sort?: string; page?: string }

type MarketplaceVerticalProps = {
  eyebrow: string
  title: string
  description: string
  categorySlug: string
  action: string
  q?: string
  filters?: FilterParams
  searchPlaceholder: string
  suggestions: Suggestion[]
  emptyTitle: string
  emptyDescription: string
}

const PAGE_SIZE = 12
const allowedSorts = new Set(['recommended', 'price_asc', 'rating_desc', 'name_asc', 'newest'])

function formatReviews(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return String(value)
}

function formatSubtype(value?: string | null) {
  if (!value) return null
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function ListingIcon({ subtype }: { subtype?: string | null }) {
  if (subtype === 'hotel' || subtype === 'villa') return <Hotel size={32} />
  if (subtype?.includes('rental')) return <Car size={32} />
  if (subtype === 'souvenir_store') return <Gift size={32} />
  if (subtype === 'tour_operator') return <TentTree size={32} />
  return <ShoppingBag size={32} />
}

function amenityKeys(value: Record<string, unknown> | unknown[] | null | undefined) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).filter(([, enabled]) => Boolean(enabled)).map(([key]) => key)
}

function buildPageHref(action: string, q: string, filters: FilterParams, page: number) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (filters.district) params.set('district', filters.district)
  if (filters.subtype) params.set('subtype', filters.subtype)
  if (filters.verified === '1') params.set('verified', '1')
  if (filters.amenity) params.set('amenity', filters.amenity)
  if (filters.price) params.set('price', filters.price)
  if (filters.sort && filters.sort !== 'recommended') params.set('sort', filters.sort)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `${action}?${query}` : action
}

export default async function MarketplaceVertical({ eyebrow, title, description, categorySlug, action, q = '', filters = {}, searchPlaceholder, suggestions, emptyTitle, emptyDescription }: MarketplaceVerticalProps) {
  const allPlaces = await getPublishedPlacesByCategory(categorySlug)
  const districts = [...new Set(allPlaces.map((place) => place.district).filter(Boolean) as string[])].sort()
  const subtypes = [...new Set(allPlaces.map((place) => place.subtype).filter(Boolean) as string[])].sort()
  const amenities = [...new Set(allPlaces.flatMap((place) => amenityKeys(place.amenities)))].sort().slice(0, 20)

  const page = Math.max(Number.parseInt(filters.page || '1', 10) || 1, 1)
  const sort = allowedSorts.has(filters.sort || '') ? filters.sort! : 'recommended'
  const searchOptions: SearchPlacesOptions = {
    categorySlug,
    query: q,
    district: filters.district,
    subtype: filters.subtype,
    verified: filters.verified === '1',
    amenity: filters.amenity,
    priceBucket: filters.price,
    sort: sort as SearchPlacesOptions['sort'],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }
  const { places, total } = await searchPlaces(searchOptions)
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const safePage = Math.min(page, totalPages)
  const hasFilters = Boolean(q.trim() || filters.district || filters.subtype || filters.verified || filters.amenity || filters.price || (filters.sort && filters.sort !== 'recommended'))

  return (
    <main className="marketplace-page vertical-page">
      <AppHeader />
      <section className="vertical-hero">
        <div className="vertical-hero-inner">
          <span className="marketplace-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <form className="vertical-search" action={action}>
            <Search size={19} />
            <input name="q" defaultValue={q} placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
            <button type="submit">Cari</button>
          </form>
        </div>
      </section>

      <section className="marketplace-shell catalog-filter-shell">
        <form className="catalog-filter-form" action={action}>
          {q ? <input type="hidden" name="q" value={q} /> : null}
          <label><span>Area</span><select name="district" defaultValue={filters.district || ''}><option value="">Semua area</option>{districts.map((district) => <option key={district} value={district}>{district}</option>)}</select></label>
          <label><span>Tipe</span><select name="subtype" defaultValue={filters.subtype || ''}><option value="">Semua tipe</option>{subtypes.map((subtype) => <option key={subtype} value={subtype}>{formatSubtype(subtype)}</option>)}</select></label>
          <label><span>Harga mulai</span><select name="price" defaultValue={filters.price || ''}><option value="">Semua harga</option><option value="under500">Di bawah Rp500 ribu</option><option value="500to1000">Rp500 ribu–Rp1 juta</option><option value="over1000">Di atas Rp1 juta</option></select></label>
          {amenities.length ? <label><span>Fasilitas</span><select name="amenity" defaultValue={filters.amenity || ''}><option value="">Semua fasilitas</option>{amenities.map((amenity) => <option key={amenity} value={amenity}>{formatSubtype(amenity)}</option>)}</select></label> : null}
          <label><span>Urutkan</span><select name="sort" defaultValue={sort}><option value="recommended">Rekomendasi</option><option value="price_asc">Harga terendah</option><option value="rating_desc">Rating VisitGarut</option><option value="name_asc">Nama A–Z</option><option value="newest">Listing terbaru</option></select></label>
          <label className="catalog-filter-check"><input type="checkbox" name="verified" value="1" defaultChecked={filters.verified === '1'} /><span><BadgeCheck size={15} /> Verified only</span></label>
          <button type="submit">Terapkan filter</button>
          {hasFilters ? <Link href={action}>Reset</Link> : null}
        </form>
      </section>

      <section className="marketplace-shell vertical-suggestions">
        <div className="marketplace-section-heading compact"><div><span className="marketplace-kicker">BROWSE BY NEED</span><h2>Pilih yang paling cocok.</h2></div></div>
        <div className="vertical-suggestion-grid">
          {suggestions.map((item) => <Link href={item.href} key={item.label}><span>{item.label}</span><p>{item.description}</p><strong>Lihat pilihan <ChevronRight size={15} /></strong></Link>)}
        </div>
      </section>

      <section className="marketplace-shell vertical-results">
        <div className="marketplace-section-heading">
          <div><span className="marketplace-kicker">LOCAL LISTINGS</span><h2>{q.trim() ? `Hasil untuk “${q}”` : hasFilters ? 'Hasil sesuai filter.' : 'Pilihan lokal di Garut.'}</h2><p>{total} listing cocok dari database VisitGarut.</p></div>
          {hasFilters ? <Link href={action}>Hapus filter</Link> : null}
        </div>

        {places.length ? (
          <>
            <div className="marketplace-place-grid">
              {places.map((place) => (
                <article className="marketplace-place-card catalog-place-card" key={place.slug}>
                  <Link href={`/explore/${place.slug}`}>
                    <div className="marketplace-place-media">
                      {place.cover_image_url ? <Image src={place.cover_image_url} alt={place.name} fill sizes="(max-width: 720px) 78vw, 25vw" /> : <div className="marketplace-image-fallback catalog-fallback"><ListingIcon subtype={place.subtype} /><span>{formatSubtype(place.subtype) || place.category?.name || 'Local listing'}</span></div>}
                      <span className="marketplace-place-badge">{formatSubtype(place.subtype) || place.category?.name || 'Local'}</span>
                      {place.data_quality === 'source_verified' || place.data_quality === 'owner_verified' ? <span className="catalog-source-badge"><BadgeCheck size={14} /> Source verified</span> : null}
                    </div>
                    <div className="marketplace-place-copy">
                      <h3>{place.name}</h3>
                      <p><MapPin size={14} /> {place.district || 'Garut'}</p>
                      {place.short_description ? <small>{place.short_description}</small> : null}
                      <div className="catalog-card-meta">
                        {place.inventory_count ? <span>{place.inventory_count} pilihan</span> : null}
                        {place.inventory_min_price != null ? <strong>Mulai {formatRupiah(place.inventory_min_price)}</strong> : <span>{place.booking_mode === 'external' ? 'Cek harga partner' : 'Tanya harga'}</span>}
                      </div>
                      <div className="marketplace-rating"><Star size={14} fill="currentColor" /><strong>{place.rating?.toFixed(1) ?? '—'}</strong><span>{place.review_count ? `(${formatReviews(place.review_count)})` : 'Belum ada review VisitGarut'}</span></div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {totalPages > 1 ? (
              <nav className="catalog-pagination" aria-label="Pagination listing">
                {safePage > 1 ? <Link href={buildPageHref(action, q, filters, safePage - 1)}><ChevronLeft size={16} /> Sebelumnya</Link> : <span />}
                <strong>Halaman {safePage} dari {totalPages}</strong>
                {safePage < totalPages ? <Link href={buildPageHref(action, q, filters, safePage + 1)}>Berikutnya <ChevronRight size={16} /></Link> : <span />}
              </nav>
            ) : null}
          </>
        ) : (
          <div className="vertical-empty-state"><div><Store size={28} /></div><h3>{emptyTitle}</h3><p>{hasFilters ? 'Tidak ada listing yang cocok dengan kombinasi filter ini. Coba longgarkan filter.' : emptyDescription}</p><Link className="marketplace-primary-button" href={action}>Reset pencarian</Link></div>
        )}
      </section>
      <MobileBottomNav />
    </main>
  )
}
