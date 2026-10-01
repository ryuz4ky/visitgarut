import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import TripDetailEditor from '@/components/TripDetailEditor'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Edit Itinerary',
  robots: { index: false, follow: true },
}

type TripDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trip/${id}`)}`)

  const [tripResult, itemsResult, favoritesResult] = await Promise.all([
    supabase
      .from('itineraries')
      .select('id, title, trip_start, trip_end, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('itinerary_items')
      .select('id, day_number, position, note, place:places(id, name, slug, district, cover_image_url)')
      .eq('itinerary_id', id)
      .order('day_number', { ascending: true })
      .order('position', { ascending: true }),
    supabase
      .from('favorites')
      .select('place:places(id, name, slug, district, cover_image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (!tripResult.data) notFound()

  const items = (itemsResult.data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    day_number: Number(row.day_number ?? 1),
    position: Number(row.position ?? 0),
    note: (row.note as string | null) ?? null,
    place: Array.isArray(row.place) ? row.place[0] ?? null : row.place ?? null,
  }))

  const favoritePlaces = (favoritesResult.data ?? [])
    .map((row: Record<string, unknown>) => Array.isArray(row.place) ? row.place[0] ?? null : row.place ?? null)
    .filter(Boolean)

  return (
    <main className="marketplace-page trip-detail-page">
      <AppHeader />
      <section className="trip-detail-hero">
        <div>
          <span className="marketplace-eyebrow">YOUR ITINERARY</span>
          <h1>{tripResult.data.title}</h1>
          <p>Susun tempat per hari, tambahkan catatan, dan simpan perubahan ke akun VisitGarut.</p>
        </div>
      </section>
      <section className="marketplace-shell trip-detail-shell">
        <TripDetailEditor
          trip={tripResult.data}
          items={items as never}
          favoritePlaces={favoritePlaces as never}
        />
      </section>
      <MobileBottomNav />
    </main>
  )
}
