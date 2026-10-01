import Image from 'next/image'
import Link from 'next/link'
import {
  BedDouble,
  Bike,
  CalendarDays,
  Car,
  ChevronRight,
  Coffee,
  Compass,
  Heart,
  MapPin,
  Mountain,
  Route,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Utensils,
  WandSparkles,
} from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import TravelSearch from '@/components/TravelSearch'
import { getFeaturedPlaces } from '@/lib/data/places'

const quickActions = [
  { label: 'Wisata', description: 'Tempat & aktivitas', href: '/explore', icon: Mountain },
  { label: 'Hotel & Stay', description: 'Hotel, villa, homestay', href: '/stay', icon: BedDouble },
  { label: 'Rental Mobil', description: 'Lepas kunci / driver', href: '/transport?vehicle=car', icon: Car },
  { label: 'Rental Motor', description: 'Praktis keliling Garut', href: '/transport?vehicle=motorbike', icon: Bike },
  { label: 'Kuliner', description: 'Cafe & makanan lokal', href: '/eat', icon: Utensils },
  { label: 'Oleh-Oleh', description: 'Produk khas Garut', href: '/eat?type=oleh-oleh', icon: ShoppingBag },
  { label: 'Event', description: 'Agenda & aktivitas', href: '/events', icon: CalendarDays },
  { label: 'Near Me', description: 'Cari yang terdekat', href: '/map', icon: MapPin },
]

const collections = [
  {
    title: 'Weekend di Garut',
    subtitle: 'Kombinasi alam, kuliner, dan tempat santai untuk 2 hari.',
    tag: '2D1N GUIDE',
    href: '/trip',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=86',
  },
  {
    title: 'Hot Spring Escape',
    subtitle: 'Cipanas, Darajat, dan pengalaman pegunungan yang hangat.',
    tag: 'RELAX',
    href: '/explore?q=Cipanas',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=86',
  },
  {
    title: 'Adventure Garut',
    subtitle: 'Gunung, trekking, dan lanskap dataran tinggi untuk yang aktif.',
    tag: 'OUTDOOR',
    href: '/explore?q=Papandayan',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=86',
  },
]

const tripSteps = [
  { icon: Compass, title: 'Temukan', text: 'Cari destinasi, stay, kuliner, transportasi, dan event dalam satu tempat.' },
  { icon: Heart, title: 'Simpan', text: 'Kumpulkan pilihan favorit untuk itinerary kamu.' },
  { icon: Route, title: 'Susun Trip', text: 'Gabungkan tempat berdasarkan area agar perjalanan lebih efisien.' },
]

function formatReviews(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return String(value)
}

