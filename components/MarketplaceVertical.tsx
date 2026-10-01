import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, MapPin, Search, Star, Store } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import { getPublishedPlacesByCategory } from '@/lib/data/places'

type Suggestion = {
  label: string
  description: string
  href: string
}

type MarketplaceVerticalProps = {
  eyebrow: string
  title: string
  description: string
  categorySlug: string
  action: string
  q?: string
  searchPlaceholder: string
  suggestions: Suggestion[]
  emptyTitle: string
  emptyDescription: string
}

function formatReviews(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return String(value)
}

export default async function MarketplaceVertical({
  eyebrow,
  title,
  description,
  categorySlug,
  action,
  q = '',
  searchPlaceholder,
  suggestions,
  emptyTitle,
  emptyDescription,
}: MarketplaceVerticalProps) {
  const allPlaces = await getPublishedPlacesByCategory(categorySlug)
  const query = q.trim().toLowerCase()
  const places = query
    ? allPlaces.filter((place) =>
        [place.name, place.district, place.short_description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      )
    : allPlaces

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

      <section className="marketplace-shell vertical-suggestions">
        <div className="marketplace-section-heading compact">
          <div>
            <span className="marketplace-kicker">BROWSE BY NEED</span>
            <h2>Pilih yang paling cocok.</h2>
          </div>
        </div>
        <div className="vertical-suggestion-grid">
          {suggestions.map((item) => (
            <Link href={item.href} key={item.label}>
              <span>{item.label}</span>
              <p>{item.description}</p>
              <strong>Lihat pilihan <ChevronRight size={15} /></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="marketplace-shell vertical-results">
        <div className="marketplace-section-heading">
          <div>
            <span className="marketplace-kicker">LOCAL LISTINGS</span>
            <h2>{query ? `Hasil untuk “${q}”` : 'Pilihan lokal di Garut.'}</h2>
            <p>{places.length} listing tersedia dari database VisitGarut saat ini.</p>
          </div>
          {query ? <Link href={action}>Hapus pencarian</Link> : null}
        </div>

        {places.length ? (
          <div className="marketplace-place-grid">
            {places.map((place) => (
              <article className="marketplace-place-card" key={place.slug}>
                <Link href={`/explore/${place.slug}`}>
                  <div className="marketplace-place-media">
                    {place.cover_image_url ? (
                      <Image src={place.cover_image_url} alt={place.name} fill sizes="(max-width: 720px) 78vw, 25vw" />
                    ) : (
                      <div className="marketplace-image-fallback" />
                    )}
                    <span className="marketplace-place-badge">{place.category?.name || 'Local'}</span>
                  </div>
                  <div className="marketplace-place-copy">
                    <h3>{place.name}</h3>
                    <p><MapPin size={14} /> {place.district || 'Garut'}</p>
                    {place.short_description ? <small>{place.short_description}</small> : null}
                    <div className="marketplace-rating">
                      <Star size={14} fill="currentColor" />
                      <strong>{place.rating?.toFixed(1) ?? '—'}</strong>
                      <span>{place.review_count ? `(${formatReviews(place.review_count)})` : 'New listing'}</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="vertical-empty-state">
            <div><Store size={28} /></div>
            <h3>{emptyTitle}</h3>
            <p>{emptyDescription}</p>
            <a className="marketplace-primary-button" href="https://sorotnamedia.com/contact/">Daftarkan bisnis</a>
          </div>
        )}
      </section>

      <MobileBottomNav />
    </main>
  )
}
