import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, MapPin, Star } from 'lucide-react'
import { getPlaceBySlug, getPublishedPlaceSlugs } from '@/lib/data/places'
import { absoluteUrl } from '@/lib/site'

type PlacePageProps = {
  params: Promise<{ slug: string }>
}

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
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

  const title = place.seo_title || `${place.name}, Garut: Panduan Wisata & Informasi`
  const description = place.seo_description || place.short_description || `Panduan mengunjungi ${place.name} di Garut.`

  return {
    title,
    description,
    alternates: {
      canonical: `/explore/${place.slug}`,
    },
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

  const description = place.description || place.short_description || `${place.name} merupakan salah satu tempat yang dapat dijelajahi di Kabupaten Garut.`
  const placeUrl = absoluteUrl(`/explore/${place.slug}`)
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
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: place.latitude,
            longitude: place.longitude,
          },
        }
      : {}),
    ...(place.cover_image_url ? { image: [place.cover_image_url] } : {}),
    ...(place.website_url ? { sameAs: [place.website_url] } : {}),
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
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />

      <header className="detail-header">
        <Link href="/explore" className="back-link"><ChevronLeft size={18} /> Explore</Link>
        <Link className="brand" href="/" aria-label="VisitGarut home">
          <span className="brand-mark">⌃</span>
          <span>Visit<span>Garut</span></span>
        </Link>
      </header>

      <section
        className="place-hero"
        style={{ backgroundImage: place.cover_image_url ? `linear-gradient(180deg, rgba(4,35,27,.12), rgba(4,35,27,.74)), url(${place.cover_image_url})` : undefined }}
      >
        <div className="place-hero-content">
          <span className="place-category">{place.category?.name || 'Explore Garut'}</span>
          <h1>{place.name}</h1>
          <p><MapPin size={17} /> {place.district ? `${place.district}, Kabupaten Garut` : 'Kabupaten Garut, Jawa Barat'}</p>
        </div>
      </section>

      <section className="place-content-shell">
        <article className="place-main-content">
          <div className="place-summary-bar">
            <div>
              <span>Rating</span>
              <strong><Star size={17} fill="currentColor" /> {place.rating?.toFixed(1) ?? '—'}</strong>
            </div>
            <div>
              <span>Area</span>
              <strong>{place.district || 'Garut'}</strong>
            </div>
            <div>
              <span>Kategori</span>
              <strong>{place.category?.name || 'Tempat'}</strong>
            </div>
          </div>

          <div className="place-copy">
            <span className="kicker">TENTANG TEMPAT INI</span>
            <h2>Mengenal {place.name}</h2>
            <p>{description}</p>
            <p>
              VisitGarut sedang membangun panduan lokal yang lebih lengkap untuk tempat ini, termasuk rute, jam terbaik untuk berkunjung, biaya, fasilitas, dan rekomendasi di sekitar lokasi.
            </p>
          </div>
        </article>

        <aside className="place-sidebar">
          <div className="info-card">
            <span className="kicker">PLAN YOUR VISIT</span>
            <h2>Siapkan perjalananmu.</h2>
            <p>Gunakan VisitGarut untuk menemukan tempat lain di sekitar area ini.</p>
            <Link href="/trip" className="primary-button">Tambahkan ke rencana trip</Link>
          </div>
        </aside>
      </section>
    </main>
  )
}
