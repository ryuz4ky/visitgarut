'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, MapPinned, BookOpenText, Orbit, Route } from 'lucide-react'

// Routes in this navigation are live on the current public MVP.
const items = [
  { href: '/search', label: 'Jelajahi', Icon: Compass, section: 'explore' },
  { href: '/map', label: 'Peta', Icon: MapPinned, section: 'map' },
  { href: '/trip', label: 'Trip', Icon: Route, section: 'trip' },
  { href: '/artikel', label: 'Artikel', Icon: BookOpenText, section: 'articles' },
  { href: '/community-pulse', label: 'Pulse', Icon: Orbit, section: 'pulse' },
] as const

export default function MobileNavigation() {
  const pathname = usePathname() || '/'
  const section =
    pathname === '/saved' ? 'saved' :
    pathname === '/map' ? 'map' :
    pathname === '/trip' ? 'trip' :
    pathname.startsWith('/artikel') ? 'articles' :
    (pathname.startsWith('/community-pulse') || pathname === '/pulse-globe-demo') ? 'pulse' :
    'explore'

  return <nav className="vg-mobile-nav" aria-label="Navigasi utama seluler">
    {items.map(({ href, label, Icon, section: itemSection }) =>
      <Link key={href} href={href} className={section === itemSection ? 'is-active' : undefined}
        aria-current={section === itemSection ? 'page' : undefined}>
        <Icon aria-hidden="true" size={20} strokeWidth={1.9}/>
        <span>{label}</span>
      </Link>)}
  </nav>
}
