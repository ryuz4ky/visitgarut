import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import PartnerDashboard from '@/components/PartnerDashboard'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Partner Center',
  description: 'Kelola listing, offer, dan inquiry traveler untuk partner VisitGarut.',
  robots: { index: false, follow: true },
}

export default async function PartnerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partner')

  const { data: claims } = await supabase
    .from('place_claims')
    .select('place:places(id, name, slug, district)')
    .eq('user_id', user.id)
    .eq('status', 'approved')

  const places = (claims ?? [])
    .map((row: Record<string, unknown>) => Array.isArray(row.place) ? row.place[0] : row.place)
    .filter(Boolean) as Array<{ id: string; name: string; slug: string; district: string | null }>

  if (!places.length) {
    return (
      <main className="marketplace-page partner-page">
        <AppHeader />
        <section className="partner-hero">
          <div>
            <span className="marketplace-eyebrow">VISITGARUT PARTNER CENTER</span>
            <h1>Kelola bisnis lokalmu di VisitGarut.</h1>
            <p>Partner Center tersedia setelah claim listing diverifikasi dan disetujui.</p>
          </div>
        </section>
        <section className="marketplace-shell partner-access-state">
          <h2>Belum ada listing yang disetujui.</h2>
          <p>Ajukan claim dari halaman listing bisnis atau destinasi yang kamu kelola. Setelah approved, dashboard partner akan aktif otomatis.</p>
          <a href="/explore">Cari listing untuk di-claim</a>
        </section>
        <MobileBottomNav />
      </main>
    )
  }

  const placeIds = places.map((place) => place.id)
  const [offersResult, leadsResult] = await Promise.all([
    supabase
      .from('offers')
      .select('id, place_id, title, description, promo_code, price_label, cta_url, valid_until, status, is_featured')
      .in('place_id', placeIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('booking_leads')
      .select('id, place_id, source, intent, full_name, email, phone, message, status, created_at')
      .in('place_id', placeIds)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <main className="marketplace-page partner-page">
      <AppHeader />
      <section className="partner-hero">
        <div>
          <span className="marketplace-eyebrow">VISITGARUT PARTNER CENTER</span>
          <h1>Listing, promo, dan inquiry dalam satu dashboard.</h1>
          <p>Kelola inventory lokal, publikasikan offer yang valid, dan tindak lanjuti traveler yang sudah menunjukkan intent.</p>
        </div>
      </section>
      <div className="marketplace-shell partner-shell">
        <PartnerDashboard
          userId={user.id}
          places={places}
          offers={(offersResult.data ?? []) as never}
          leads={(leadsResult.data ?? []) as never}
        />
      </div>
      <MobileBottomNav />
    </main>
  )
}
