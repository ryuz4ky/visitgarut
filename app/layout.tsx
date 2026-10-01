import type { Metadata } from 'next'
import { siteUrl } from '@/lib/site'
import './globals.css'
import './discovery.css'
import './marketplace.css'
import './trip.css'
import './vertical.css'
import './app-features.css'
import './nearby-enhancements.css'
import './transaction-partner.css'
import './booking-funnel.css'
import './partner-availability.css'
import './admin.css'
import './catalog.css'
import './search-map.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'VisitGarut — Wisata, Stay, Kuliner & Transport Garut',
    template: '%s | VisitGarut',
  },
  description:
    'Temukan wisata, penginapan, rental mobil dan motor, kuliner, event, serta bisnis lokal Garut dalam satu platform discovery dan trip planner.',
  keywords: [
    'Garut',
    'wisata Garut',
    'kuliner Garut',
    'hotel Garut',
    'rental motor Garut',
    'rental mobil Garut',
    'event Garut',
    'VisitGarut',
  ],
  openGraph: {
    title: 'VisitGarut — Semua kebutuhan perjalanan Garut dalam satu tempat',
    description:
      'Jelajahi destinasi, penginapan, transportasi, kuliner, event, dan bisnis lokal Garut.',
    url: siteUrl,
    siteName: 'VisitGarut',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VisitGarut — Discover Garut Like a Local',
    description: 'Platform lokal untuk menjelajahi Garut: wisata, stay, rental, kuliner, event, dan map.',
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
