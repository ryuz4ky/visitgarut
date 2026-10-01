import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import PartnerAvailabilityManager from '@/components/PartnerAvailabilityManager'
import PartnerDashboard from '@/components/PartnerDashboard'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Partner Center',
  description: 'Kelola listing, inventory, offer, availability, dan inquiry traveler untuk partner VisitGarut.',
  robots: { index: false, follow: true },
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
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
        <section className="partner-hero"><div><span className="marketplace-eyebrow">VISITGARUT PARTNER CENTER</span><h1>Kelola bisnis lokalmu di VisitGarut.</h1><p>Partner Center tersedia setelah claim listing diverifikasi dan disetujui.</p></div></section>
        <section className="marketplace-shell partner-access-state"><h2>Belum ada listing yang disetujui.</h2><p>Ajukan claim dari halaman listing bisnis atau destinasi yang kamu kelola. Setelah approved, dashboard partner akan aktif otomatis.</p><a href="/explore">Cari listing untuk di-claim</a></section>
        <MobileBottomNav />
      </main>
    )
  }

  const placeIds = places.map((place) => place.id)
  const [offersResult, leadsResult, inventoryResult] = await Promise.all([
    supabase.from('offers').select('id, place_id, title, description, promo_code, price_label, cta_url, valid_until, status, is_featured').in('place_id', placeIds).order('created_at', { ascending: false }),
    supabase.from('booking_leads').select('id, place_id, source, intent, full_name, email, phone, message, status, created_at').in('place_id', placeIds).order('created_at', { ascending: false }).limit(100),
    supabase.from('inventory_items').select('id, place_id, item_type, name, description, price_amount, currency, price_unit, booking_url, status').in('place_id', placeIds).order('created_at', { ascending: false }),
  ])

  const inventory = (inventoryResult.data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    price_amount: row.price_amount == null ? null : Number(row.price_amount),
  }))
  const inventoryIds = inventory.map((row) => String(row.id))

  const today = new Date()
  const horizon = new Date(today)
  horizon.setDate(horizon.getDate() + 90)

  const availabilityResult = inventoryIds.length
    ? await supabase
        .from('inventory_availability')
        .select('id, inventory_item_id, available_date, quantity_available, price_amount, currency, status')
        .in('inventory_item_id', inventoryIds)
        .gte('available_date', toIsoDate(today))
        .lte('available_date', toIsoDate(horizon))
        .order('available_date', { ascending: true })
        .limit(1000)
    : { data: [], error: null }

  const availability = (availabilityResult.data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    quantity_available: Number(row.quantity_available ?? 0),
    price_amount: row.price_amount == null ? null : Number(row.price_amount),
  }))

  return (
    <main className="marketplace-page partner-page">
      <AppHeader />
      <section className="partner-hero"><div><span className="marketplace-eyebrow">VISITGARUT PARTNER CENTER</span><h1>Listing, inventory, availability, promo, dan inquiry dalam satu dashboard.</h1><p>Kelola room, kendaraan, produk, paket, kalender stok, offer, dan traveler intent dari satu tempat.</p></div></section>
      <div className="marketplace-shell partner-shell">
        <PartnerDashboard userId={user.id} places={places} offers={(offersResult.data ?? []) as never} leads={(leadsResult.data ?? []) as never} inventory={inventory as never} />
        <PartnerAvailabilityManager places={places} inventory={inventory as never} availability={availability as never} />
      </div>
      <MobileBottomNav />
    </main>
  )
}
