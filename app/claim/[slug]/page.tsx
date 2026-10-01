import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, ShieldCheck } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import ClaimBusinessForm from '@/components/ClaimBusinessForm'
import MobileBottomNav from '@/components/MobileBottomNav'
import { getPlaceBySlug } from '@/lib/data/places'
import { createClient } from '@/lib/supabase/server'

type ClaimPageProps = {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Claim Bisnis',
  description: 'Ajukan verifikasi kepemilikan listing bisnis di VisitGarut.',
  robots: { index: false, follow: true },
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { slug } = await params
  const place = await getPlaceBySlug(slug)
  if (!place?.id) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/claim/${slug}`)}`)

  const { data: existingClaim } = await supabase
    .from('place_claims')
    .select('status')
    .eq('place_id', place.id)
    .eq('user_id', user.id)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  return (
    <main className="marketplace-page claim-page">
      <AppHeader />
      <section className="claim-hero">
        <div>
          <Link href={`/explore/${place.slug}`} className="claim-back"><ArrowLeft size={16} /> Kembali ke listing</Link>
          <span className="marketplace-eyebrow"><BriefcaseBusiness size={15} /> BUSINESS OWNERS</span>
          <h1>Claim {place.name}</h1>
          <p>Verifikasi hubungan kamu dengan listing ini agar VisitGarut dapat menyiapkan akses pengelolaan bisnis secara bertahap.</p>
        </div>
      </section>

      <section className="marketplace-shell claim-shell">
        <div className="claim-info-panel">
          <span className="marketplace-kicker">WHY CLAIM?</span>
          <h2>Bangun presence lokal yang lebih akurat.</h2>
          <div className="claim-benefit"><BadgeCheck size={21} /><div><strong>Verified ownership</strong><p>Tandai hubungan resmi pemilik/pengelola dengan listing.</p></div></div>
          <div className="claim-benefit"><ShieldCheck size={21} /><div><strong>Controlled updates</strong><p>Menjadi fondasi untuk update jam buka, kontak, fasilitas, promo, dan booking lead.</p></div></div>
          <div className="claim-benefit"><BriefcaseBusiness size={21} /><div><strong>Partner features</strong><p>Siapkan listing untuk offer, featured placement, dan dashboard partner.</p></div></div>
        </div>
        <div className="claim-form-panel">
          <h2>Ajukan verifikasi</h2>
          <p>Isi kontak yang bisa digunakan untuk memverifikasi kepemilikan atau hubungan operasional.</p>
          <ClaimBusinessForm
            placeId={place.id}
            userId={user.id}
            defaultEmail={user.email ?? ''}
            existingStatus={existingClaim?.status ?? null}
          />
        </div>
      </section>
      <MobileBottomNav />
    </main>
  )
}
