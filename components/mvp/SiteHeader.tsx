'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Bookmark } from 'lucide-react'

const links = [
  { href: '/search', label: 'Jelajahi', match: (p: string) => p === '/search' || p === '/explore' || /^\/(wisata|hotel|kuliner|cafe|transportasi|paket-wisata)(\/|$)/.test(p) },
  { href: '/trip', label: 'Rencana', match: (p: string) => p.startsWith('/trip') },
  { href: '/map', label: 'Peta', match: (p: string) => p === '/map' },
  { href: '/community-pulse', label: 'Pulse', match: (p: string) => p.startsWith('/community-pulse') },
  { href: '/artikel', label: 'Panduan', match: (p: string) => p.startsWith('/artikel') },
]

export function Wordmark({ tone = 'ink' }: { tone?: 'ink' | 'light' }) {
  return <span className={`vg-wordmark vg-wordmark-${tone}`}>visitgarut<span aria-hidden="true">.</span></span>
}

export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname() || '/'
  return <div className={overlay ? 'vg-header vg-header-overlay' : 'vg-header'}>
    <header className="vg-header-bar">
      <Link className="vg-brand" href="/" aria-label="VisitGarut beranda"><Wordmark tone={overlay ? 'light' : 'ink'}/></Link>
      <nav className="vg-header-links" aria-label="Navigasi utama">
        {links.map(l => {
          const active = l.match(pathname)
          return <Link key={l.href} href={l.href} className={active ? 'is-active' : undefined} aria-current={active ? 'page' : undefined}>{l.label}</Link>
        })}
      </nav>
      <Link className="vg-header-icon" href="/saved" aria-label="Tempat tersimpan"><Bookmark size={19} aria-hidden="true"/></Link>
      <Link className="vg-pill-cta vg-header-cta" href="/trip">Susun rencana<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link>
    </header>
  </div>
}
