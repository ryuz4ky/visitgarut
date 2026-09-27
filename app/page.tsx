import {
  BedDouble,
  CalendarDays,
  Car,
  ChevronRight,
  Coffee,
  Compass,
  Heart,
  Map,
  MapPin,
  Menu,
  Mountain,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Utensils,
} from "lucide-react";

const categories = [
  { label: "Atraksi Wisata", icon: Mountain },
  { label: "Cafe & Kuliner", icon: Coffee },
  { label: "Hotel & Penginapan", icon: BedDouble },
  { label: "Rental Motor", icon: Compass },
  { label: "Rental Mobil", icon: Car },
  { label: "Oleh-Oleh", icon: ShoppingBag },
  { label: "Event & Aktivitas", icon: CalendarDays },
];

const destinations = [
  {
    name: "Gunung Papandayan",
    location: "Cisurupan",
    rating: "4.8",
    reviews: "1.2k",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Darajat Pass",
    location: "Pasirwangi",
    rating: "4.7",
    reviews: "980",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Cipanas Garut",
    location: "Tarogong Kaler",
    rating: "4.6",
    reviews: "860",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Situ Bagendit",
    location: "Banyuresmi",
    rating: "4.5",
    reviews: "720",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1000&q=85",
  },
];

const localBusinesses = [
  { name: "Kopi Lokal Garut", type: "Cafe & Kuliner", rating: "4.6", icon: Coffee },
  { name: "Papandayan Homestay", type: "Penginapan", rating: "4.8", icon: BedDouble },
  { name: "Garut Motor Rental", type: "Transportasi", rating: "4.7", icon: Car },
  { name: "Dodol Garut Asli", type: "Oleh-Oleh", rating: "4.6", icon: ShoppingBag },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="VisitGarut home">
          <span className="brand-mark">⌃</span>
          <span>Visit<span>Garut</span></span>
        </a>

        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#explore">Explore</a>
          <a href="#stay">Stay</a>
          <a href="#eat">Eat</a>
          <a href="#transport">Transport</a>
          <a href="#events">Events</a>
          <a href="#local">Local Business</a>
        </nav>

        <div className="header-actions">
          <button className="icon-button" aria-label="Search"><Search size={19} /></button>
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

          <div className="hero-search" role="search">
            <Search size={20} />
            <input aria-label="Cari di VisitGarut" placeholder="Cari wisata, hotel, kuliner, atau aktivitas..." />
            <button><MapPin size={17} /> Garut</button>
            <button className="search-submit" aria-label="Cari"><Search size={19} /></button>
          </div>
        </div>
        <div className="hero-note">Dari gunung sampai pantai,<br />semua ada di Garut.</div>
      </section>

      <section className="category-strip" aria-label="Kategori VisitGarut">
        {categories.map(({ label, icon: Icon }) => (
          <a key={label} href="#explore" className="category-item">
            <span><Icon size={23} /></span>
            <strong>{label}</strong>
          </a>
        ))}
      </section>

      <section className="section-shell" id="explore">
        <div className="section-heading">
          <div>
            <span className="kicker">EXPLORE GARUT</span>
            <h2>Destinasi unggulan di Garut</h2>
            <p>Temukan tempat-tempat terbaik yang wajib kamu kunjungi.</p>
          </div>
          <a href="#map">Lihat semua <ChevronRight size={17} /></a>
        </div>

        <div className="destination-grid">
          {destinations.map((item) => (
            <article className="destination-card" key={item.name}>
              <div className="destination-image" style={{ backgroundImage: `url(${item.image})` }}>
                <button aria-label={`Simpan ${item.name}`}><Heart size={18} /></button>
              </div>
              <div className="destination-body">
                <h3>{item.name}</h3>
                <p><MapPin size={14} /> Kec. {item.location}</p>
                <div className="rating"><Star size={14} fill="currentColor" /> {item.rating} <span>({item.reviews})</span></div>
              </div>
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
          <button className="primary-button">Buka Peta VisitGarut <ChevronRight size={18} /></button>
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
              <span><Star size={12} fill="currentColor" /> 4.5 · 12 km</span>
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
          <a href="#">Lihat semua <ChevronRight size={17} /></a>
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
        <a className="brand footer-brand" href="#top"><span className="brand-mark">⌃</span>Visit<span>Garut</span></a>
        <p>Independent local discovery platform for Garut, West Java.</p>
        <p>© {new Date().getFullYear()} VisitGarut. Not affiliated with the Government of Garut Regency.</p>
      </footer>
    </main>
  );
}
