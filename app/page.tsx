import Link from 'next/link'
import {
  BedDouble,
  CalendarDays,
  Car,
  ChevronRight,
  Coffee,
  Compass,
  Heart,
  MapPin,
  Menu,
  Mountain,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Utensils,
} from 'lucide-react'
import { getFeaturedPlaces } from '@/lib/data/places'

const categories = [
  { label: 'Atraksi Wisata', icon: Mountain, href: '/explore' },
  { label: 'Cafe & Kuliner', icon: Coffee, href: '/eat' },
  { label: 'Hotel & Penginapan', icon: BedDouble, href: '/stay' },
  { label: 'Rental Motor', icon: Compass, href: '/transport' },
  { label: 'Rental Mobil', icon: Car, href: '/transport' },
  { label: 'Oleh-Oleh', icon: ShoppingBag, href: '/eat' },
  { label: 'Event & Aktivitas', icon: CalendarDays, href: '/events' },
]

const localBusinesses = [
  { name: 'Kopi Lokal Garut', type: 'Cafe & Kuliner', rating: '4.6', icon: Coffee },
  { name: 'Papandayan Homestay', type: 'Penginapan', rating: '4.8', icon: BedDouble },
  { name: 'Garut Motor Rental', type: 'Transportasi', rating: '4.7', icon: Car },
  { name: 'Dodol Garut Asli', type: 'Oleh-Oleh', rating: '4.6', icon: ShoppingBag },
]

function formatReviews(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return String(value)
}

export default async function Home() {
  const destinations = await getFeaturedPlaces(4)

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
          <a href="#local">Local Business</a>
        </nav>

        <div className="header-actions">
          <Link className="icon-button" aria-label="Search" href="/explore"><Search size={19} /></Link>
          <button className="icon-button desktop-only" aria-label="Saved"><Heart size={19} /></button>
          <button className="login-button desktop-only">Masuk / Daftar</button>
          <button className="icon-button mobile-only" aria-label="Menu"><Menu size={21} /></button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="eyebrow"><Sparkles size={16} /> GARUT, WEST JAVA</div>
          <h1>Discover Garut,<br />Like a Local.</h1>
          <p>
            Alam yang menenangkan, kuliner yang menggugah, dan cerita lokal yang selalu terasa istimewa.
          </p>

          <form className="hero-search" role="search" action="/explore">
            <Search size={20} />
            <input name="q" aria-label="Cari di VisitGarut" placeholder="Cari wisata, hotel, kuliner, atau aktivitas..." />
            <button type="button"><MapPin size={17} /> Garut</button>
            <button type="submit" className="search-submit" aria-label="Cari"><Search size={19} /></button>
          </form>
        </div>
        <div className="hero-note">Dari gunung sampai pantai,<br />semua ada di Garut.</div>
      </section>

      <section className="category-strip" aria-label="Kategori VisitGarut">
        {categories.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} className="category-item">
            <span><Icon size={23} /></span>
            <strong>{label}</strong>
          </Link>
        ))}
      </section>

      <section className="section-shell" id="explore">
        <div className="section-heading">
          <div>
            <span className="kicker">EXPLORE GARUT</span>
            <h2>Destinasi unggulan di Garut</h2>
            <p>Temukan tempat-tempat terbaik yang wajib kamu kunjungi.</p>
          </div>
          <Link href="/explore">Lihat semua <ChevronRight size={17} /></Link>
        </div>

        <div className="destination-grid">
          {destinations.map((item) => (
            <article className="destination-card" key={item.slug}>
              <Link href={`/explore/${item.slug}`} aria-label={`Lihat ${item.name}`}>
                <div className="destination-image" style={{ backgroundImage: item.cover_image_url ? `url(${item.cover_image_url})` : undefined }} />
                <div className="destination-body">
                  <h3>{item.name}</h3>
                  <p><MapPin size={14} /> {item.district ? `Kec. ${item.district}` : 'Kabupaten Garut'}</p>
                  <div className="rating"><Star size={14} fill="currentColor" /> {item.rating?.toFixed(1) ?? '—'} <span>({formatReviews(item.review_count)})</span></div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="map-feature" id="map">
        <div className="map-copy">
          <span className="kicker">VISITGARUT MAP</span>
          <h2>Jelajahi Garut lewat satu peta interaktif.</h2>
          <p>
            Temukan wisata, kuliner, penginapan, transportasi, event, dan bisnis lokal berdasarkan area dan jarak terdekat.
          </p>
          <Link className="primary-button" href="/map">Buka Peta VisitGarut <ChevronRight size={18} /></Link>
        </div>

        <div className="map-canvas" aria-label="Mockup peta VisitGarut">
          <div className="map-grid" />
          <div className="map-road road-one" />
          <div className="map-road road-two" />
          <span className="pin pin-1"><Mountain size={16} /></span>
          <span className="pin pin-2"><Coffee size={16} /></span>
          <span className="pin pin-3"><BedDouble size={16} /></span>
          <span className="pin pin-4"><Utensils size={16} /></span>
          <span className="pin pin-5"><Store size={16} /></span>
          <div className="map-label label-papandayan">Papandayan</div>
          <div className="map-label label-garut">Garut Kota</div>
          <div className="map-card">
            <div className="map-card-image" />
            <div>
              <strong>Situ Bagendit</strong>
              <span><Star size={12} fill="currentColor" /> 4.6 · 12 km</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell local-section" id="local">
        <div className="section-heading">
          <div>
            <span className="kicker">SUPPORT LOCAL</span>
            <h2>Rekomendasi bisnis lokal</h2>
            <p>Dukung pelaku usaha lokal dan temukan pengalaman autentik di Garut.</p>
          </div>
          <Link href="/explore">Lihat semua <ChevronRight size={17} /></Link>
        </div>

        <div className="business-grid">
          {localBusinesses.map(({ name, type, rating, icon: Icon }) => (
            <article className="business-card" key={name}>
              <div className="business-icon"><Icon size={24} /></div>
              <div>
                <h3>{name}</h3>
                <p>{type}</p>
                <span><Star size={13} fill="currentColor" /> {rating}</span>
              </div>
              <Heart size={18} className="business-heart" />
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div>
          <span className="kicker light">MORE THAN A DESTINATION</span>
          <h2>Explore Garut.<br />Your next story awaits.</h2>
        </div>
        <div className="cta-features">
          <span><Mountain size={25} /> Destinasi alam</span>
          <span><Utensils size={25} /> Kuliner lokal</span>
          <span><BedDouble size={25} /> Stay & transport</span>
          <span><Store size={25} /> Bisnis lokal</span>
        </div>
      </section>

      <footer>
        <Link className="brand footer-brand" href="/"><span className="brand-mark">⌃</span>Visit<span>Garut</span></Link>
        <p>Independent local discovery platform for Garut, West Java.</p>
        <p>© {new Date().getFullYear()} VisitGarut. Not affiliated with the Government of Garut Regency.</p>
      </footer>
    </main>
  )
}
