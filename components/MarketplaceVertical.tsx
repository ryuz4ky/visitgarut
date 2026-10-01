import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Car, ChevronRight, Gift, Hotel, MapPin, Search, ShoppingBag, Star, Store, TentTree } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import { getInventoryFacets, getPublishedPlacesByCategory } from '@/lib/data/places'

type Suggestion = { label: string; description: string; href: string }
type FilterParams = { subtype?: string; district?: string; verified?: string; amenity?: string; price?: string }

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

export default async function MarketplaceVertical({ eyebrow, title, description, categorySlug, action, q = '', filters = {}, searchPlaceholder, suggestions, emptyTitle, emptyDescription }: MarketplaceVerticalProps) {
  const allPlaces = await getPublishedPlacesByCategory(categorySlug)
  const inventory = await getInventoryFacets(allPlaces.map((place) => place.id).filter(Boolean) as string[])
  const query = q.trim().toLowerCase()

  const districts = [...new Set(allPlaces.map((place) => place.district).filter(Boolean) as string[])].sort()
  const subtypes = [...new Set(allPlaces.map((place) => place.subtype).filter(Boolean) as string[])].sort()
  const amenities = [...new Set(allPlaces.flatMap((place) => amenityKeys(place.amenities)))].sort().slice(0, 20)

  const places = allPlaces.filter((place) => {
    const facet = place.id ? inventory[place.id] : undefined
    if (query && ![place.name, place.district, place.short_description, place.subtype, ...(place.tags ?? [])].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))) return false
    if (filters.district && place.district !== filters.district) return false
    if (filters.subtype && place.subtype !== filters.subtype) return false
    if (filters.verified === '1' && !(place.is_verified || place.data_quality === 'source_verified' || place.data_quality === 'owner_verified')) return false
    if (filters.amenity && !amenityKeys(place.amenities).includes(filters.amenity)) return false
    if (filters.price) {
      const minPrice = facet?.minPrice ?? null
      if (minPrice == null) return false
      if (filters.price === 'under500' && minPrice >= 500000) return false
      if (filters.price === '500to1000' && (minPrice < 500000 || minPrice > 1000000)) return false
      if (filters.price === 'over1000' && minPrice <= 1000000) return false
    }
    return true
  })

  const hasFilters = Boolean(query || filters.district || filters.subtype || filters.verified || filters.amenity || filters.price)

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
          <div><span className="marketplace-kicker">LOCAL LISTINGS</span><h2>{query ? `Hasil untuk “${q}”` : hasFilters ? 'Hasil sesuai filter.' : 'Pilihan lokal di Garut.'}</h2><p>{places.length} listing cocok dari database VisitGarut.</p></div>
          {hasFilters ? <Link href={action}>Hapus filter</Link> : null}
        </div>

        {places.length ? (
          <div className="marketplace-place-grid">
            {places.map((place) => {
              const facet = place.id ? inventory[place.id] : undefined
              return (
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
                        {facet?.itemCount ? <span>{facet.itemCount} pilihan</span> : null}
                        {facet?.minPrice != null ? <strong>Mulai {formatRupiah(facet.minPrice)}</strong> : <span>{place.booking_mode === 'external' ? 'Cek harga partner' : 'Tanya harga'}</span>}
                      </div>
                      <div className="marketplace-rating"><Star size={14} fill="currentColor" /><strong>{place.rating?.toFixed(1) ?? '—'}</strong><span>{place.review_count ? `(${formatReviews(place.review_count)})` : 'Belum ada review VisitGarut'}</span></div>
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="vertical-empty-state"><div><Store size={28} /></div><h3>{emptyTitle}</h3><p>{hasFilters ? 'Tidak ada listing yang cocok dengan kombinasi filter ini. Coba longgarkan filter.' : emptyDescription}</p><Link className="marketplace-primary-button" href={action}>Reset pencarian</Link></div>
        )}
      </section>
      <MobileBottomNav />
    </main>
  )
}
