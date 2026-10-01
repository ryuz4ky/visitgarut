import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, MapPin, Route, Sparkles, WandSparkles } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import TripPlannerClient from '@/components/TripPlannerClient'
import { getPlaceBySlug } from '@/lib/data/places'
import { createClient } from '@/lib/supabase/server'

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

type TripPageProps = {
  searchParams: Promise<{ place?: string }>
}

export default async function TripPage({ searchParams }: TripPageProps) {
  const { place: placeSlug } = await searchParams
  const selectedPlace = placeSlug ? await getPlaceBySlug(placeSlug) : null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let trips: Array<{ id: string; title: string; trip_start: string | null; trip_end: string | null; status: string; item_count: number }> = []

  if (user) {
    const { data } = await supabase
      .from('itineraries')
      .select('id, title, trip_start, trip_end, status, itinerary_items(count)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    trips = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      title: String(row.title),
      trip_start: (row.trip_start as string | null) ?? null,
      trip_end: (row.trip_end as string | null) ?? null,
      status: String(row.status),
      item_count: Array.isArray(row.itinerary_items)
        ? Number((row.itinerary_items[0] as { count?: number } | undefined)?.count ?? 0)
        : 0,
    }))
  }

  return (
    <main className="marketplace-page">
      <AppHeader />
      <section className="trip-planner-hero">
        <div className="trip-planner-inner">
          <span className="marketplace-eyebrow"><WandSparkles size={15} /> TRIP PLANNER</span>
          <h1>Rencanakan perjalanan Garut tanpa mulai dari nol.</h1>
          <p>Pilih durasi, simpan tempat, dan susun rute per hari. Semua tersimpan di akun VisitGarut kamu.</p>

          {!user ? (
            <div className="trip-planner-form-shell">
              <div className="trip-planner-field"><span><CalendarDays size={17} /> Durasi</span><strong>Fleksibel</strong></div>
              <div className="trip-planner-field"><span><MapPin size={17} /> Area awal</span><strong>Garut</strong></div>
              <div className="trip-planner-field"><span><Sparkles size={17} /> Akun</span><strong>Diperlukan untuk menyimpan</strong></div>
              <Link className="travel-search-submit" href={`/login?next=${encodeURIComponent(placeSlug ? `/trip?place=${placeSlug}` : '/trip')}`}><Route size={18} /> Masuk untuk membuat trip</Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="marketplace-shell trip-functional-shell">
        {user ? (
          <TripPlannerClient
            userId={user.id}
            trips={trips}
            selectedPlace={selectedPlace?.id ? { id: selectedPlace.id, name: selectedPlace.name, slug: selectedPlace.slug, district: selectedPlace.district } : null}
          />
        ) : (
          <div className="trip-guest-panel">
            <Route size={34} />
            <h2>Simpan itinerary lintas perangkat.</h2>
            <p>Masuk atau daftar gratis untuk menyimpan tempat favorit, itinerary harian, dan rencana perjalanan Garut.</p>
            <Link href={`/login?next=${encodeURIComponent(placeSlug ? `/trip?place=${placeSlug}` : '/trip')}`}>Masuk / Daftar</Link>
          </div>
        )}
      </section>

      <section className="marketplace-shell">
        <div className="marketplace-section-heading">
          <div>
            <span className="marketplace-kicker">STARTER ITINERARIES</span>
            <h2>Inspirasi untuk mulai.</h2>
            <p>Gunakan template ini sebagai ide, lalu pilih tempat aktual dari Explore.</p>
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
