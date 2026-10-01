import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BriefcaseBusiness } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import AccountDashboard from '@/components/AccountDashboard'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Akun Saya',
  description: 'Kelola profil, favorit, itinerary, dan claim bisnis VisitGarut.',
  robots: { index: false, follow: true },
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/account')

  const [profileResult, favoritesResult, itinerariesResult, claimsResult] = await Promise.all([
    supabase.from('profiles').select('full_name, username, avatar_url').eq('id', user.id).maybeSingle(),
    supabase
      .from('favorites')
      .select('created_at, place:places(id, name, slug, district, cover_image_url, rating)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('itineraries')
      .select('id, title, trip_start, trip_end, status, updated_at, itinerary_items(count)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('place_claims')
      .select('id, status, created_at, place:places(name, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const favorites = (favoritesResult.data ?? []).map((row: Record<string, unknown>) => ({
    created_at: String(row.created_at),
    place: Array.isArray(row.place) ? row.place[0] ?? null : row.place ?? null,
  }))

  const itineraries = (itinerariesResult.data ?? []).map((row: Record<string, unknown>) => {
    const countValue = Array.isArray(row.itinerary_items)
      ? Number((row.itinerary_items[0] as { count?: number } | undefined)?.count ?? 0)
      : 0
    return {
      id: String(row.id),
      title: String(row.title),
      trip_start: (row.trip_start as string | null) ?? null,
      trip_end: (row.trip_end as string | null) ?? null,
      status: String(row.status),
      updated_at: String(row.updated_at),
      item_count: countValue,
    }
  })

  const claims = (claimsResult.data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    status: String(row.status),
    created_at: String(row.created_at),
    place: Array.isArray(row.place) ? row.place[0] ?? null : row.place ?? null,
  }))
  const hasApprovedClaim = claims.some((claim) => claim.status === 'approved')

  return (
    <main className="marketplace-page account-page">
      <AppHeader />
      <section className="account-hero">
        <div>
          <span className="marketplace-eyebrow">PERSONAL TRAVEL SPACE</span>
          <h1>Perjalanan Garut kamu, tersimpan rapi.</h1>
          <p>Kelola tempat favorit, itinerary, profil, dan listing bisnis dari satu dashboard.</p>
          {hasApprovedClaim ? <Link className="account-partner-cta" href="/partner"><BriefcaseBusiness size={17} /> Buka Partner Center</Link> : null}
        </div>
      </section>
      <div className="marketplace-shell account-shell">
        <AccountDashboard
          userId={user.id}
          email={user.email ?? ''}
          profile={profileResult.data ?? null}
          favorites={favorites as never}
          itineraries={itineraries}
          claims={claims as never}
        />
      </div>
      <MobileBottomNav />
    </main>
  )
}
