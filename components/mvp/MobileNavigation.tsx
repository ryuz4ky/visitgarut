'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, MapPinned, BookOpenText, Orbit } from 'lucide-react'

// Routes in this navigation are live on the current public MVP.
// AI Trip deliberately stays out until /trip actually serves a planner.
const items = [
  { href: '/search', label: 'Jelajahi', Icon: Compass, section: 'explore' },
  { href: '/map', label: 'Peta', Icon: MapPinned, section: 'map' },
  { href: '/artikel', label: 'Artikel', Icon: BookOpenText, section: 'articles' },
  { href: '/community-pulse', label: 'Pulse', Icon: Orbit, section: 'pulse' },
] as const

export default function MobileNavigation() {
  const pathname = usePathname() || '/'
  const section =
    pathname === '/map' ? 'map' :
    pathname.startsWith('/artikel') ? 'articles' :
    pathname.startsWith('/community-pulse') ? 'pulse' :
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