export default async function Home() {
  const destinations = await getFeaturedPlaces(8)

  return (
    <main className="marketplace-page">
      <AppHeader />

      <section className="marketplace-hero">
        <div className="marketplace-hero-overlay" />
        <div className="marketplace-hero-inner">
          <div className="marketplace-hero-copy">
            <span className="marketplace-eyebrow"><Sparkles size={15} /> LOCAL TRAVEL SUPER-APP</span>
            <h1>Semua yang kamu butuhkan untuk menikmati Garut.</h1>
            <p>
              Cari tempat wisata, penginapan, rental, kuliner, event, dan rencana perjalanan lokal dari satu platform.
            </p>
          </div>
          <TravelSearch />
        </div>
      </section>

      <section className="marketplace-trust-strip" aria-label="Keunggulan VisitGarut">
        <span>Fokus 100% Garut</span>
        <span>Discovery berbasis lokasi</span>
        <span>Direktori bisnis lokal</span>
        <span>Map & itinerary ready</span>
      </section>

      <section className="marketplace-shell marketplace-quick-section">
        <div className="marketplace-section-heading compact">
          <div>
            <span className="marketplace-kicker">MAU CARI APA?</span>
            <h2>Mulai dari kebutuhan perjalananmu.</h2>
          </div>
        </div>

        <div className="quick-action-grid">
          {quickActions.map(({ label, description, href, icon: Icon }) => (
            <Link className="quick-action-card" href={href} key={label}>
              <span className="quick-action-icon"><Icon size={24} /></span>
              <strong>{label}</strong>
              <small>{description}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="marketplace-shell">
        <div className="marketplace-section-heading">
          <div>
            <span className="marketplace-kicker">TOP PICKS</span>
            <h2>Destinasi yang sedang jadi pilihan.</h2>
            <p>Mulai dari tempat ikonik hingga kawasan yang cocok untuk short escape.</p>
          </div>
          <Link href="/explore">Lihat semua <ChevronRight size={17} /></Link>
        </div>

        <div className="marketplace-place-grid">
          {destinations.map((place) => (
            <article className="marketplace-place-card" key={place.slug}>
              <Link href={`/explore/${place.slug}`}>
                <div className="marketplace-place-media">
                  {place.cover_image_url ? (
                    <Image
                      src={place.cover_image_url}
                      alt={place.name}
                      fill
                      sizes="(max-width: 720px) 78vw, (max-width: 1100px) 40vw, 25vw"
                    />
                  ) : (
                    <div className="marketplace-image-fallback" />
                  )}
                  <span className="marketplace-place-badge">{place.category?.name || 'Explore'}</span>
                </div>
                <div className="marketplace-place-copy">
                  <h3>{place.name}</h3>
                  <p><MapPin size={14} /> {place.district || 'Garut'}</p>
                  {place.short_description ? <small>{place.short_description}</small> : null}
                  <div className="marketplace-rating">
                    <Star size={14} fill="currentColor" />
                    <strong>{place.rating?.toFixed(1) ?? '—'}</strong>
                    <span>{place.review_count ? `(${formatReviews(place.review_count)})` : 'Local pick'}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="marketplace-shell">
        <div className="marketplace-section-heading">
          <div>
            <span className="marketplace-kicker">CURATED FOR YOU</span>
            <h2>Jelajahi Garut berdasarkan mood.</h2>
            <p>Inspirasi trip yang lebih gampang dipilih daripada mulai dari daftar panjang.</p>
          </div>
          <Link href="/trip">Buat itinerary <ChevronRight size={17} /></Link>
        </div>

        <div className="collection-grid">
          {collections.map((collection) => (
            <Link className="collection-card" href={collection.href} key={collection.title}>
              <Image src={collection.image} alt="" fill sizes="(max-width: 800px) 88vw, 33vw" />
              <div className="collection-overlay" />
              <div className="collection-copy">
                <span>{collection.tag}</span>
                <h3>{collection.title}</h3>
                <p>{collection.subtitle}</p>
                <strong>Explore <ChevronRight size={16} /></strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="marketplace-shell marketplace-map-panel">
        <div className="marketplace-map-copy">
          <span className="marketplace-kicker">NEARBY DISCOVERY</span>
          <h2>Lihat apa yang menarik di sekitar kamu.</h2>
          <p>
            VisitGarut sudah memakai data lokasi untuk membantu mengurutkan tempat berdasarkan jarak. Cocok saat kamu sudah berada di Garut dan ingin menentukan tujuan berikutnya.
          </p>
          <div className="marketplace-map-actions">
            <Link className="marketplace-primary-button" href="/map"><MapPin size={18} /> Cari di dekat saya</Link>
            <Link className="marketplace-secondary-button" href="/explore">Browse semua tempat</Link>
          </div>
          <div className="marketplace-map-stats">
            <span><strong>1</strong> local map</span>
            <span><strong>6+</strong> kategori utama</span>
            <span><strong>1</strong> itinerary layer</span>
          </div>
        </div>

        <div className="marketplace-map-visual" aria-hidden="true">
          <div className="marketplace-map-grid" />
          <span className="marketplace-map-route route-a" />
          <span className="marketplace-map-route route-b" />
          <span className="marketplace-map-pin pin-a"><Mountain size={16} /></span>
          <span className="marketplace-map-pin pin-b"><Coffee size={16} /></span>
          <span className="marketplace-map-pin pin-c"><BedDouble size={16} /></span>
          <span className="marketplace-map-pin pin-d"><Store size={16} /></span>
          <div className="marketplace-map-floating-card">
            <span>Nearby</span>
            <strong>Cari tempat terdekat</strong>
            <small>Wisata · Kuliner · Stay · Rental</small>
          </div>
        </div>
      </section>

      <section className="marketplace-shell marketplace-trip-panel">
        <div className="marketplace-trip-title">
          <span className="marketplace-kicker">SMART TRIP PLANNER</span>
          <h2>Dari “mau ke Garut” sampai itinerary jadi.</h2>
          <p>VisitGarut akan menjadi lapisan perencanaan lokal: discovery, shortlist, rute, dan partner booking.</p>
        </div>
        <div className="marketplace-trip-steps">
          {tripSteps.map(({ icon: Icon, title, text }, index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <Link className="marketplace-trip-cta" href="/trip"><WandSparkles size={19} /> Mulai rencanakan trip</Link>
      </section>

      <section className="marketplace-shell marketplace-partner-panel" id="local">
        <div>
          <span className="marketplace-kicker">FOR LOCAL BUSINESS</span>
          <h2>Punya hotel, rental, cafe, atau aktivitas di Garut?</h2>
          <p>
            VisitGarut disiapkan sebagai marketplace lokal. Bisnis bisa tampil di direktori, ditemukan lewat map, dan nantinya menerima leads atau booking dari traveler.
          </p>
        </div>
        <div className="marketplace-partner-actions">
          <Link className="marketplace-primary-button" href="/explore">Lihat direktori</Link>
          <a className="marketplace-secondary-button" href="https://sorotnamedia.com/contact/">Daftarkan bisnis</a>
        </div>
      </section>

      <footer className="marketplace-footer">
        <div>
          <Link className="vg-brand footer" href="/"><span className="vg-brand-mark">⌃</span><span>Visit<span>Garut</span></span></Link>
          <p>Independent local travel discovery platform for Garut, West Java.</p>
        </div>
        <div className="marketplace-footer-links">
          <Link href="/explore">Explore</Link>
          <Link href="/stay">Stay</Link>
          <Link href="/transport">Transport</Link>
          <Link href="/eat">Kuliner</Link>
          <Link href="/events">Event</Link>
          <Link href="/map">Map</Link>
        </div>
        <p>© {new Date().getFullYear()} VisitGarut. Independent platform; not affiliated with the Government of Garut Regency.</p>
      </footer>

      <MobileBottomNav />
    </main>
  )
}
