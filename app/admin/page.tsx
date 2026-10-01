import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import AdminDashboard from '@/components/AdminDashboard'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Admin Operations',
  description: 'Moderasi review, verifikasi claim, dan kelola listing VisitGarut.',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return (
      <main className="marketplace-page admin-page">
        <AppHeader />
        <section className="admin-hero">
          <div>
            <span className="marketplace-eyebrow">VISITGARUT OPERATIONS</span>
            <h1>Admin access required.</h1>
            <p>Akun ini belum memiliki role admin. Dashboard operasional hanya tersedia untuk operator VisitGarut yang diotorisasi.</p>
            <Link href="/account">Kembali ke akun</Link>
          </div>
        </section>
        <MobileBottomNav />
      </main>
    )
  }

  const [claimsResult, reviewsResult, placesResult, leadsResult, offersResult] = await Promise.all([
    supabase
      .from('place_claims')
      .select('id, status, business_email, phone, note, created_at, place:places(id, name, slug, district)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('reviews')
      .select('id, rating, body, status, created_at, place:places(id, name, slug)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('places')
      .select('id, name, slug, district, status, is_featured, is_verified, rating, review_count')
      .order('updated_at', { ascending: false })
      .limit(200),
    supabase
      .from('booking_leads')
      .select('id, status, intent, created_at, place:places(name, slug)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('offers')
      .select('id, status, title, created_at, place:places(name, slug)')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <main className="marketplace-page admin-page">
      <AppHeader />
      <section className="admin-hero">
        <div>
          <span className="marketplace-eyebrow"><ShieldCheck size={16} /> VISITGARUT OPERATIONS</span>
          <h1>Trust, quality, dan marketplace operations.</h1>
          <p>Moderasi kontribusi traveler, verifikasi pemilik bisnis, dan jaga kualitas listing dari satu dashboard.</p>
        </div>
      </section>
      <div className="marketplace-shell admin-shell">
        <AdminDashboard
          userId={user.id}
          operatorName={profile.full_name || profile.username || 'VisitGarut Admin'}
          claims={(claimsResult.data ?? []) as never}
          reviews={(reviewsResult.data ?? []) as never}
          places={(placesResult.data ?? []) as never}
          leads={(leadsResult.data ?? []) as never}
          offers={(offersResult.data ?? []) as never}
        />
      </div>
      <MobileBottomNav />
    </main>
  )
}
