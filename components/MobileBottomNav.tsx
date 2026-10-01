import Link from 'next/link'
import { Compass, Home, Map, Route } from 'lucide-react'

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/trip', label: 'Trip', icon: Route },
]

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navigasi mobile">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}>
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
