'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Compass, Route, Orbit, Bookmark } from 'lucide-react'

// Floating pill navigation for phones. Every route here is live on the public site.
const items = [
  { href: '/', label: 'Beranda', Icon: House, section: 'home' },
  { href: '/search', label: 'Jelajahi', Icon: Compass, section: 'explore' },
  { href: '/trip', label: 'Rencana', Icon: Route, section: 'trip', primary: true },
  { href: '/community-pulse', label: 'Cerita', Icon: Orbit, section: 'pulse' },
  { href: '/saved', label: 'Simpanan', Icon: Bookmark, section: 'saved' },
] as const

export default function MobileNavigation() {
  const pathname = usePathname() || '/'
  const section =
    pathname === '/' ? 'home' :
    pathname === '/saved' ? 'saved' :
    pathname.startsWith('/trip') ? 'trip' :
    (pathname.startsWith('/community-pulse') || pathname === '/pulse-globe-demo') ? 'pulse' :
    'explore'

  return <nav className="vg-mobile-nav" aria-label="Navigasi utama seluler">
    {items.map(({ href, label, Icon, section: itemSection, ...rest }) => {
      const active = section === itemSection
      const primary = 'primary' in rest && rest.primary
      return <Link key={href} href={href} className={[primary ? 'is-primary' : '', active ? 'is-active' : ''].join(' ').trim() || undefined}
        aria-current={active ? 'page' : undefined} aria-label={primary ? label : undefined}>
        <Icon aria-hidden="true" size={primary ? 24 : 21} strokeWidth={1.9}/>
        {!primary && <span>{label}</span>}
      </Link>
    })}
  </nav>
}
