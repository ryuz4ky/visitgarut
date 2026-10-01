import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, MapPin, Route, Sparkles, WandSparkles } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'

export const metadata: Metadata = {
  title: 'Trip Planner Garut',
  description: 'Susun itinerary Garut berdasarkan area, durasi perjalanan, dan minatmu.',
  alternates: { canonical: '/trip' },
}

const starterPlans = [
  { label: '1 Hari', title: 'Garut Quick Escape', text: 'Untuk kunjungan singkat dengan 2–3 area utama.' },
  { label: '2D1N', title: 'Weekend di Garut', text: 'Kombinasi wisata, kuliner, stay, dan waktu santai.' },
  { label: '3D2N', title: 'Explore Lebih Dalam', text: 'Rute lebih luas untuk pegunungan, kota, dan area air panas.' },
]

export default function TripPage() {
  return (
    <main className="marketplace-page">
      <AppHeader />
      <section className="trip-planner-hero">
        <div className="trip-planner-inner">
          <span className="marketplace-eyebrow"><WandSparkles size={15} /> TRIP PLANNER</span>
          <h1>Rencanakan perjalanan Garut tanpa mulai dari nol.</h1>
          <p>Pilih durasi, area, dan gaya perjalanan. VisitGarut akan menjadi tempat untuk menyusun shortlist dan rute lokal dalam satu itinerary.</p>

          <div className="trip-planner-form-shell">
            <div className="trip-planner-field">
              <span><CalendarDays size={17} /> Durasi</span>
              <strong>2 hari 1 malam</strong>
            </div>
            <div className="trip-planner-field">
              <span><MapPin size={17} /> Area awal</span>
              <strong>Garut Kota</strong>
            </div>
            <div className="trip-planner-field">
              <span><Sparkles size={17} /> Gaya trip</span>
              <strong>Nature + Kuliner</strong>
            </div>
            <Link className="travel-search-submit" href="/explore"><Route size={18} /> Mulai dari rekomendasi</Link>
          </div>
        </div>
      </section>

      <section className="marketplace-shell">
        <div className="marketplace-section-heading">
          <div>
            <span className="marketplace-kicker">STARTER ITINERARIES</span>
            <h2>Pilih template perjalanan.</h2>
            <p>Versi berikutnya akan memungkinkan drag-and-drop tempat, estimasi jarak, dan penyimpanan itinerary per akun.</p>
          </div>
        </div>
        <div className="trip-template-grid">
          {starterPlans.map((plan) => (
            <article key={plan.label}>
              <span>{plan.label}</span>
              <h2>{plan.title}</h2>
              <p>{plan.text}</p>
              <Link href="/explore">Pilih tempat <Route size={16} /></Link>
            </article>
          ))}
        </div>
      </section>

      <MobileBottomNav />
    </main>
  )
}
