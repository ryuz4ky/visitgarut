import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, BriefcaseBusiness, ChevronLeft, Clock3, ExternalLink, MapPin, Navigation, Phone, Route, Star, Tag } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import FavoriteButton from '@/components/FavoriteButton'
import MobileBottomNav from '@/components/MobileBottomNav'
import BookingInquiry from '@/components/BookingInquiry'
import ReviewSection from '@/components/ReviewSection'
import { getPlaceBySlug, getPublishedPlaceSlugs } from '@/lib/data/places'
import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site'

type PlacePageProps = {
  params: Promise<{ slug: string }>
}

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function getAmenities(value: Record<string, unknown> | unknown[] | null | undefined) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).slice(0, 10)
  if (!value || typeof value !== 'object') return []
  return Object.entries(value)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => key.replace(/[_-]+/g, ' '))
    .slice(0, 10)
}

function getOpeningHours(value: Record<string, unknown> | null | undefined) {
  if (!value) return []
  return Object.entries(value)
    .filter(([, hours]) => typeof hours === 'string' && hours.trim())
    .slice(0, 7) as Array<[string, string]>
}

export async function generateStaticParams() {
  const slugs = await getPublishedPlaceSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { slug } = await params
  const place = await getPlaceBySlug(slug)

  if (!place) {
    return {
      title: 'Destinasi Tidak Ditemukan',
      robots: { index: false, follow: false },
    }
  }

  const title = place.seo_title || `${place.name}, Garut: Panduan & Informasi`
  const description = place.seo_description || place.short_description || `Panduan mengunjungi ${place.name} di Garut.`

  return {
    title,
    description,
    alternates: { canonical: `/explore/${place.slug}` },
    openGraph: {
      title: `${title} | VisitGarut`,
      description,
      type: 'article',
      url: absoluteUrl(`/explore/${place.slug}`),
      images: place.cover_image_url ? [{ url: place.cover_image_url }] : undefined,
    },
  }
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params
  const place = await getPlaceBySlug(slug)

  if (!place) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialFavorite = false
  let offers: Array<{ id: string; title: string; description: string | null; promo_code: string | null; price_label: string | null; cta_url: string | null; valid_until: string | null }> = []
  let reviews: Array<{ id: string; rating: number; body: string | null; status: string; created_at: string; user_id: string; profile: { full_name: string | null; username: string | null } | null }> = []

  if (place.id) {
    const queries = await Promise.all([
      user
        ? supabase.from('favorites').select('place_id').eq('user_id', user.id).eq('place_id', place.id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('offers')
        .select('id, title, description, promo_code, price_label, cta_url, valid_until')
        .eq('place_id', place.id)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .limit(3),
      supabase
        .from('reviews')
        .select('id, rating, body, status, created_at, user_id, profile:profiles(full_name, username)')
        .eq('place_id', place.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    initialFavorite = Boolean(queries[0].data)
    offers = (queries[1].data ?? []) as typeof offers
    reviews = (queries[2].data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      rating: Number(row.rating),
      body: (row.body as string | null) ?? null,
      status: String(row.status),
      created_at: String(row.created_at),
      user_id: String(row.user_id),
      profile: Array.isArray(row.profile)
        ? (row.profile[0] as { full_name: string | null; username: string | null } | undefined) ?? null
        : (row.profile as { full_name: string | null; username: string | null } | null) ?? null,
    }))
  }

  const description = place.description || place.short_description || `${place.name} merupakan salah satu tempat yang dapat dijelajahi di Kabupaten Garut.`
  const placeUrl = absoluteUrl(`/explore/${place.slug}`)
  const amenities = getAmenities(place.amenities)
  const openingHours = getOpeningHours(place.opening_hours)
  const whatsappNumber = place.whatsapp?.replace(/\D/g, '')

  const publishedReviews = reviews.filter((review) => review.status === 'published')
  const userReviewRating = publishedReviews.length
    ? publishedReviews.reduce((sum, review) => sum + review.rating, 0) / publishedReviews.length
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': place.category?.slug === 'wisata' ? 'TouristAttraction' : 'Place',
    name: place.name,
    description,
    url: placeUrl,
    address: {
      '@type': 'PostalAddress',
      ...(place.address ? { streetAddress: place.address } : {}),
      addressLocality: place.district || 'Garut',
      addressRegion: 'Jawa Barat',
      addressCountry: 'ID',
    },
    ...(place.latitude != null && place.longitude != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude } }
      : {}),
    ...(place.cover_image_url ? { image: [place.cover_image_url] } : {}),
    ...(place.website_url ? { sameAs: [place.website_url] } : {}),
    ...(userReviewRating != null
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(userReviewRating.toFixed(1)), reviewCount: publishedReviews.length, bestRating: 5, worstRating: 1 } }
      : {}),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'VisitGarut', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Explore', item: absoluteUrl('/explore') },
      { '@type': 'ListItem', position: 3, name: place.name, item: placeUrl },
    ],
  }

  return (
    <main className="marketplace-page place-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      <AppHeader />

      <section
        className="place-hero place-hero-rich"
        style={{ backgroundImage: place.cover_image_url ? `linear-gradient(180deg, rgba(4,35,27,.12), rgba(4,35,27,.76)), url(${place.cover_image_url})` : undefined }}
      >
        <div className="place-hero-content rich">
          <Link href="/explore" className="place-back-link"><ChevronLeft size={17} /> Explore</Link>
          <div className="place-title-row">
            <span className="place-category">{place.category?.name || 'Explore Garut'}</span>
            {place.is_verified ? <span className="verified-badge"><BadgeCheck size={15} /> Verified</span> : null}
          </div>
          <h1>{place.name}</h1>
          <p><MapPin size={17} /> {place.district ? `${place.district}, Kabupaten Garut` : 'Kabupaten Garut, Jawa Barat'}</p>
        </div>
      </section>

      <section className="place-content-shell rich-place-shell">
        <article className="place-main-content">
          <div className="place-action-bar">
            {place.id ? <FavoriteButton placeId={place.id} initialFavorite={initialFavorite} loggedIn={Boolean(user)} /> : null}
            <Link className="place-action-link primary" href={user ? `/trip?place=${encodeURIComponent(place.slug)}` : `/login?next=${encodeURIComponent(`/trip?place=${place.slug}`)}`}><Route size={18} /> Tambah ke trip</Link>
            {place.google_maps_url ? <a className="place-action-link" href={place.google_maps_url} target="_blank" rel="noreferrer"><Navigation size={18} /> Petunjuk arah</a> : null}
          </div>

          <div className="place-summary-bar">
            <div><span>Rating VisitGarut</span><strong><Star size={17} fill="currentColor" /> {userReviewRating != null ? userReviewRating.toFixed(1) : 'Baru'}</strong></div>
            <div><span>Area</span><strong>{place.district || 'Garut'}</strong></div>
            <div><span>Kategori</span><strong>{place.category?.name || 'Tempat'}</strong></div>
            <div><span>Harga</span><strong>{place.price_label || 'Cek di lokasi'}</strong></div>
          </div>

          <div className="place-copy">
            <span className="marketplace-kicker">TENTANG TEMPAT INI</span>
            <h2>Mengenal {place.name}</h2>
            <p>{description}</p>
          </div>

          {amenities.length ? (
            <div className="place-detail-block">
              <span className="marketplace-kicker">FASILITAS & FITUR</span>
              <h2>Yang tersedia</h2>
              <div className="amenity-chip-grid">{amenities.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          ) : null}

          {place.tags?.length ? (
            <div className="place-detail-block compact">
              <span className="marketplace-kicker">TAGS</span>
              <div className="place-tag-row">{place.tags.map((tag) => <span key={tag}><Tag size={13} /> {tag}</span>)}</div>
            </div>
          ) : null}

          {offers.length ? (
            <div className="place-detail-block">
              <span className="marketplace-kicker">OFFERS</span>
              <h2>Promo dari partner</h2>
              <div className="place-offer-grid">
                {offers.map((offer) => (
                  <article key={offer.id}>
                    <span>LOCAL OFFER</span>
                    <h3>{offer.title}</h3>
                    {offer.description ? <p>{offer.description}</p> : null}
                    {offer.price_label ? <strong>{offer.price_label}</strong> : null}
                    {offer.promo_code ? <code>{offer.promo_code}</code> : null}
                    {offer.cta_url ? <a href={offer.cta_url} target="_blank" rel="noreferrer">Lihat penawaran <ExternalLink size={14} /></a> : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <aside className="place-sidebar rich-sidebar">
          {place.id ? <BookingInquiry placeId={place.id} placeName={place.name} userId={user?.id ?? null} whatsappNumber={whatsappNumber} /> : null}

          <div className="info-card place-info-card">
            <span className="marketplace-kicker">PLAN YOUR VISIT</span>
            <h2>Informasi praktis</h2>
            {place.address ? <p><MapPin size={16} /><span>{place.address}</span></p> : null}
            {place.phone ? <a href={`tel:${place.phone}`}><Phone size={16} /> {place.phone}</a> : null}
            {place.website_url ? <a href={place.website_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Website</a> : null}
          </div>

          {openingHours.length ? (
            <div className="info-card opening-hours-card">
              <span className="marketplace-kicker"><Clock3 size={14} /> JAM BUKA</span>
              <div>{openingHours.map(([day, hours]) => <p key={day}><span>{day}</span><strong>{hours}</strong></p>)}</div>
            </div>
          ) : null}

          {place.id ? (
            <div className="info-card claim-card">
              <BriefcaseBusiness size={24} />
              <h3>Pemilik tempat ini?</h3>
              <p>Claim listing untuk memperbarui informasi, menerima inquiry, dan membuat offer bisnis.</p>
              <Link href={user ? `/claim/${place.slug}` : `/login?next=${encodeURIComponent(`/claim/${place.slug}`)}`}>Claim bisnis</Link>
            </div>
          ) : null}
        </aside>
      </section>

      {place.id ? (
        <div className="marketplace-shell transaction-review-shell">
          <ReviewSection placeId={place.id} placeSlug={place.slug} userId={user?.id ?? null} reviews={reviews} />
        </div>
      ) : null}

      <MobileBottomNav />
    </main>
  )
}
