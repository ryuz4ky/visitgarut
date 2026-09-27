import Link from 'next/link'
import { Heart, Menu, Search } from 'lucide-react'

type Card = {
  eyebrow: string
  title: string
  description: string
}

type SimpleLandingProps = {
  eyebrow: string
  title: string
  description: string
  cards: Card[]
}

export default function SimpleLanding({ eyebrow, title, description, cards }: SimpleLandingProps) {
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
          <Link href="/#local">Local Business</Link>
        </nav>
        <div className="header-actions">
          <Link className="icon-button" href="/explore" aria-label="Search"><Search size={19} /></Link>
          <button className="icon-button desktop-only" aria-label="Saved"><Heart size={19} /></button>
          <button className="login-button desktop-only">Masuk / Daftar</button>
          <button className="icon-button mobile-only" aria-label="Menu"><Menu size={21} /></button>
        </div>
      </header>

      <section className="simple-landing">
        <div className="simple-landing-inner">
          <span className="kicker">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="simple-landing-lead">{description}</p>

          <div className="simple-landing-grid">
            {cards.map((card) => (
              <article className="simple-landing-card" key={card.title}>
                <span>{card.eyebrow}</span>
                <div>
                  <h2>{card.title}</h2>
                  <p>{card.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="simple-landing-actions">
            <Link className="primary-button" href="/explore">Jelajahi destinasi</Link>
            <Link className="secondary-button" href="/">Kembali ke beranda</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
